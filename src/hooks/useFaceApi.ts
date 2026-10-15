"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type * as FaceApiType from "@vladmandic/face-api";

let faceapiInstance: typeof FaceApiType | null = null;
let modelsLoadedPromise: Promise<void> | null = null;

async function getFaceApi(): Promise<typeof FaceApiType> {
  if (faceapiInstance) return faceapiInstance;
  const mod = await import("@vladmandic/face-api");
  faceapiInstance = mod;
  return mod;
}

export interface FaceDetail {
  descriptor: Float32Array;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
    imageWidth: number;
    imageHeight: number;
  };
}

export function useFaceApi() {
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadModels = useCallback(async (): Promise<boolean> => {
    if (modelsLoadedPromise) {
      try {
        await modelsLoadedPromise;
        if (isMounted.current) {
          setIsModelLoaded(true);
          setIsModelLoading(false);
        }
        return true;
      } catch (err: unknown) {
        if (isMounted.current) {
          setModelError(
            err instanceof Error ? err.message : "Gagal memuat model AI.",
          );
          setIsModelLoading(false);
        }
        return false;
      }
    }

    setIsModelLoading(true);
    setModelError(null);

    modelsLoadedPromise = (async () => {
      const faceapi = await getFaceApi();

      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
    })();

    try {
      await modelsLoadedPromise;
      if (isMounted.current) {
        setIsModelLoaded(true);
        setIsModelLoading(false);
      }
      return true;
    } catch (err: unknown) {
      modelsLoadedPromise = null;
      const message =
        err instanceof Error ? err.message : "Gagal memuat model face-api.";
      if (isMounted.current) {
        setModelError(message);
        setIsModelLoading(false);
      }
      return false;
    }
  }, []);

  // Preload models automatically on mount
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const extractSingleDescriptor = useCallback(
    async (
      input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    ): Promise<Float32Array | null> => {
      const faceapi = await getFaceApi();
      if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
        await loadModels();
      }

      // Detect faces using SSD MobileNet
      let detections = await faceapi
        .detectAllFaces(
          input,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }),
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Fallback with TinyFaceDetector if lighting/angle is tricky
      if (detections.length === 0) {
        detections = await faceapi
          .detectAllFaces(
            input,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 512,
              scoreThreshold: 0.35,
            }),
          )
          .withFaceLandmarks()
          .withFaceDescriptors();
      }

      if (detections.length === 0) {
        return null;
      }

      // If multiple faces detected, select the largest bounding box area (the main user)
      const primaryFace = detections.reduce((prev, curr) => {
        const prevArea = prev.detection.box.width * prev.detection.box.height;
        const currArea = curr.detection.box.width * curr.detection.box.height;
        return currArea > prevArea ? curr : prev;
      });

      return primaryFace.descriptor;
    },
    [loadModels],
  );

  const extractAllFaces = useCallback(
    async (
      input: HTMLImageElement | HTMLCanvasElement,
    ): Promise<FaceDetail[]> => {
      const faceapi = await getFaceApi();
      if (
        !faceapi.nets.ssdMobilenetv1.isLoaded ||
        !faceapi.nets.tinyFaceDetector.isLoaded
      ) {
        await loadModels();
      }

      const imgWidth =
        "naturalWidth" in input
          ? input.naturalWidth || input.width
          : input.width;
      const imgHeight =
        "naturalHeight" in input
          ? input.naturalHeight || input.height
          : input.height;

      // Pass 1: SSD MobileNet with high sensitivity (minConfidence 0.22)
      // High accuracy for front faces, tilted profiles, and small faces in 1 pass
      const ssdResults = await faceapi
        .detectAllFaces(
          input,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.22 }),
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Helper: Calculate Intersection over Union
      const calcIoU = (
        boxA: { x: number; y: number; width: number; height: number },
        boxB: { x: number; y: number; width: number; height: number },
      ) => {
        const x1 = Math.max(boxA.x, boxB.x);
        const y1 = Math.max(boxA.y, boxB.y);
        const x2 = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
        const y2 = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);
        const interArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
        const areaA = boxA.width * boxA.height;
        const areaB = boxB.width * boxB.height;
        const unionArea = areaA + areaB - interArea;
        return unionArea <= 0 ? 0 : interArea / unionArea;
      };

      // Pass 2: Smart Crowd/Angled Booster
      // If SSD detected fewer than 6 faces, run lightweight TinyFaceDetector (inputSize 512)
      // to catch distant, running, or heavily angled faces without overloading GPU
      const merged = [...ssdResults];
      if (ssdResults.length < 6) {
        const tinyResults = await faceapi
          .detectAllFaces(
            input,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 512,
              scoreThreshold: 0.26,
            }),
          )
          .withFaceLandmarks()
          .withFaceDescriptors();

        for (const tiny of tinyResults) {
          const isDuplicate = ssdResults.some(
            (ssd) => calcIoU(tiny.detection.box, ssd.detection.box) > 0.25,
          );
          if (!isDuplicate) {
            merged.push(tiny);
          }
        }
      }

      // Filter: Validate human face geometry (angle-invariant)
      const verifiedFaces: FaceDetail[] = [];

      for (const face of merged) {
        const box = face.detection.box;

        // Minimum dimensions: Face must be at least 14x14 px (catches distant group photo faces)
        if (box.width < 14 || box.height < 14) continue;

        // Aspect ratio: Human faces have width/height ratio between 0.45 and 1.65 (covers tilted & side angles)
        const aspect = box.width / box.height;
        if (aspect < 0.45 || aspect > 1.65) continue;

        // Landmark validation: Check landmark span to reject random collapsed textures/patterns
        const landmarks = face.landmarks;
        if (landmarks && landmarks.positions.length >= 68) {
          const xs = landmarks.positions.map((p) => p.x);
          const ys = landmarks.positions.map((p) => p.y);
          const landmarkSpanW = Math.max(...xs) - Math.min(...xs);
          const landmarkSpanH = Math.max(...ys) - Math.min(...ys);

          // Landmarks must span at least 20% of the box dimensions (works on side angles and tilted heads)
          if (
            landmarkSpanW < box.width * 0.2 ||
            landmarkSpanH < box.height * 0.2
          ) {
            continue;
          }
        }

        verifiedFaces.push({
          descriptor: face.descriptor,
          box: {
            x: Math.round(box.x),
            y: Math.round(box.y),
            width: Math.round(box.width),
            height: Math.round(box.height),
            imageWidth: imgWidth || 800,
            imageHeight: imgHeight || 600,
          },
        });
      }

      return verifiedFaces;
    },
    [loadModels],
  );

  const extractAllDescriptors = useCallback(
    async (
      input: HTMLImageElement | HTMLCanvasElement,
    ): Promise<Float32Array[]> => {
      const faces = await extractAllFaces(input);
      return faces.map((f) => f.descriptor);
    },
    [extractAllFaces],
  );

  const calculateDistance = useCallback(
    (desc1: Float32Array, desc2: Float32Array): number => {
      if (!faceapiInstance) {
        let sum = 0;
        for (let i = 0; i < desc1.length; i++) {
          const diff = desc1[i] - desc2[i];
          sum += diff * diff;
        }
        return Math.sqrt(sum);
      }
      return faceapiInstance.euclideanDistance(desc1, desc2);
    },
    [],
  );

  return {
    isModelLoading,
    isModelLoaded,
    modelError,
    loadModels,
    extractSingleDescriptor,
    extractAllFaces,
    extractAllDescriptors,
    calculateDistance,
  };
}

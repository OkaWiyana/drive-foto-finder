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

  const extractAllDescriptors = useCallback(
    async (
      input: HTMLImageElement | HTMLCanvasElement,
    ): Promise<Float32Array[]> => {
      const faceapi = await getFaceApi();
      if (!faceapi.nets.ssdMobilenetv1.isLoaded || !faceapi.nets.tinyFaceDetector.isLoaded) {
        await loadModels();
      }

      // Pass 1: SSD MobileNet (high precision for close & medium faces, zero hallucination)
      const ssdResults = await faceapi
        .detectAllFaces(
          input,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }),
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Pass 2: TinyFaceDetector with large inputSize (high resolution to catch small group faces)
      const tinyResults = await faceapi
        .detectAllFaces(
          input,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 832,
            scoreThreshold: 0.45,
          }),
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

      // Merge: Keep all SSD detections, and add Tiny detections that don't overlap with SSD
      const merged = [...ssdResults];
      for (const tiny of tinyResults) {
        const isDuplicate = ssdResults.some(
          (ssd) => calcIoU(tiny.detection.box, ssd.detection.box) > 0.25,
        );
        if (!isDuplicate) {
          merged.push(tiny);
        }
      }

      // Anti-Slop / Anti-Hallucination Filter:
      // Verify valid human face geometry to reject non-face clutter, patterns, or foliage
      const verifiedDescriptors: Float32Array[] = [];

      for (const face of merged) {
        const box = face.detection.box;

        // Minimum dimensions: Face must be at least 20x20 px
        if (box.width < 20 || box.height < 20) continue;

        // Aspect ratio: Human faces have width/height ratio between 0.50 and 1.50
        const aspect = box.width / box.height;
        if (aspect < 0.5 || aspect > 1.5) continue;

        // Landmark validation: Check eye distance and facial proportions
        const landmarks = face.landmarks;
        if (landmarks && landmarks.positions.length >= 68) {
          // Left eye is ~point 36-41, Right eye is ~point 42-47
          const leftEye = landmarks.positions[36];
          const rightEye = landmarks.positions[45];
          const mouth = landmarks.positions[57]; // Bottom of mouth

          const eyeDist = Math.hypot(
            rightEye.x - leftEye.x,
            rightEye.y - leftEye.y,
          );

          // Eyes must be separated by at least 4 pixels
          if (eyeDist < 4) continue;

          // Mouth must be below the eyes
          const avgEyeY = (leftEye.y + rightEye.y) / 2;
          if (mouth.y <= avgEyeY) continue;
        }

        verifiedDescriptors.push(face.descriptor);
      }

      return verifiedDescriptors;
    },
    [loadModels],
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
    extractAllDescriptors,
    calculateDistance,
  };
}

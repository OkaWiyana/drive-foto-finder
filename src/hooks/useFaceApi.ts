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

      // Detect all faces in selfie/upload to pick the primary (largest) face
      const detections = await faceapi
        .detectAllFaces(
          input,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.45 }),
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        // Fallback with lower confidence in case lighting is dim
        const fallback = await faceapi
          .detectSingleFace(
            input,
            new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }),
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        return fallback ? fallback.descriptor : null;
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
      if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
        await loadModels();
      }

      // Use minConfidence 0.45 to prevent blurry artifacts/shadows from being detected as faces
      const results = await faceapi
        .detectAllFaces(
          input,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.45 }),
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Filter out tiny face boxes (< 24px) where landmarks/embeddings are noisy
      const validFaces = results.filter((r) => {
        const box = r.detection.box;
        return box.width >= 24 && box.height >= 24;
      });

      return validFaces.map((r) => r.descriptor);
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

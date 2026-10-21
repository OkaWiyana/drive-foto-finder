"use client";

import { useState, useRef, useEffect } from "react";
import { DriveFile, distanceToConfidence } from "@/lib/drive";
import {
  getCachedFaces,
  setCachedFaces,
  clearAllDescriptorCache,
} from "@/lib/cache";
import { FaceDetail } from "@/hooks/useFaceApi";
import { MatchedPhoto, DetectedFaceBox } from "@/components/PhotoCard";
import { TargetFaceItem } from "@/components/CameraCapture";

interface UsePhotoScannerOptions {
  extractAllFaces: (
    image: HTMLImageElement | HTMLCanvasElement,
  ) => Promise<FaceDetail[]>;
  calculateDistance: (
    descriptor1: Float32Array,
    descriptor2: Float32Array,
  ) => number;
}

export function usePhotoScanner({
  extractAllFaces,
  calculateDistance,
}: UsePhotoScannerOptions) {
  const [isScanning, setIsScanning] = useState(false);
  const [isScanFinished, setIsScanFinished] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [cachedCount, setCachedCount] = useState(0);
  const [matchedPhotos, setMatchedPhotos] = useState<MatchedPhoto[]>([]);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.42);

  const abortControllerRef = useRef<AbortController | null>(null);
  const allScanResultsRef = useRef<
    Array<{
      file: DriveFile;
      distance: number;
      detectedFaces: DetectedFaceBox[];
    }>
  >([]);

  // Dynamically re-filter matched photos when similarity threshold is adjusted
  useEffect(() => {
    if (allScanResultsRef.current.length > 0 && !isScanning) {
      const updated = allScanResultsRef.current
        .map((item) => ({
          ...item,
          detectedFaces: item.detectedFaces.map((f) => ({
            ...f,
            isMatch: f.distance <= similarityThreshold,
          })),
        }))
        .filter((item) => item.distance <= similarityThreshold)
        .sort((a, b) => a.distance - b.distance);

      setMatchedPhotos(updated);
    }
  }, [similarityThreshold, isScanning]);

  const resetScan = () => {
    setMatchedPhotos([]);
    setScannedCount(0);
    setCachedCount(0);
    setIsScanFinished(false);
    allScanResultsRef.current = [];
  };

  const startScan = async (
    driveFiles: DriveFile[],
    targetFaces: TargetFaceItem[],
  ) => {
    const targetDescriptors = targetFaces.map((f) => f.descriptor);
    if (targetDescriptors.length === 0 || driveFiles.length === 0) return;

    setIsScanning(true);
    setIsScanFinished(false);
    setScannedCount(0);
    setCachedCount(0);
    setMatchedPhotos([]);
    allScanResultsRef.current = [];

    // Yield to let React immediately render the scanning UI and loader
    await new Promise((resolve) => setTimeout(resolve, 80));

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Concurrency set to 2 to ensure smooth WebGL rendering without GPU context thrashing
    const CONCURRENCY = 2;
    let nextIndex = 0;
    const total = driveFiles.length;

    const processFile = async (file: DriveFile) => {
      if (abortController.signal.aborted) return;

      try {
        // Step A: Check local cache first
        let faces: FaceDetail[] | null = await getCachedFaces(file.id);

        if (faces === null) {
          // Step B: Fetch through proxy and detect
          const proxyUrl = file.thumbnailLink
            ? `/api/drive/image?url=${encodeURIComponent(file.thumbnailLink)}&fileId=${file.id}`
            : `/api/drive/image?fileId=${file.id}`;

          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error("Gagal memuat gambar"));
            image.src = proxyUrl;
          });

          if (abortController.signal.aborted) return;

          const detectedFacesList = await extractAllFaces(img);
          faces = detectedFacesList;
          await setCachedFaces(file.id, detectedFacesList);
        } else {
          setCachedCount((prev) => prev + 1);
        }

        if (abortController.signal.aborted || !faces) return;

        // Step C: Compare Euclidean distance with ALL target descriptors for each face
        const detectedFaces: DetectedFaceBox[] = faces.map((face) => {
          let minDistanceForFace = Infinity;
          for (const targetDesc of targetDescriptors) {
            const d = calculateDistance(targetDesc, face.descriptor);
            if (d < minDistanceForFace) minDistanceForFace = d;
          }
          return {
            box: face.box,
            distance: minDistanceForFace,
            confidence: distanceToConfidence(minDistanceForFace),
            isMatch: minDistanceForFace <= similarityThreshold,
          };
        });

        // Find best photo distance
        let bestDistance = Infinity;
        for (const df of detectedFaces) {
          if (df.distance < bestDistance) {
            bestDistance = df.distance;
          }
        }

        // Record all scanned results for real-time dynamic slider adjustment
        allScanResultsRef.current.push({
          file,
          distance: bestDistance,
          detectedFaces,
        });

        if (bestDistance <= similarityThreshold) {
          setMatchedPhotos((prev) => {
            const next = [
              ...prev,
              {
                file,
                distance: bestDistance,
                detectedFaces,
              },
            ];
            return next.sort((a, b) => a.distance - b.distance);
          });
        }
      } catch (err) {
        console.warn(`Peringatan pemindaian ${file.name}:`, err);
      } finally {
        if (!abortController.signal.aborted) {
          setScannedCount((prev) => prev + 1);
        }
      }
    };

    // Concurrency workers
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (nextIndex < total && !abortController.signal.aborted) {
        const currentIndex = nextIndex++;
        await processFile(driveFiles[currentIndex]);
      }
    });

    await Promise.all(workers);
    setIsScanning(false);
    setIsScanFinished(true);
  };

  const stopScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsScanning(false);
    }
  };

  const clearCache = async () => {
    if (window.confirm("Hapus seluruh cache IndexedDB untuk folder ini?")) {
      await clearAllDescriptorCache();
      setCachedCount(0);
      alert("Cache deskriptor wajah berhasil dibersihkan.");
    }
  };

  return {
    isScanning,
    isScanFinished,
    scannedCount,
    cachedCount,
    matchedPhotos,
    similarityThreshold,
    setSimilarityThreshold,
    startScan,
    stopScan,
    clearCache,
    resetScan,
  };
}

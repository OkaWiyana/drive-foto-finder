"use client";

import React, { useState, useRef } from "react";
import {
  FolderSearch,
  Sliders,
  Trash2,
  AlertCircle,
  Play,
  Info,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Zap,
} from "lucide-react";
import { DriveFile, extractFolderId, distanceToConfidence } from "@/lib/drive";
import {
  getCachedFaces,
  setCachedFaces,
  clearAllDescriptorCache,
} from "@/lib/cache";
import { useFaceApi } from "@/hooks/useFaceApi";
import { CameraCapture, TargetFaceItem } from "@/components/CameraCapture";
import { DriveInput } from "@/components/DriveInput";
import { ScanningProgress } from "@/components/ScanningProgress";
import {
  PhotoCard,
  MatchedPhoto,
  DetectedFaceBox,
} from "@/components/PhotoCard";
import { PhotoPreviewModal } from "@/components/PhotoPreviewModal";

export default function HomePage() {
  // Drive State
  const [driveUrl, setDriveUrl] = useState("");
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveFilesCount, setDriveFilesCount] = useState<number | null>(null);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Face API Hook
  const {
    isModelLoading,
    isModelLoaded,
    modelError,
    extractSingleDescriptor,
    extractAllFaces,
    calculateDistance,
  } = useFaceApi();

  // Multi-Angle Target Faces State
  const [targetFaces, setTargetFaces] = useState<TargetFaceItem[]>([]);
  const [detectionStatus, setDetectionStatus] = useState<
    "idle" | "detecting" | "success" | "error"
  >("idle");
  const [detectionError, setDetectionError] = useState<string | null>(null);

  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [isScanFinished, setIsScanFinished] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [cachedCount, setCachedCount] = useState(0);
  const [matchedPhotos, setMatchedPhotos] = useState<MatchedPhoto[]>([]);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.42);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [scanValidationWarning, setScanValidationWarning] = useState<
    string | null
  >(null);
  const [totalFoldersFound, setTotalFoldersFound] = useState<number>(1);

  // Modal Preview State
  const [previewPhoto, setPreviewPhoto] = useState<MatchedPhoto | null>(null);

  // Abort controller & all scanned results ref for dynamic re-filtering
  const abortControllerRef = useRef<AbortController | null>(null);
  const allScanResultsRef = useRef<
    Array<{
      file: DriveFile;
      distance: number;
      detectedFaces: DetectedFaceBox[];
    }>
  >([]);

  // Dynamically re-filter matched photos when similarity threshold is adjusted
  React.useEffect(() => {
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

  // 1. Fetch files from Drive
  const handleFetchFiles = async () => {
    const folderId = extractFolderId(driveUrl);
    if (!folderId) {
      setDriveError(
        "Format link tidak dikenali. Pastikan format link seperti: https://drive.google.com/drive/folders/...",
      );
      return;
    }

    setIsFetchingFiles(true);
    setDriveError(null);
    setDriveFiles([]);
    setDriveFilesCount(null);
    setMatchedPhotos([]);
    setScannedCount(0);
    setIsScanFinished(false);
    setScanValidationWarning(null);

    try {
      const res = await fetch(
        `/api/drive/files?folderId=${encodeURIComponent(folderId)}`,
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Gagal mengambil daftar foto dari Google Drive.",
        );
      }

      setDriveFiles(data.files || []);
      setDriveFilesCount((data.files || []).length);
      setTotalFoldersFound(data.totalFoldersScanned || 1);
      setActiveFolderId(data.folderId);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Terjadi kesalahan koneksi.";
      setDriveError(msg);
      setDriveFilesCount(null);
      setTotalFoldersFound(1);
    } finally {
      setIsFetchingFiles(false);
    }
  };

  // 2. Add or Remove target face descriptor (supports multi-angle enrollment)
  const handleAddTargetFace = async (
    imageElement: HTMLImageElement | HTMLCanvasElement,
    previewUrl: string,
    label: string,
  ) => {
    setDetectionStatus("detecting");
    setDetectionError(null);
    setScanValidationWarning(null);

    // Yield to let React immediately render the loading UI & spinner before heavy WebGL/Wasm blocks
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const descriptor = await extractSingleDescriptor(imageElement);
      if (!descriptor) {
        setDetectionStatus("error");
        setDetectionError(
          "Wajah tidak terdeteksi pada foto ini. Silakan coba foto lain dengan pencahayaan jelas.",
        );
      } else {
        const newFace: TargetFaceItem = {
          id: Math.random().toString(36).substring(2, 9),
          previewUrl,
          descriptor,
          label,
        };
        setTargetFaces((prev) => [...prev, newFace]);
        setDetectionStatus("success");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal memproses fitur wajah.";
      setDetectionStatus("error");
      setDetectionError(msg);
    }
  };

  const handleRemoveTargetFace = (id: string) => {
    setTargetFaces((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      if (updated.length === 0) {
        setDetectionStatus("idle");
      }
      return updated;
    });
  };

  // 3. Start scanning with async concurrency pool
  const handleStartScanClick = () => {
    setScanValidationWarning(null);

    if (!isModelLoaded) {
      setScanValidationWarning(
        "Model AI pengenal wajah sedang dimuat ke memori browser. Mohon tunggu beberapa saat sampai muncul status 'Model AI Siap' di pojok kanan atas.",
      );
      return;
    }

    if (driveFiles.length === 0) {
      setScanValidationWarning(
        "Daftar foto Google Drive belum diambil. Silakan tempelkan link folder Google Drive publik pada Langkah 1, lalu klik tombol 'Ambil Daftar Foto'.",
      );
      return;
    }

    if (targetFaces.length === 0) {
      setScanValidationWarning(
        "Foto wajah target belum siap. Silakan ambil selfie atau unggah foto wajah Anda pada Langkah 2.",
      );
      return;
    }

    startScan();
  };

  const startScan = async () => {
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
        let faces = await getCachedFaces(file.id);

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

          faces = await extractAllFaces(img);
          await setCachedFaces(file.id, faces);
        } else {
          setCachedCount((prev) => prev + 1);
        }

        if (abortController.signal.aborted) return;

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

  const handleStopScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsScanning(false);
    }
  };

  const handleClearCache = async () => {
    if (window.confirm("Hapus seluruh cache IndexedDB untuk folder ini?")) {
      await clearAllDescriptorCache();
      setCachedCount(0);
      alert("Cache deskriptor wajah berhasil dibersihkan.");
    }
  };

  const isReady =
    !isScanning &&
    targetFaces.length > 0 &&
    driveFiles.length > 0 &&
    isModelLoaded;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
              <FolderSearch className="w-5 h-5" />
            </div> */}
            <img
              src="/logo-drive-face-finder.jpg"
              alt="DriveFace Finder Logo"
              className="w-9 h-9 object-contain rounded-lg"
            />
            <div>
              <span className="text-sm sm:text-base font-bold tracking-tight block">
                Google Drive Face Finder
              </span>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
                Cari foto Anda di Google Drive publik dengan pemindaian wajah
                lokal
              </p>
            </div>
          </div>

          {/* AI Model Status Badge */}
          <div className="flex items-center gap-2">
            {isModelLoading && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-900 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Memuat Model AI...
              </span>
            )}
            {isModelLoaded && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-900 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Model AI Ready
              </span>
            )}
            {modelError && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-full border border-rose-200 dark:border-rose-900 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Error Model
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Notice Info Banner */}
        <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
          <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Semua pemindaian wajah diproses 100% secara lokal di browser Anda.
            Foto selfie maupun vektor wajah Anda tidak pernah dikirim atau
            disimpan di server mana pun demi privasi.
          </p>
        </div>

        {/* Two Column Setup Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Step 1: Drive Input */}
          <DriveInput
            inputUrl={driveUrl}
            setInputUrl={setDriveUrl}
            onFetchFiles={handleFetchFiles}
            isLoading={isFetchingFiles}
            totalFiles={driveFilesCount}
            errorMessage={driveError}
            detectedFolderId={activeFolderId}
            disabled={isScanning}
          />

          {/* Step 2: Target Face Capture (Multi-Angle) */}
          <CameraCapture
            targetFaces={targetFaces}
            onAddFace={handleAddTargetFace}
            onRemoveFace={handleRemoveTargetFace}
            isProcessing={detectionStatus === "detecting"}
            detectionStatus={detectionStatus}
            errorMessage={detectionError}
            disabled={isScanning}
          />
        </div>

        {/* Action Panel: Scan Trigger & Settings */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
          {/* Readiness Checklist */}
          <div className="flex flex-wrap items-center gap-3 text-xs border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">
              Status :
            </span>

            {/* Checklist 1: Folder Drive */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                driveFiles.length > 0
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {driveFiles.length > 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
              )}
              {driveFiles.length > 0
                ? `${driveFiles.length} Foto Drive Siap ${
                    totalFoldersFound > 1 ? `(${totalFoldersFound} Folder)` : ""
                  }`
                : "Langkah 1: Belum Ambil Foto Drive"}
            </span>

            {/* Checklist 2: Face Target */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                targetFaces.length > 0
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {detectionStatus === "detecting" ? (
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
              ) : targetFaces.length > 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
              )}
              {detectionStatus === "detecting"
                ? "Menganalisis Foto Wajah..."
                : targetFaces.length > 0
                  ? `${targetFaces.length} Wajah Target Siap`
                  : "Langkah 2: Belum Ada Foto Wajah"}
            </span>

            {/* Checklist 3: AI Model */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                isModelLoaded
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {isModelLoaded ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
              )}
              {isModelLoaded ? "Model AI Siap" : "Model AI Sedang Dimuat"}
            </span>
          </div>

          {/* Validation Warning Alert */}
          {scanValidationWarning && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{scanValidationWarning}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                disabled={isScanning}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                <Sliders className="w-3.5 h-3.5" />
                Pengaturan Toleransi
              </button>

              <button
                type="button"
                onClick={handleClearCache}
                disabled={isScanning}
                title="Bersihkan cache vektor wajah IndexedDB"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Bersihkan Cache
              </button>
            </div>

            {/* Main Trigger Button */}
            <button
              type="button"
              onClick={handleStartScanClick}
              disabled={
                isScanning || detectionStatus === "detecting" || !isReady
              }
              className={`w-full sm:w-auto px-6 py-3 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                isScanning || detectionStatus === "detecting"
                  ? "bg-zinc-700 opacity-60 cursor-not-allowed pointer-events-none shadow-none"
                  : isReady
                    ? "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 cursor-pointer"
                    : "bg-zinc-700 opacity-40 cursor-not-allowed pointer-events-none shadow-none"
              }`}
            >
              {detectionStatus === "detecting" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-300" />
                  Menganalisis Foto Wajah...
                </>
              ) : isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sedang Memindai...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  {isReady
                    ? `Mulai Pindai (${driveFiles.length} Foto)`
                    : "Mulai Pindai Foto"}
                </>
              )}
            </button>
          </div>

          {/* Advanced Tolerance Presets and Slider */}
          {showAdvancedSettings && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Persentase Toleransi Kemiripan Wajah:
                </span>
                <span className="text-zinc-500 text-[11px]">
                  Threshold:{" "}
                  <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                    {similarityThreshold}
                  </span>
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => setSimilarityThreshold(0.38)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${
                    similarityThreshold === 0.38
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  Sangat Ketat (0.38) - Hanya Wajah Jelas
                </button>
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => setSimilarityThreshold(0.42)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${
                    similarityThreshold === 0.42
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  Standar Akurat (0.42) - Rekomendasi
                </button>
                <button
                  type="button"
                  disabled={isScanning}
                  onClick={() => setSimilarityThreshold(0.46)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${
                    similarityThreshold === 0.46
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  Fleksibel (0.46) - Termasuk Foto Jauh / Miring
                </button>
              </div>

              <input
                type="range"
                min="0.36"
                max="0.50"
                step="0.01"
                disabled={isScanning}
                value={similarityThreshold}
                onChange={(e) =>
                  setSimilarityThreshold(parseFloat(e.target.value))
                }
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Nilai threshold lebih kecil (misal <strong>0.39 - 0.43</strong>)
                menjamin hanya wajah Anda yang lolos dan menyaring orang lain
                atau background.
              </p>
            </div>
          )}
        </div>

        {/* Real-time Progress Bar */}
        <ScanningProgress
          isScanning={isScanning}
          total={driveFiles.length}
          scanned={scannedCount}
          matched={matchedPhotos.length}
          cached={cachedCount}
          onStop={handleStopScan}
        />

        {/* Results Gallery Section */}
        <section aria-labelledby="gallery-heading" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h2
                id="gallery-heading"
                className="text-base font-bold text-zinc-900 dark:text-zinc-100"
              >
                Galeri Hasil Foto ({matchedPhotos.length})
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isScanning
                  ? "Foto yang cocok akan muncul di sini secara real-time saat dipindai..."
                  : isScanFinished
                    ? `Selesai memindai. Ditemukan ${matchedPhotos.length} foto yang cocok dengan wajah Anda.`
                    : "Foto yang cocok dengan wajah Anda akan ditampilkan di bawah ini."}
              </p>
            </div>
          </div>

          {/* Empty State */}
          {matchedPhotos.length === 0 && !isScanning && (
            <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <FolderSearch className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Belum Ada Hasil Pencarian
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
                Masukkan link Google Drive, siapkan foto wajah target, lalu klik
                tombol Mulai Pindai untuk melihat foto yang cocok.
              </p>
            </div>
          )}

          {/* Results Grid */}
          {matchedPhotos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {matchedPhotos.map((photo) => (
                <PhotoCard
                  key={photo.file.id}
                  photo={photo}
                  onPreview={(p) => setPreviewPhoto(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* SEO Static Content Section: Panduan, Keunggulan & FAQ */}
        <section
          aria-labelledby="seo-main-heading"
          className="mt-16 pt-12 border-t border-zinc-200 dark:border-zinc-800 space-y-12"
        >
          {/* Main Title & Value Proposition */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Teknologi Face Recognition AI Berbasis Browser</span>
            </div>
            <h1
              id="seo-main-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              Cari Foto Wajahmu di Google Drive dalam Hitungan Detik
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Solusi tercepat menemukan foto pribadi Anda dari ribuan
              dokumentasi event, wisuda, konser, dan lomba lari di Google Drive
              tanpa perlu scroll satu per satu secara manual.
            </p>
          </div>

          {/* Section: Cara Mencari Foto Event atau Wisuda */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Cara Mencari Foto Event atau Wisuda di Google Drive
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  Hanya butuh 3 langkah praktis untuk memfilter seluruh foto
                  secara instan:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Tempel Link Folder Drive
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Salin tautan folder Google Drive publik yang dibagikan oleh
                  panitia acara, fotografer wisuda, atau dokumentasi race run
                  Anda.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Ambil Foto Selfie Target
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Gunakan kamera langsung atau unggah foto selfie Anda dari
                  berbagai sudut (tampak depan, sedikit miring) untuk akurasi
                  pengenalan optimal.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Mulai Pindai & Temukan
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  AI akan mencocokkan kemiripan wajah secara otomatis. Foto yang
                  cocok akan langsung muncul di galeri hasil untuk diunduh.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Kenapa Aman? */}
          <div className="bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Kenapa Aman? (Privasi 100% Tanpa Database)
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  Privasi dan keamanan data biometrik wajah Anda terjamin
                  seutuhnya:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Proses 100% Client-Side di Browser
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Seluruh deteksi dan pencocokan vektor wajah dihitung secara
                    lokal di peramban Anda menggunakan WebAssembly dan model AI
                    TensorFlow.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Nol Database & Tanpa Upload Foto
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Kami tidak memiliki server penyimpanan foto atau database
                    biometrik. Begitu tab browser ditutup, seluruh data
                    pemindaian seketika terhapus.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: FAQ */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Pertanyaan yang Sering Diajukan (FAQ)
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
                Jawaban lengkap seputar cara kerja, privasi, dan kecocokan fitur
                DriveFace Finder.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <details className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all hover:border-indigo-300 dark:hover:border-indigo-800">
                <summary className="flex items-center justify-between font-semibold text-sm text-zinc-900 dark:text-zinc-100 select-none">
                  <span>
                    Bagaimana cara mencari foto sendiri di link Google Drive
                    yang isinya ribuan foto?
                  </span>
                  <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-2" />
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Cukup tempel tautan folder Google Drive publik ke kolom
                  pencarian di atas, ambil foto selfie Anda melalui webcam atau
                  upload foto dari galeri HP, lalu klik tombol &quot;Mulai
                  Pindai&quot;. Sistem AI akan menganalisis setiap wajah dalam
                  foto Drive dan memunculkan foto yang cocok dengan Anda secara
                  instan.
                </p>
              </details>

              <details className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all hover:border-indigo-300 dark:hover:border-indigo-800">
                <summary className="flex items-center justify-between font-semibold text-sm text-zinc-900 dark:text-zinc-100 select-none">
                  <span>Apakah foto selfie saya disimpan di server?</span>
                  <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-2" />
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Sama sekali tidak. Privasi pengguna adalah komitmen utama
                  kami. Seluruh proses komputasi AI pengenalan wajah berjalan
                  100% di browser perangkat Anda sendiri. Foto maupun data
                  biometrik Anda tidak pernah dikirim, disimpan, atau diolah di
                  server manapun.
                </p>
              </details>

              <details className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all hover:border-indigo-300 dark:hover:border-indigo-800">
                <summary className="flex items-center justify-between font-semibold text-sm text-zinc-900 dark:text-zinc-100 select-none">
                  <span>
                    Apakah tool ini bisa digunakan untuk mencari foto lari /
                    marathon dan wisuda?
                  </span>
                  <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-2" />
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Ya, tool ini dirancang khusus untuk mempermudah pencarian pada
                  dokumentasi acara berskala besar seperti wisuda kampus, lomba
                  marathon / fun run, gathering perusahaan, pesta pernikahan,
                  maupun konser musik yang biasanya menghasilkan ratusan hingga
                  ribuan foto di Google Drive.
                </p>
              </details>

              <details className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all hover:border-indigo-300 dark:hover:border-indigo-800">
                <summary className="flex items-center justify-between font-semibold text-sm text-zinc-900 dark:text-zinc-100 select-none">
                  <span>Apakah folder Google Drive harus disetel Publik?</span>
                  <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-2" />
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Ya, folder Google Drive harus memiliki izin akses &quot;Siapa
                  saja yang memiliki link&quot; (Anyone with the link can view)
                  agar sistem dapat membaca daftar file dan memindai foto
                  langsung melalui browser Anda.
                </p>
              </details>
            </div>
          </div>
        </section>
      </main>

      {/* Accessible Photo Preview Modal */}
      <PhotoPreviewModal
        photo={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
      />

      {/* Structured Data: WebApplication & FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "DriveFace Finder",
              applicationCategory: "PhotographyApplication",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "IDR",
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Bagaimana cara mencari foto sendiri di link Google Drive yang isinya ribuan foto?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Cukup salin link folder Google Drive publik yang ingin dicari, ambil atau unggah foto selfie Anda, lalu tekan tombol Mulai Pindai. Sistem AI akan mencocokkan wajah Anda secara otomatis dalam hitungan detik.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Apakah foto selfie saya disimpan di server?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Sama sekali tidak. Seluruh pemindaian wajah diproses 100% secara lokal di browser Anda menggunakan teknologi WebAssembly. Foto selfie maupun data wajah Anda tidak pernah diunggah atau disimpan ke server manapun.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Apakah tool ini bisa digunakan untuk mencari foto lari / marathon dan wisuda?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Ya, tool ini sangat ideal untuk mencari foto dokumentasi massal seperti lomba lari maraton, wisuda universitas, festival musik, pesta pernikahan, dan event komunitas dengan ribuan foto di Google Drive.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Apakah folder Google Drive harus disetel Publik?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Ya, folder Google Drive harus memiliki izin 'Siapa saja yang memiliki link' (Anyone with the link can view) agar web dapat membaca dan memindai foto-foto di dalamnya.",
                  },
                },
              ],
            },
          ]),
        }}
      />

      {/* Sleek Footer */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <p>© 2026 DriveFace Finder. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Client-side AI Processing</span>
            <span>•</span>
            <span>Zero Database Storage</span>
            <span>•</span>
            <span>Free & Open</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

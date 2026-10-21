"use client";

import React, { useState } from "react";
import { FolderSearch, Info } from "lucide-react";
import { DriveFile, extractFolderId } from "@/lib/drive";
import { useFaceApi } from "@/hooks/useFaceApi";
import { usePhotoScanner } from "@/hooks/usePhotoScanner";
import { CameraCapture, TargetFaceItem } from "@/components/CameraCapture";
import { DriveInput } from "@/components/DriveInput";
import { ScanningProgress } from "@/components/ScanningProgress";
import { PhotoCard, MatchedPhoto } from "@/components/PhotoCard";
import { PhotoPreviewModal } from "@/components/PhotoPreviewModal";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScanControlPanel } from "@/components/ScanControlPanel";
import { FaqAndGuideSection } from "@/components/FaqAndGuideSection";

export default function HomePage() {
  // Drive State
  const [driveUrl, setDriveUrl] = useState("");
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveFilesCount, setDriveFilesCount] = useState<number | null>(null);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [totalFoldersFound, setTotalFoldersFound] = useState<number>(1);

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

  // Scanner Hook
  const {
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
  } = usePhotoScanner({
    extractAllFaces,
    calculateDistance,
  });

  // UI Control State
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [scanValidationWarning, setScanValidationWarning] = useState<
    string | null
  >(null);
  const [previewPhoto, setPreviewPhoto] = useState<MatchedPhoto | null>(null);

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
    resetScan();
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

  // 3. Validation before starting scan
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

    startScan(driveFiles, targetFaces);
  };

  const isReady =
    !isScanning &&
    targetFaces.length > 0 &&
    driveFiles.length > 0 &&
    isModelLoaded;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <Header
        isModelLoading={isModelLoading}
        isModelLoaded={isModelLoaded}
        modelError={modelError}
      />

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
        <ScanControlPanel
          driveFilesCount={driveFiles.length}
          totalFoldersFound={totalFoldersFound}
          targetFacesCount={targetFaces.length}
          detectionStatus={detectionStatus}
          isModelLoaded={isModelLoaded}
          isScanning={isScanning}
          isReady={isReady}
          scanValidationWarning={scanValidationWarning}
          similarityThreshold={similarityThreshold}
          showAdvancedSettings={showAdvancedSettings}
          onToggleAdvancedSettings={() =>
            setShowAdvancedSettings(!showAdvancedSettings)
          }
          onSetSimilarityThreshold={setSimilarityThreshold}
          onClearCache={clearCache}
          onStartScanClick={handleStartScanClick}
        />

        {/* Real-time Progress Bar */}
        <ScanningProgress
          isScanning={isScanning}
          total={driveFiles.length}
          scanned={scannedCount}
          matched={matchedPhotos.length}
          cached={cachedCount}
          onStop={stopScan}
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

        {/* SEO Static Content, Panduan, Keunggulan & FAQ */}
        <FaqAndGuideSection />
      </main>

      {/* Accessible Photo Preview Modal */}
      <PhotoPreviewModal
        photo={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
      />

      <Footer />
    </div>
  );
}

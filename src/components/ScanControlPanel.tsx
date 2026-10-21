"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  Sliders,
  Trash2,
  Play,
  Loader2,
} from "lucide-react";

interface ScanControlPanelProps {
  driveFilesCount: number;
  totalFoldersFound: number;
  targetFacesCount: number;
  detectionStatus: "idle" | "detecting" | "success" | "error";
  isModelLoaded: boolean;
  isScanning: boolean;
  isReady: boolean;
  scanValidationWarning: string | null;
  similarityThreshold: number;
  showAdvancedSettings: boolean;
  onToggleAdvancedSettings: () => void;
  onSetSimilarityThreshold: (val: number) => void;
  onClearCache: () => void;
  onStartScanClick: () => void;
}

export function ScanControlPanel({
  driveFilesCount,
  totalFoldersFound,
  targetFacesCount,
  detectionStatus,
  isModelLoaded,
  isScanning,
  isReady,
  scanValidationWarning,
  similarityThreshold,
  showAdvancedSettings,
  onToggleAdvancedSettings,
  onSetSimilarityThreshold,
  onClearCache,
  onStartScanClick,
}: ScanControlPanelProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
      {/* Readiness Checklist */}
      <div className="flex flex-wrap items-center gap-3 text-xs border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <span className="font-medium text-zinc-500 dark:text-zinc-400">
          Status :
        </span>

        {/* Checklist 1: Folder Drive */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
            driveFilesCount > 0
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {driveFilesCount > 0 ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
          )}
          {driveFilesCount > 0
            ? `${driveFilesCount} Foto Drive Siap ${
                totalFoldersFound > 1 ? `(${totalFoldersFound} Folder)` : ""
              }`
            : "Langkah 1: Belum Ambil Foto Drive"}
        </span>

        {/* Checklist 2: Face Target */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
            targetFacesCount > 0
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {detectionStatus === "detecting" ? (
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
          ) : targetFacesCount > 0 ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
          )}
          {detectionStatus === "detecting"
            ? "Menganalisis Foto Wajah..."
            : targetFacesCount > 0
              ? `${targetFacesCount} Wajah Target Siap`
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
            onClick={onToggleAdvancedSettings}
            disabled={isScanning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            <Sliders className="w-3.5 h-3.5" />
            Pengaturan Toleransi
          </button>

          <button
            type="button"
            onClick={onClearCache}
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
          onClick={onStartScanClick}
          disabled={isScanning || detectionStatus === "detecting" || !isReady}
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
                ? `Mulai Pindai (${driveFilesCount} Foto)`
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
              onClick={() => onSetSimilarityThreshold(0.38)}
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
              onClick={() => onSetSimilarityThreshold(0.42)}
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
              onClick={() => onSetSimilarityThreshold(0.46)}
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
            onChange={(e) => onSetSimilarityThreshold(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <p className="text-[11px] text-zinc-500 mt-1.5">
            Nilai threshold lebih kecil (misal <strong>0.39 - 0.43</strong>)
            menjamin hanya wajah Anda yang lolos dan menyaring orang lain atau
            background.
          </p>
        </div>
      )}
    </div>
  );
}

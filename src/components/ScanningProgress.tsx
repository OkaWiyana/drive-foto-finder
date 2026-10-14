"use client";

import React from "react";
import { Loader2, StopCircle, Zap, Image as ImageIcon } from "lucide-react";

interface ScanningProgressProps {
  isScanning: boolean;
  total: number;
  scanned: number;
  matched: number;
  cached: number;
  onStop: () => void;
}

export function ScanningProgress({
  isScanning,
  total,
  scanned,
  matched,
  cached,
  onStop,
}: ScanningProgressProps) {
  if (!isScanning && scanned === 0) return null;

  const percentage = total > 0 ? Math.min(100, Math.round((scanned / total) * 100)) : 0;
  const isFinished = scanned >= total && total > 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {isScanning ? (
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <ImageIcon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {isScanning
                ? "Sedang Memindai Wajah di Google Drive..."
                : isFinished
                ? "Pemindaian Selesai"
                : "Pemindaian Dihentikan"}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Memproses {scanned} dari {total} foto ({percentage}%)
            </p>
          </div>
        </div>

        {isScanning && (
          <button
            type="button"
            onClick={onStop}
            className="px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <StopCircle className="w-3.5 h-3.5" />
            Hentikan Pemindaian
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            isFinished
              ? "bg-emerald-500"
              : "bg-indigo-600 dark:bg-indigo-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Summary stats pills */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md font-medium text-[11px]">
          <ImageIcon className="w-3 h-3 text-zinc-500" />
          {scanned} / {total} Terproses
        </span>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-md font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          {matched} Foto Cocok
        </span>

        {cached > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-md font-medium text-[11px]">
            <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            {cached} Diambil dari Cache IDB
          </span>
        )}
      </div>
    </div>
  );
}

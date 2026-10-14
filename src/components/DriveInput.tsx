"use client";

import React, { useState } from "react";
import {
  Folder,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { extractFolderId } from "@/lib/drive";

interface DriveInputProps {
  inputUrl: string;
  setInputUrl: (val: string) => void;
  onFetchFiles: () => void;
  isLoading: boolean;
  totalFiles: number | null;
  errorMessage: string | null;
  detectedFolderId: string | null;
}

export function DriveInput({
  inputUrl,
  setInputUrl,
  onFetchFiles,
  isLoading,
  totalFiles,
  errorMessage,
  detectedFolderId,
}: DriveInputProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleProcessSubmit = () => {
    setLocalError(null);
    if (!inputUrl.trim()) {
      setLocalError(
        "Silakan masukkan link atau ID folder Google Drive terlebih dahulu.",
      );
      return;
    }

    const folderId = extractFolderId(inputUrl);
    if (!folderId) {
      setLocalError(
        "Format link tidak dikenali. Pastikan link Google Drive seperti: https://drive.google.com/drive/folders/...",
      );
      return;
    }

    onFetchFiles();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      handleProcessSubmit();
    }
  };

  const currentExtractedId = extractFolderId(inputUrl);
  const activeError = errorMessage || localError;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
      <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Folder className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Link Folder Google Drive
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Tempelkan link folder publik yang berisi dokumentasi foto acara Anda
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (localError) setLocalError(null);
              }}
              placeholder="https://drive.google.com/drive/folders/..."
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium rounded-xl hover:bg-zinc-800 dark:hover:bg-white active:bg-zinc-950 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 min-w-35"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Mengecek...
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                Ambil Daftar Foto
              </>
            )}
          </button>
        </div>

        {/* Dynamic status feedback */}
        <div className="mt-2.5 min-h-5.5">
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>
                Menghubungi Google Drive API untuk membaca isi folder...
              </span>
            </div>
          )}

          {!isLoading &&
            currentExtractedId &&
            !activeError &&
            totalFiles === null && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Folder ID terdeteksi:{" "}
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {currentExtractedId}
                </span>{" "}
                (Klik tombol &quot;Ambil Daftar Foto&quot; di atas)
              </p>
            )}

          {!isLoading && activeError && (
            <div className="flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{activeError}</span>
            </div>
          )}

          {!isLoading && totalFiles !== null && !activeError && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>
                {totalFiles > 0
                  ? `${totalFiles} foto siap dipindai di folder ini`
                  : "Folder ini berhasil ditemukan, namun tidak memiliki file gambar langsung di dalamnya."}
              </span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

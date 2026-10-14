"use client";

import React, { useEffect, useRef } from "react";
import { X, Download, ExternalLink, ShieldCheck } from "lucide-react";
import { MatchedPhoto } from "./PhotoCard";
import { distanceToConfidence } from "@/lib/drive";

interface PhotoPreviewModalProps {
  photo: MatchedPhoto | null;
  onClose: () => void;
}

export function PhotoPreviewModal({ photo, onClose }: PhotoPreviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!photo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Focus close button on open for keyboard accessibility
    closeButtonRef.current?.focus();

    // Prevent body scroll when modal is active
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [photo, onClose]);

  if (!photo) return null;

  const { file, distance } = photo;
  const confidenceScore = distanceToConfidence(distance);

  // Use higher resolution for preview modal (=s1200)
  const highResThumbnail = file.thumbnailLink
    ? file.thumbnailLink.replace(/=s\d+/, "=s1200")
    : undefined;

  const previewSrc = highResThumbnail
    ? `/api/drive/image?url=${encodeURIComponent(highResThumbnail)}`
    : `/api/drive/image?fileId=${file.id}`;

  const downloadUrl =
    file.webContentLink ||
    `https://drive.google.com/uc?export=download&id=${file.id}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-3xl w-full bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 truncate pr-4">
            <h3
              id="preview-modal-title"
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate"
            >
              {file.name}
            </h3>
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium rounded-full shrink-0 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              {confidenceScore}% Cocok
            </span>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup preview"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview Container */}
        <div className="flex-1 bg-zinc-950 flex items-center justify-center overflow-hidden min-h-75 p-2">
          <img
            src={previewSrc}
            alt={file.name}
            className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Jarak Euclidean: <span className="font-mono text-zinc-700 dark:text-zinc-300">{distance.toFixed(4)}</span> (Threshold: &lt; 0.52)
          </div>

          <div className="flex items-center gap-2">
            {file.webViewLink && (
              <a
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka di Drive
              </a>
            )}

            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={file.name}
              className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Foto Asli
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Download, ExternalLink, ShieldCheck, ScanFace, Check } from "lucide-react";
import { MatchedPhoto } from "./PhotoCard";
import { distanceToConfidence } from "@/lib/drive";

interface PhotoPreviewModalProps {
  photo: MatchedPhoto | null;
  onClose: () => void;
}

export function PhotoPreviewModal({ photo, onClose }: PhotoPreviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [showFaceBoxes, setShowFaceBoxes] = useState(true);

  useEffect(() => {
    if (!photo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [photo, onClose]);

  if (!photo) return null;

  const { file, distance, detectedFaces = [] } = photo;
  const confidenceScore = distanceToConfidence(distance);

  // Use higher resolution for preview modal (=s1600)
  const highResThumbnail = file.thumbnailLink
    ? file.thumbnailLink.replace(/=s\d+/, "=s1600")
    : undefined;

  const previewSrc = highResThumbnail
    ? `/api/drive/image?url=${encodeURIComponent(highResThumbnail)}&fileId=${file.id}`
    : `/api/drive/image?fileId=${file.id}`;

  const downloadUrl =
    file.webContentLink ||
    `https://drive.google.com/uc?export=download&id=${file.id}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 truncate pr-4">
            <h3
              id="preview-modal-title"
              className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate"
            >
              {file.name}
            </h3>
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium rounded-full shrink-0 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              {confidenceScore}% Cocok
            </span>
          </div>

          <div className="flex items-center gap-2">
            {detectedFaces.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFaceBoxes(!showFaceBoxes)}
                className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                  showFaceBoxes
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                }`}
                title="Tampilkan / sembunyikan kotak penanda wajah"
              >
                <ScanFace className="w-3.5 h-3.5" />
                <span>{showFaceBoxes ? "Kotak Wajah: ON" : "Kotak Wajah: OFF"}</span>
              </button>
            )}

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
        </div>

        {/* Image Preview Container with Responsive Bounding Box Overlay */}
        <div className="flex-1 bg-zinc-950 flex items-center justify-center overflow-auto min-h-75 p-2 sm:p-4">
          <div className="relative inline-block max-h-[68vh] max-w-full">
            <img
              src={previewSrc}
              alt={file.name}
              className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg block shadow-lg"
            />

            {/* Bounding Boxes on Each Detected Face */}
            {showFaceBoxes &&
              detectedFaces.map((face, idx) => {
                const imgW = face.box.imageWidth || 800;
                const imgH = face.box.imageHeight || 600;

                const leftPct = (face.box.x / imgW) * 100;
                const topPct = (face.box.y / imgH) * 100;
                const widthPct = (face.box.width / imgW) * 100;
                const heightPct = (face.box.height / imgH) * 100;

                return (
                  <div
                    key={idx}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                    }}
                    className={`absolute rounded-md pointer-events-none transition-all ${
                      face.isMatch
                        ? "border-2 border-emerald-400 bg-emerald-400/15 shadow-[0_0_14px_rgba(52,211,153,0.6)] z-20"
                        : "border border-zinc-400/50 bg-black/25 z-10"
                    }`}
                  >
                    <div
                      className={`absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-bold rounded shadow-md flex items-center gap-1 leading-none whitespace-nowrap ${
                        face.isMatch
                          ? "bg-emerald-500 text-white"
                          : "bg-zinc-900/90 text-zinc-300 border border-zinc-700"
                      }`}
                    >
                      {face.isMatch ? (
                        <>
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>{face.confidence}% Kamu</span>
                        </>
                      ) : (
                        <span>{face.confidence}%</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-5 py-3 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-3">
            <span>
              Jarak Euclidean:{" "}
              <strong className="font-mono text-zinc-700 dark:text-zinc-300">
                {distance.toFixed(4)}
              </strong>
            </span>
            {detectedFaces.length > 0 && (
              <span className="hidden sm:inline text-zinc-400">
                • {detectedFaces.length} Wajah Terdeteksi
              </span>
            )}
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

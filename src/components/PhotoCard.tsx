"use client";

import React from "react";
import { Download, Eye, ExternalLink } from "lucide-react";
import { DriveFile, distanceToConfidence } from "@/lib/drive";

export interface MatchedPhoto {
  file: DriveFile;
  distance: number;
}

interface PhotoCardProps {
  photo: MatchedPhoto;
  onPreview: (photo: MatchedPhoto) => void;
}

export function PhotoCard({ photo, onPreview }: PhotoCardProps) {
  const { file, distance } = photo;
  const confidenceScore = distanceToConfidence(distance);

  const proxyImageUrl = file.thumbnailLink
    ? `/api/drive/image?url=${encodeURIComponent(file.thumbnailLink)}`
    : `/api/drive/image?fileId=${file.id}`;

  const downloadUrl =
    file.webContentLink ||
    `https://drive.google.com/uc?export=download&id=${file.id}`;

  return (
    <div className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
      {/* Image Thumbnail Container */}
      <div
        onClick={() => onPreview(photo)}
        className="relative aspect-square bg-zinc-100 dark:bg-zinc-800 cursor-pointer overflow-hidden"
      >
        <img
          src={proxyImageUrl}
          alt={file.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Confidence Badge */}
        <div className="absolute top-2.5 left-2.5 px-2 py-1 bg-zinc-900/80 backdrop-blur-sm text-white text-[11px] font-semibold rounded-md flex items-center gap-1 shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {confidenceScore}% Cocok
        </div>

        {/* Hover Overlay Button */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-3 py-1.5 bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 text-xs font-medium rounded-lg shadow-sm flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Buka Preview
          </span>
        </div>
      </div>

      {/* Card Info and Actions */}
      <div className="p-3 flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <p
          title={file.name}
          className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate flex-1"
        >
          {file.name}
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPreview(photo)}
            aria-label={`Lihat preview ${file.name}`}
            className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>

          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={file.name}
            aria-label={`Unduh ${file.name}`}
            className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

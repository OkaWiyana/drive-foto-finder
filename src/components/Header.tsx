"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface HeaderProps {
  isModelLoading: boolean;
  isModelLoaded: boolean;
  modelError: string | null;
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function Header({
  isModelLoading,
  isModelLoaded,
  modelError,
}: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
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
              Cari foto Anda di Google Drive publik dengan pemindaian wajah lokal
            </p>
          </div>
        </div>

        {/* Right Section: Status Badge & Developer Credit */}
        <div className="flex items-center gap-2 sm:gap-3">
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

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

          {/* Developer Attribution Link */}
          <a
            href="https://github.com/OkaWiyana"
            target="_blank"
            rel="noopener noreferrer"
            title="Kunjungi profil GitHub pengembang: Oka Wiyana"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors"
          >
            <GithubIcon />
            <span className="hidden sm:inline">by Oka Wiyana</span>
          </a>
        </div>
      </div>
    </header>
  );
}

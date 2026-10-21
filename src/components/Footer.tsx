import React from "react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <p className="flex items-center gap-1.5 flex-wrap">
          <span>© 2026 Drive Face Finder </span>
          <span>| Created by</span>
          <a
            href="https://github.com/OkaWiyana"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 transition-colors inline-flex items-center gap-1"
          >
            <span>Oka Wiyana</span>
          </a>
        </p>
        <div className="flex items-center gap-4">
          <span>Client-side AI Processing</span>
          <span>•</span>
          <span>Zero Database Storage</span>
          <span>•</span>
          <span>Free & Open</span>
        </div>
      </div>
    </footer>
  );
}

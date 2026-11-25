import type { Metadata } from "next";
import { FolderSearch } from "lucide-react";
import { MaintenanceRetryButton } from "@/components/MaintenanceRetryButton";

export const metadata: Metadata = {
  title: "Pemeliharaan Sistem | DriveFace Finder",
  description:
    "Google Drive Face Finder sedang dalam pemeliharaan sementara.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="inline-flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 text-white rounded-xl">
            <FolderSearch className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-700 dark:text-zinc-300">
            Google Drive Face Finder
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Sedang Dalam Pemeliharaan
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Aplikasi sedang diperbarui untuk sementara waktu. Silakan coba muat
            ulang beberapa saat lagi.
          </p>
        </div>

        <div className="pt-1">
          <MaintenanceRetryButton />
        </div>
      </div>
    </main>
  );
}

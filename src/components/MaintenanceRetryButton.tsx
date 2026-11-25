"use client";

import React, { useState } from "react";
import { RefreshCw } from "lucide-react";

export function MaintenanceRetryButton() {
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckStatus = () => {
    setIsChecking(true);
    window.location.assign("/");
  };

  return (
    <button
      type="button"
      onClick={handleCheckStatus}
      disabled={isChecking}
      className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-400"
    >
      <RefreshCw
        className={`w-4 h-4 shrink-0 ${isChecking ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
      <span>{isChecking ? "Memuat Ulang..." : "Coba Muat Ulang"}</span>
    </button>
  );
}

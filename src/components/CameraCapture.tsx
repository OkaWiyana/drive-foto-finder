"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Camera, Upload, RefreshCw, CheckCircle2, AlertCircle, X, RotateCcw } from "lucide-react";

interface CameraCaptureProps {
  onFaceSelected: (imageElement: HTMLImageElement | HTMLCanvasElement, previewUrl: string) => void;
  isProcessing: boolean;
  selectedPreviewUrl: string | null;
  onClear: () => void;
  detectionStatus: "idle" | "detecting" | "success" | "error";
  errorMessage: string | null;
  disabled?: boolean;
}

export function CameraCapture({
  onFaceSelected,
  isProcessing,
  selectedPreviewUrl,
  onClear,
  detectionStatus,
  errorMessage,
  disabled = false,
}: CameraCaptureProps) {
  const [mode, setMode] = useState<"camera" | "upload">("upload");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isStartingRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  const startCamera = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError(null);

    // Stop existing stream if any
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Tidak dapat mengakses kamera. Periksa izin perangkat.";
      setCameraError(msg);
      setIsCameraActive(false);
    } finally {
      isStartingRef.current = false;
    }
  }, [stream]);

  // Keep video element connected and playing whenever stream or DOM changes
  useEffect(() => {
    if (videoRef.current && stream && !selectedPreviewUrl && mode === "camera") {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [stream, selectedPreviewUrl, mode]);

  // Automatically start or stop camera based on active mode & selected preview
  useEffect(() => {
    if (mode === "camera" && !selectedPreviewUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, selectedPreviewUrl]);

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally for natural mirror selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    stopCamera();
    onFaceSelected(canvas, dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        onFaceSelected(img, result);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleClear = () => {
    onClear();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Foto Wajah Target
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Gunakan selfie atau unggah foto wajah Anda yang menghadap depan
          </p>
        </div>

        {/* Tab mode */}
        <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium">
          <button
            type="button"
            disabled={isProcessing || disabled}
            onClick={() => {
              setMode("upload");
              stopCamera();
            }}
            className={`px-3 py-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${
              mode === "upload"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            disabled={isProcessing || disabled}
            onClick={() => {
              setMode("camera");
              if (!selectedPreviewUrl) {
                startCamera();
              }
            }}
            className={`px-3 py-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${
              mode === "camera"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Kamera Selfie
          </button>
        </div>
      </div>

      <div className="mt-4">
        {selectedPreviewUrl ? (
          <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <div className="relative">
              <img
                src={selectedPreviewUrl}
                alt="Wajah Target"
                className={`w-36 h-36 object-cover rounded-xl border-2 border-zinc-300 dark:border-zinc-600 shadow-sm transition-all ${
                  isProcessing ? "opacity-60 blur-[1px]" : ""
                }`}
              />

              {/* Processing Spinner Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-zinc-950/65 rounded-xl flex flex-col items-center justify-center text-white backdrop-blur-[1px]">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mb-1.5" />
                  <span className="text-[11px] font-semibold tracking-tight">
                    Menganalisis...
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleClear}
                disabled={isProcessing || disabled}
                aria-label="Hapus foto wajah"
                className="absolute -top-2 -right-2 p-1.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-full hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors shadow disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Status indicator */}
            <div className="mt-3 text-center">
              {detectionStatus === "detecting" && (
                <div className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Mengekstrak vektor fitur wajah (128-d)...
                </div>
              )}
              {detectionStatus === "success" && (
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Wajah utama berhasil terdeteksi dan siap dicocokkan
                </div>
              )}
              {detectionStatus === "error" && (
                <div className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium text-center max-w-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage || "Wajah tidak terdeteksi. Silakan coba foto lain."}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleClear}
              disabled={isProcessing || disabled}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:no-underline"
            >
              <RotateCcw className="w-3 h-3" />
              Ambil Ulang / Ganti Foto
            </button>
          </div>
        ) : mode === "camera" ? (
          <div className="flex flex-col items-center">
            {cameraError ? (
              <div className="w-full p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-center">
                <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
                <p className="text-xs text-rose-700 dark:text-rose-300 mb-3">{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={disabled}
                  className="px-3 py-1.5 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  Coba Akses Lagi
                </button>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <div className="relative w-full max-w-sm aspect-square bg-zinc-950 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={(e) => {
                      (e.target as HTMLVideoElement).play().catch(() => {});
                    }}
                    className="w-full h-full object-cover -scale-x-100"
                  />
                  {/* Subtle face frame guide */}
                  <div className="absolute inset-8 border-2 border-dashed border-white/40 rounded-full pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  disabled={!isCameraActive || isProcessing || disabled}
                  className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-xs hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none transition-colors flex items-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Camera className="w-4 h-4" />
                  Ambil Foto Sekarang
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isProcessing || disabled}
              onChange={handleFileUpload}
              className="hidden"
              id="face-upload-input"
            />
            <label
              htmlFor={isProcessing || disabled ? undefined : "face-upload-input"}
              className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors ${
                isProcessing || disabled
                  ? "opacity-50 cursor-not-allowed border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-800/10 pointer-events-none"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer bg-zinc-50/50 dark:bg-zinc-800/20"
              }`}
            >
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                Pilih foto wajah dari perangkat
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                Format JPG, PNG, atau WebP (Disarankan foto close-up wajah sendiri)
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export interface TargetFaceItem {
  id: string;
  previewUrl: string;
  descriptor: Float32Array;
  label: string;
}

interface CameraCaptureProps {
  targetFaces: TargetFaceItem[];
  onAddFace: (
    imageElement: HTMLImageElement | HTMLCanvasElement,
    previewUrl: string,
    label: string,
  ) => void;
  onRemoveFace: (id: string) => void;
  isProcessing: boolean;
  detectionStatus: "idle" | "detecting" | "success" | "error";
  errorMessage: string | null;
  disabled?: boolean;
}

export function CameraCapture({
  targetFaces,
  onAddFace,
  onRemoveFace,
  isProcessing,
  detectionStatus,
  errorMessage,
  disabled = false,
}: CameraCaptureProps) {
  const [mode, setMode] = useState<"camera" | "upload">("upload");
  const [isAddingMore, setIsAddingMore] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isStartingRef = useRef(false);

  const isCaptureActive = targetFaces.length === 0 || isAddingMore;

  const currentLabel =
    targetFaces.length === 0
      ? "Wajah Depan"
      : targetFaces.length === 1
        ? "Wajah Samping / 3/4"
        : "Wajah Pose Lain";

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
    if (videoRef.current && stream && isCaptureActive && mode === "camera") {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [stream, isCaptureActive, mode]);

  // Automatically start or stop camera based on active mode & state
  useEffect(() => {
    if (mode === "camera" && isCaptureActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, isCaptureActive]);

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
    onAddFace(canvas, dataUrl, currentLabel);
    setIsAddingMore(false);
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
        onAddFace(img, result, currentLabel);
        setIsAddingMore(false);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span>Foto Wajah Target</span>
            {targetFaces.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium">
                {targetFaces.length}/3 Sudut
              </span>
            )}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {targetFaces.length === 0
              ? "Gunakan selfie atau unggah foto wajah tampak depan"
              : "Foto referensi untuk mendeteksi wajah Anda dari berbagai sudut"}
          </p>
        </div>

        {/* Action button: Batal when adding more, or Mode switcher */}
        {isAddingMore ? (
          <button
            type="button"
            onClick={() => setIsAddingMore(false)}
            disabled={isProcessing}
            className="px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 disabled:opacity-40"
          >
            <ArrowLeft className="w-3 h-3" />
            Kembali
          </button>
        ) : isCaptureActive ? (
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
              Upload
            </button>
            <button
              type="button"
              disabled={isProcessing || disabled}
              onClick={() => {
                setMode("camera");
                startCamera();
              }}
              className={`px-3 py-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${
                mode === "camera"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Kamera
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        {/* Enrolled Target Faces View */}
        {!isCaptureActive ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {targetFaces.map((face, index) => (
                <div
                  key={face.id}
                  className="relative p-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700 flex flex-col items-center group"
                >
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    <img
                      src={face.previewUrl}
                      alt={face.label}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveFace(face.id)}
                      disabled={disabled || isProcessing}
                      aria-label="Hapus foto ini"
                      className="absolute top-1 right-1 p-1 bg-zinc-900/80 hover:bg-rose-600 text-white rounded-full transition-colors shadow disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="mt-1.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-full text-center">
                    {index === 0 ? "1. Wajah Depan" : `${index + 1}. ${face.label}`}
                  </span>
                </div>
              ))}

              {/* Add More Angle Button Card */}
              {targetFaces.length < 3 && (
                <button
                  type="button"
                  onClick={() => setIsAddingMore(true)}
                  disabled={disabled || isProcessing}
                  className="p-3 border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center text-center transition-colors min-h-28 group hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800 group-hover:bg-indigo-600 group-hover:text-white text-zinc-500 rounded-full transition-colors mb-1">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                    + Tambah Sudut
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    (Samping / Miring)
                  </span>
                </button>
              )}
            </div>

            {/* Hint Box for Angle Detection */}
            <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-lg flex items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Tips Wajah Sudut:</strong> Menambahkan foto tampak depan dan foto sedikit menoleh ke samping membuat AI mendeteksi foto Anda di Google Drive bahkan saat pose miring.
              </span>
            </div>
          </div>
        ) : (
          /* Active Camera or Upload View */
          <div>
            {targetFaces.length > 0 && (
              <div className="mb-3 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-lg text-xs font-medium text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                <span>Mengambil {currentLabel}...</span>
                <span className="text-[11px] text-zinc-400">Pose agak miring/samping</span>
              </div>
            )}

            {mode === "camera" ? (
              <div className="flex flex-col items-center">
                {cameraError ? (
                  <div className="w-full p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-center">
                    <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
                    <p className="text-xs text-rose-700 dark:text-rose-300 mb-3">
                      {cameraError}
                    </p>
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
                    Format JPG, PNG, atau WebP (Foto sendiri tampak {currentLabel})
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Global Detection Status Feedback */}
        <div className="mt-3">
          {detectionStatus === "detecting" && (
            <div className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Mengekstrak fitur vektor wajah (128-d)...
            </div>
          )}
          {detectionStatus === "error" && (
            <div className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage || "Wajah tidak terdeteksi. Silakan coba foto lain."}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

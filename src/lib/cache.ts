import { get, set, clear } from "idb-keyval";
import { FaceDetail } from "@/hooks/useFaceApi";

const CACHE_PREFIX = "drive_face_v6_";

interface RawCachedItem {
  descriptor: number[];
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
    imageWidth: number;
    imageHeight: number;
  };
}

export async function getCachedFaces(
  fileId: string,
): Promise<FaceDetail[] | null> {
  try {
    const raw = await get<RawCachedItem[]>(`${CACHE_PREFIX}${fileId}`);
    if (raw !== undefined && Array.isArray(raw)) {
      return raw.map((item) => ({
        descriptor: new Float32Array(item.descriptor),
        box: item.box,
      }));
    }
  } catch (err) {
    console.warn("Gagal membaca cache IndexedDB:", err);
  }
  return null;
}

export async function setCachedFaces(
  fileId: string,
  faces: FaceDetail[],
): Promise<void> {
  try {
    const raw: RawCachedItem[] = faces.map((f) => ({
      descriptor: Array.from(f.descriptor),
      box: f.box,
    }));
    await set(`${CACHE_PREFIX}${fileId}`, raw);
  } catch (err) {
    console.warn("Gagal menyimpan cache IndexedDB:", err);
  }
}

export async function clearAllDescriptorCache(): Promise<void> {
  try {
    await clear();
  } catch (err) {
    console.warn("Gagal membersihkan cache IndexedDB:", err);
  }
}


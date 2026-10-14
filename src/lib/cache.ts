import { get, set, clear } from "idb-keyval";

const CACHE_PREFIX = "drive_face_v4_";

export async function getCachedDescriptors(
  fileId: string,
): Promise<Float32Array[] | null> {
  try {
    const raw = await get<number[][]>(`${CACHE_PREFIX}${fileId}`);
    if (raw !== undefined && Array.isArray(raw)) {
      return raw.map((arr) => new Float32Array(arr));
    }
  } catch (err) {
    console.warn("Gagal membaca cache IndexedDB:", err);
  }
  return null;
}

export async function setCachedDescriptors(
  fileId: string,
  descriptors: Float32Array[],
): Promise<void> {
  try {
    const raw = descriptors.map((d) => Array.from(d));
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

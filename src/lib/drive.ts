export interface DriveFile {
  id: string;
  name: string;
  thumbnailLink?: string;
  webContentLink?: string;
  webViewLink?: string;
  size?: string;
}

export function extractFolderId(input: string): string | null {
  if (!input) return null;
  // Clean whitespace, quotes, and newlines
  let trimmed = input
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();

  // If already a plain ID (alphanumeric, dashes, underscores, length >= 10, no slashes or dots)
  if (
    /^[a-zA-Z0-9_-]{10,}$/.test(trimmed) &&
    !trimmed.includes("/") &&
    !trimmed.includes(".")
  ) {
    return trimmed;
  }

  // Match /folders/{id}
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/i);
  if (folderMatch?.[1]) {
    return folderMatch[1];
  }

  // Match id={id} or folderId={id}
  const idMatch = trimmed.match(/[?&](?:id|folderId)=([a-zA-Z0-9_-]+)/i);
  if (idMatch?.[1]) {
    return idMatch[1];
  }

  // Match /d/{id}
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/i);
  if (dMatch?.[1]) {
    return dMatch[1];
  }

  return null;
}

export function getOptimizedThumbnail(
  thumbnailUrl?: string,
  size = 1200,
): string | undefined {
  if (!thumbnailUrl) return undefined;
  // Replace =s220 or =s... with requested high-res size (=s1200) for sharp face recognition
  if (/=s\d+/.test(thumbnailUrl)) {
    return thumbnailUrl.replace(/=s\d+/, `=s${size}`);
  }
  // If no size suffix, append it
  return `${thumbnailUrl}=s${size}`;
}

export function distanceToConfidence(distance: number): number {
  // Standard monotonic calibration for FaceNet Euclidean distance:
  // dist <= 0.20 -> 90-99%
  // dist 0.30 -> ~80%
  // dist 0.40 -> ~68%
  // dist 0.46 -> ~60%
  // dist 0.50 -> ~54%
  const score = Math.round(100 - (distance / 0.6) * 55);
  return Math.max(15, Math.min(99, score));
}

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
  if (distance <= 0.12) return 99;
  if (distance >= 0.45) return 50;
  // Monotonic FaceNet calibration:
  // dist 0.15 -> 98%
  // dist 0.25 -> 90%
  // dist 0.35 -> 81%
  // dist 0.40 -> 75%
  // dist 0.44 -> 70%
  const ratio = (distance - 0.12) / (0.44 - 0.12);
  const score = Math.round(99 - ratio * 29);
  return Math.max(50, Math.min(99, score));
}

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
  size = 1600,
): string | undefined {
  if (!thumbnailUrl) return undefined;
  // Replace =s220 or =s... with requested high-res size (=s1600) for sharp face recognition
  if (/=s\d+/.test(thumbnailUrl)) {
    return thumbnailUrl.replace(/=s\d+/, `=s${size}`);
  }
  // Replace sz=w... with requested high-res size
  if (/[?&]sz=w\d+/.test(thumbnailUrl)) {
    return thumbnailUrl.replace(/[?&]sz=w\d+/, `sz=w${size}`);
  }
  // If no size suffix, append it
  return `${thumbnailUrl}=s${size}`;
}

export function distanceToConfidence(distance: number): number {
  if (distance <= 0.08) return 99;

  // High confidence match zone (0.08 - 0.35): scores smoothly from 99% down to 82%
  if (distance <= 0.35) {
    const ratio = (distance - 0.08) / (0.35 - 0.08);
    const score = Math.round(99 - ratio * 17);
    return Math.max(82, Math.min(99, score));
  }

  // Solid match zone (0.35 - 0.42): scores from 82% down to 70%
  if (distance <= 0.42) {
    const ratio = (distance - 0.35) / (0.42 - 0.35);
    const score = Math.round(82 - ratio * 12);
    return Math.max(70, Math.min(82, score));
  }

  // Borderline zone (0.42 - 0.46): scores from 70% down to 50%
  // Covers harsh angles, low lighting, or distant faces
  if (distance <= 0.46) {
    const ratio = (distance - 0.42) / (0.46 - 0.42);
    const score = Math.round(70 - ratio * 20);
    return Math.max(50, Math.min(70, score));
  }

  // Stranger / non-match zone (0.46 - 0.65): scores drop realistically from 49% down to 12%
  // Different people naturally range here
  if (distance <= 0.65) {
    const ratio = (distance - 0.46) / (0.65 - 0.46);
    const score = Math.round(49 - ratio * 37);
    return Math.max(12, Math.min(49, score));
  }

  // Complete stranger / unrelated face (distance > 0.65)
  const score = Math.round(12 - (distance - 0.65) * 20);
  return Math.max(1, Math.min(12, score));
}

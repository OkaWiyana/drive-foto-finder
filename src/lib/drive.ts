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
  if (distance <= 0.08) return 99;

  // Match zone (distance <= 0.44): scores smoothly from 99% down to 70%
  if (distance <= 0.44) {
    const ratio = (distance - 0.08) / (0.44 - 0.08);
    const score = Math.round(99 - ratio * 29);
    return Math.max(70, Math.min(99, score));
  }

  // Non-match zone (distance > 0.44): realistic, continuous drop from 69% down to 5%
  // Strangers naturally range between 10% - 55% based on actual geometric embedding distance
  if (distance <= 0.90) {
    const ratio = (distance - 0.44) / (0.90 - 0.44);
    const score = Math.round(69 - ratio * 64);
    return Math.max(5, Math.min(69, score));
  }

  // Extreme distance (> 0.90): completely unrelated faces
  const extremeScore = Math.round(5 - (distance - 0.90) * 15);
  return Math.max(1, Math.min(5, extremeScore));
}

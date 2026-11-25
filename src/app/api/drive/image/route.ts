import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST_PATTERNS = [
  /^([a-z0-9-]+\.)?googleusercontent\.com$/i,
  /^drive\.google\.com$/i,
  /^([a-z0-9-]+\.)?googleapis\.com$/i,
];

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

function extractFileIdFromUrl(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);
    // e.g. /d/{fileId}=s...
    const dMatch = url.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/i);
    if (dMatch?.[1]) return dMatch[1];

    // e.g. ?id={fileId}
    const idParam = url.searchParams.get("id");
    if (idParam && /^[a-zA-Z0-9_-]{10,}$/.test(idParam)) return idParam;
  } catch {
    // ignore
  }
  return null;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB limit

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetUrl = searchParams.get("url");
    const rawFileId = searchParams.get("fileId");

    // Validate fileId format to prevent path/query manipulation
    if (rawFileId && !/^[a-zA-Z0-9_-]{10,}$/.test(rawFileId)) {
      return NextResponse.json(
        { error: "Format fileId tidak valid." },
        { status: 400 },
      );
    }

    const effectiveFileId =
      rawFileId || (targetUrl ? extractFileIdFromUrl(targetUrl) : null);

    if (!targetUrl && !effectiveFileId) {
      return NextResponse.json(
        { error: "Parameter url atau fileId diperlukan." },
        { status: 400 },
      );
    }

    const candidateUrls: string[] = [];

    if (targetUrl) {
      try {
        const parsedUrl = new URL(targetUrl);
        // Enforce HTTPS protocol and whitelist hostnames
        if (parsedUrl.protocol === "https:" && isAllowedHost(parsedUrl.hostname)) {
          candidateUrls.push(targetUrl);
        }
      } catch {
        // invalid URL format, ignore
      }
    }

    if (effectiveFileId) {
      const cdn1 = `https://lh3.googleusercontent.com/d/${effectiveFileId}=s1024`;
      const cdn2 = `https://drive.google.com/thumbnail?id=${effectiveFileId}&sz=w1024`;
      if (!candidateUrls.includes(cdn1)) candidateUrls.push(cdn1);
      if (!candidateUrls.includes(cdn2)) candidateUrls.push(cdn2);
    }

    if (candidateUrls.length === 0) {
      return NextResponse.json(
        { error: "URL gambar atau Host tidak diizinkan." },
        { status: 403 },
      );
    }

    let lastErrorStatus = 500;
    let lastErrorMessage = "Gagal memuat gambar dari server Google Drive.";

    for (const fetchUrl of candidateUrls) {
      try {
        const imageRes = await fetch(fetchUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "image/avif,image/webp,image/apng,image/jpeg,image/png,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(12000),
          next: { revalidate: 86400 },
        });

        if (imageRes.ok) {
          // Check Content-Length to prevent OOM/DoS attacks
          const contentLengthStr = imageRes.headers.get("content-length");
          if (contentLengthStr) {
            const contentLength = parseInt(contentLengthStr, 10);
            if (contentLength > MAX_IMAGE_BYTES) {
              return NextResponse.json(
                { error: "Ukuran file melebihi batas aman (15MB)." },
                { status: 413 },
              );
            }
          }

          // Whitelist safe raster image Content-Types to prevent XSS via SVG/HTML
          const rawContentType = (
            imageRes.headers.get("content-type") || "image/jpeg"
          )
            .split(";")[0]
            .trim()
            .toLowerCase();

          const safeContentType = ALLOWED_MIME_TYPES.has(rawContentType)
            ? rawContentType
            : "image/jpeg";

          // If the upstream returned HTML or SVG, reject to prevent stored/reflected XSS
          if (rawContentType.includes("html") || rawContentType.includes("svg")) {
            return NextResponse.json(
              { error: "Format file bukan gambar yang didukung." },
              { status: 415 },
            );
          }

          const imageArrayBuffer = await imageRes.arrayBuffer();

          // Double check downloaded byte length
          if (imageArrayBuffer.byteLength > MAX_IMAGE_BYTES) {
            return NextResponse.json(
              { error: "Ukuran file melebihi batas aman (15MB)." },
              { status: 413 },
            );
          }

          return new NextResponse(imageArrayBuffer, {
            status: 200,
            headers: {
              "Content-Type": safeContentType,
              "X-Content-Type-Options": "nosniff",
              "Content-Disposition": "inline",
              "Cache-Control":
                "public, max-age=86400, stale-while-revalidate=604800",
              "Access-Control-Allow-Origin": "*",
              "Cross-Origin-Resource-Policy": "cross-origin",
            },
          });
        } else {
          lastErrorStatus = imageRes.status;
          lastErrorMessage = `Google Drive mengembalikan status ${imageRes.status}`;
        }
      } catch (err: unknown) {
        lastErrorMessage =
          err instanceof Error
            ? err.message
            : "Kesalahan koneksi saat mengambil gambar.";
      }
    }

    return NextResponse.json(
      { error: lastErrorMessage },
      { status: lastErrorStatus },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Kesalahan server internal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

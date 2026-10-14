import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST_PATTERNS = [
  /^([a-z0-9-]+\.)?googleusercontent\.com$/i,
  /^drive\.google\.com$/i,
  /^([a-z0-9-]+\.)?googleapis\.com$/i,
];

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetUrl = searchParams.get("url");
    const fileId = searchParams.get("fileId");

    let fetchUrl: string;

    if (targetUrl) {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(targetUrl);
      } catch {
        return NextResponse.json(
          { error: "URL gambar tidak valid." },
          { status: 400 }
        );
      }

      if (!isAllowedHost(parsedUrl.hostname)) {
        return NextResponse.json(
          { error: "Host gambar tidak diizinkan." },
          { status: 403 }
        );
      }

      fetchUrl = targetUrl;
    } else if (fileId) {
      const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "GOOGLE_DRIVE_API_KEY tidak tersedia." },
          { status: 500 }
        );
      }
      fetchUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        fileId
      )}?alt=media&key=${apiKey}`;
    } else {
      return NextResponse.json(
        { error: "Parameter url atau fileId diperlukan." },
        { status: 400 }
      );
    }

    const imageRes = await fetch(fetchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!imageRes.ok) {
      return NextResponse.json(
        { error: `Gagal mengambil gambar (${imageRes.status})` },
        { status: imageRes.status }
      );
    }

    const contentType =
      imageRes.headers.get("content-type") || "image/jpeg";
    const imageArrayBuffer = await imageRes.arrayBuffer();

    return new NextResponse(imageArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Kesalahan server internal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

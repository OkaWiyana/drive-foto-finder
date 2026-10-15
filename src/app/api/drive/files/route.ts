import { NextRequest, NextResponse } from "next/server";
import { extractFolderId, getOptimizedThumbnail, DriveFile } from "@/lib/drive";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawFolderInput = searchParams.get("folderId");

    if (!rawFolderInput) {
      return NextResponse.json(
        { success: false, error: "Parameter folderId wajib disertakan." },
        { status: 400 },
      );
    }

    const folderId = extractFolderId(rawFolderInput);
    if (!folderId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Format link atau ID Google Drive tidak valid. Pastikan format link seperti: https://drive.google.com/drive/folders/...",
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GOOGLE_DRIVE_API_KEY belum dikonfigurasi di server (.env.local).",
        },
        { status: 500 },
      );
    }

    const allFiles: DriveFile[] = [];
    const seenFileIds = new Set<string>();
    const queue: string[] = [folderId];
    const visitedFolders = new Set<string>([folderId]);
    const MAX_FOLDERS = 60; // Crawl up to 60 subfolders
    let scannedFolderCount = 0;

    while (queue.length > 0 && scannedFolderCount < MAX_FOLDERS) {
      const currentFolderId = queue.shift()!;
      scannedFolderCount++;

      let pageToken: string | null = null;
      let pageCount = 0;
      const maxPagesPerFolder = 5;

      do {
        pageCount++;
        // Note: Google Drive API strictly prohibits 'or' between parents.
        // Each query MUST use a single parent ID!
        const queryParams = new URLSearchParams({
          q: `'${currentFolderId}' in parents and trashed = false`,
          fields:
            "nextPageToken, files(id, name, mimeType, thumbnailLink, webContentLink, webViewLink, size)",
          pageSize: "1000",
          key: apiKey,
        });

        if (pageToken) {
          queryParams.set("pageToken", pageToken);
        }

        const driveRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?${queryParams.toString()}`,
          {
            headers: { Accept: "application/json" },
            next: { revalidate: 60 },
          },
        );

        if (!driveRes.ok) {
          const errorData = await driveRes.json().catch(() => null);
          const rawMessage = errorData?.error?.message;

          // If the ROOT folder fails, return the error immediately
          if (currentFolderId === folderId) {
            if (driveRes.status === 404) {
              return NextResponse.json(
                {
                  success: false,
                  error:
                    "Folder tidak ditemukan. Pastikan folder sudah disetel ke 'Siapa saja yang memiliki link dapat melihat' (Public).",
                },
                { status: 404 },
              );
            }

            if (driveRes.status === 403) {
              return NextResponse.json(
                {
                  success: false,
                  error: rawMessage
                    ? `Akses ditolak (${rawMessage}). Pastikan folder Google Drive disetel ke 'Siapa saja yang memiliki link dapat melihat' (Publik).`
                    : "Akses ditolak oleh Google. Pastikan folder publik dan API key aktif.",
                },
                { status: 403 },
              );
            }

            return NextResponse.json(
              {
                success: false,
                error: rawMessage || `Google Drive error (${driveRes.status})`,
              },
              { status: driveRes.status },
            );
          } else {
            // If a nested subfolder is restricted, skip it and continue with remaining folders
            console.warn(`Subfolder ${currentFolderId} dilewati:`, rawMessage);
            break;
          }
        }

        const data = await driveRes.json();
        const items = data.files || [];

        for (const item of items) {
          // If subfolder, enqueue for recursive crawling
          if (item.mimeType === "application/vnd.google-apps.folder") {
            if (!visitedFolders.has(item.id)) {
              visitedFolders.add(item.id);
              queue.push(item.id);
            }
          } else {
            const isImage =
              (item.mimeType && item.mimeType.startsWith("image/")) ||
              /\.(jpe?g|png|webp|heic|avif)$/i.test(item.name || "");

            if (isImage && !seenFileIds.has(item.id)) {
              seenFileIds.add(item.id);
              const fallbackThumb = `https://lh3.googleusercontent.com/d/${item.id}=s1024`;
              const thumbnailLink =
                getOptimizedThumbnail(item.thumbnailLink, 1024) || fallbackThumb;

              allFiles.push({
                id: item.id,
                name: item.name,
                thumbnailLink,
                webContentLink: item.webContentLink,
                webViewLink: item.webViewLink,
                size: item.size,
              });
            }
          }
        }

        pageToken = data.nextPageToken || null;
      } while (pageToken && pageCount < maxPagesPerFolder);
    }

    return NextResponse.json({
      success: true,
      folderId,
      totalFoldersScanned: visitedFolders.size,
      total: allFiles.length,
      files: allFiles,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan internal.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

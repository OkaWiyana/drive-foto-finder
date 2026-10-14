# Product Requirements Document (PRD) - DriveFace Finder (MVP)

## 1. Product Overview

Aplikasi web ultra-ringan tanpa database (Zero-Database, Serverless) untuk mencari foto diri sendiri di dalam link folder Google Drive publik (seperti dokumentasi wisuda, lari, atau event) menggunakan pemindaian wajah (selfie/upload). Seluruh pemrosesan AI dilakukan 100% di sisi browser pengguna (Client-Side) demi privasi dan agar dapat di-deploy gratis di Vercel Hobby Tier.

## 2. Core Architecture & Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling & UI:** Tailwind CSS + Lucide React (Icons)
- **AI Engine (Client-Side):** `@vladmandic/face-api` (berjalan di browser via WebGL/TensorFlow.js)
- **Local Caching:** `idb-keyval` (IndexedDB wrapper untuk menyimpan cache vektor wajah per Folder ID di browser agar tidak perlu scan ulang jika halaman di-refresh)
- **External API:** Google Drive API v3 (Hanya menggunakan API Key publik untuk membaca metadata folder publik)
- **Deployment:** Vercel Free Tier (Stateless)

## 3. User Flow (Alur Pengguna)

1. **Input Folder:** User menempelkan (paste) URL folder Google Drive publik. Sistem mengekstrak `folderId` menggunakan Regex.
2. **Input Wajah (Target):** User mengambil foto selfie via WebRTC Webcam atau mengunggah foto wajah dari galeri.
3. **Ekstraksi Vajah Target:** Browser mengekstrak 128-float face descriptor dari foto user (disimpan di variabel state RAM, gambar asli tidak pernah dikirim ke server).
4. **Fetch Metadata Drive:** Web memanggil endpoint internal `/api/drive?folderId=xxx` untuk mengambil daftar semua file gambar (`id`, `name`, `thumbnailLink`, `webContentLink`).
5. **Streaming Scan & Pencocokan:**
   - Cek apakah `descriptor` untuk `file.id` sudah ada di `IndexedDB` lokal browser.
   - Jika belum, unduh gambar menggunakan `thumbnailLink` yang dimodifikasi ke resolusi menengah (`=s600` agar ukuran ~40KB namun wajah grup tetap terbaca).
   - Deteksi semua wajah di foto tersebut (`detectAllFaces`), simpan descriptor-nya ke IndexedDB lokal.
   - Hitung jarak Euclidean (`faceapi.euclideanDistance`) antara wajah user dan semua wajah di foto event (Threshold: `< 0.52`).
   - Jika cocok, langsung tampilkan foto ke galeri hasil secara real-time (streaming UI) sembari progress bar terus berjalan.
6. **Preview & Download:** User dapat mengklik foto hasil pencarian untuk melihat preview resolusi tinggi dan mengunduh file asli langsung dari Google Drive.

## 4. Technical Requirements & Endpoints

### A. Backend API Routes (Hanya Proxy Ringan)

1. `GET /api/drive/files?folderId=[id]`
   - Memanggil `https://www.googleapis.com/drive/v3/files` dengan parameter `q='{folderId}' in parents and mimeType contains 'image/' and trashed = false` dan `fields=files(id, name, thumbnailLink, webContentLink, webViewLink)`.
   - Menggunakan `process.env.GOOGLE_DRIVE_API_KEY`.
2. `GET /api/drive/image?url=[encodedThumbnailUrl]`
   - Proxy image fetcher untuk menghindari error CORS Canvas (`Tainted Canvas`) saat `@vladmandic/face-api` membaca piksel dari `thumbnailLink` Google Drive.

### B. Client-Side AI & Concurrency

- Model yang wajib dimuat dari folder `/public/models`:
  1. `ssd_mobilenetv1` (Akurasi tinggi untuk foto ramai-ramai/grup wisuda)
  2. `face_landmark_68`
  3. `face_recognition`
- Pemindaian dilakukan secara _batching_ (maksimal 3-4 foto diproses paralel) menggunakan antrean asinkron agar UI browser tidak _freeze_.

## 5. Out of Scope (Batasan MVP)

- Tidak ada fitur Login / Autentikasi.
- Tidak ada Database eksternal (PostgreSQL/MongoDB/Supabase).
- Tidak menyimpan foto pengguna di server mana pun.

# 📸 Drive Face Finder

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Website-success?style=for-the-badge&logo=vercel)](https://drive-face-finder.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4%20(Turbopack)-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![face-api](https://img.shields.io/badge/AI-Face--API.js-orange?style=for-the-badge)](https://github.com/vladmandic/face-api)

Aplikasi web ultra-ringan tanpa database (*Zero-Database*, *Client-Side AI*) untuk mencari foto diri Anda di dalam folder **Google Drive publik** (seperti dokumentasi wisuda, acara lari/marathon, seminar, konser, atau gathering) secara otomatis menggunakan teknologi **Pengenalan Wajah (Face Recognition AI)**.

Seluruh pemrosesan AI dijalankan **100% di sisi browser pengguna (Client-Side)** menggunakan WebAssembly/WebGL demi menjaga privasi dan keamanan foto pengguna.

🔗 **Website Live:** [https://drive-face-finder.vercel.app/](https://drive-face-finder.vercel.app/)

---

## ✨ Fitur Unggulan

- 🔗 **Integrasi Google Drive Publik & Sub-Folder**: Cukup tempel tautan folder Google Drive publik. Sistem secara otomatis membaca folder utama hingga sub-folder di dalamnya.
- 🤳 **Multi-Angle Face Enrollment**: Ambil atau unggah beberapa foto wajah sekaligus dari berbagai sudut (depan, miring, tersenyum) untuk memaksimalkan akurasi pengenalan.
- 🎚️ **Pengaturan Toleransi Kemiripan Real-Time**:
  - Slider threshold (0.36 – 0.50) untuk menyesuaikan sensitivitas kemiripan.
  - Preset cepat: **Sangat Ketat (0.38)**, **Standar Akurat (0.42)**, dan **Fleksibel (0.46)**.
  - Galeri langsung memperbarui hasil foto yang cocok secara instan saat slider digeser tanpa perlu memindai ulang.
- 🔒 **100% Menjaga Privasi (Client-Side AI)**:
  - Ekstraksi vektor wajah (128-float descriptors) dan perbandingan Euclidean distance diproses lokal di peramban pengguna via `@vladmandic/face-api`.
  - Foto selfie maupun data biometrik Anda tidak pernah dikirim, disimpan, atau diunggah ke server manapun.
- ⚡ **Caching Cerdas (IndexedDB)**:
  - Cache vektor wajah disimpan di browser (`idb-keyval`). Pemindaian berulang pada folder yang sama akan berjalan instan.
  - Tersedia opsi *Bersihkan Cache* sewaktu-waktu.
- 📊 **Streaming Progress Bar Real-Time**: Status pemindaian, jumlah foto terproses, dan foto yang cocok muncul satu per satu secara langsung.
- 🖼️ **Modal Preview & Direct Download**: Pratinjau foto resolusi tinggi lengkap dengan bounding box wajah dan tombol unduh langsung dari Google Drive.
- 📱 **Desain Responsif & SEO-Friendly**: Dilengkapi metadata komprehensif, OpenGraph, Schema JSON-LD (`WebApplication` & `FAQPage`), sitemap, dan robots.txt.

---

## 🛠️ Tech Stack & Arsitektur

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (Turbopack, App Router) + TypeScript | Fullstack React framework |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) | Desain antarmuka responsif dan modern |
| **AI Engine** | [`@vladmandic/face-api`](https://github.com/vladmandic/face-api) | Deteksi & ekstraksi vektor 128-float via WebGL |
| **Model AI** | SSD MobileNet v1, 68-Point Landmark, Face Recognition | Model dimuat dari direktori `/public/models` |
| **Local Cache** | [`idb-keyval`](https://github.com/jakearchibald/idb-keyval) | IndexedDB wrapper untuk caching vektor per file |
| **External API** | Google Drive API v3 | Membaca metadata file di folder publik |
| **Deployment** | [Vercel](https://vercel.com/) | Serverless & Edge deployment |

### 📂 Struktur Direktori

```text
src/
├── app/
│   ├── api/
│   │   └── drive/
│   │       ├── files/route.ts       # Endpoint fetch metadata Google Drive
│   │       └── image/route.ts       # Image proxy untuk bypass CORS
│   ├── layout.tsx                   # Root layout & SEO metadata
│   ├── page.tsx                     # Main view orchestrator
│   ├── robots.ts                    # Dynamic robots.txt
│   └── sitemap.ts                   # Dynamic sitemap.xml
├── components/
│   ├── CameraCapture.tsx            # Komponen selfie webcam / upload foto
│   ├── DriveInput.tsx               # Input link Google Drive publik
│   ├── FaqAndGuideSection.tsx       # Panduan, Privasi, FAQ & JSON-LD
│   ├── Footer.tsx                   # Footer & developer credits
│   ├── Header.tsx                   # Navbar & status AI model
│   ├── PhotoCard.tsx                # Kartu tampilan hasil foto
│   ├── PhotoPreviewModal.tsx        # Modal zoom & download foto
│   ├── ScanControlPanel.tsx         # Checklist status, slider toleransi & tombol scan
│   └── ScanningProgress.tsx         # Progress bar pemindaian
├── hooks/
│   ├── useFaceApi.ts                # Inisialisasi & abstraksi Face-API.js
│   └── usePhotoScanner.ts           # Concurrency pool & logika pemindaian foto
└── lib/
    ├── cache.ts                     # IndexedDB cache helper
    └── drive.ts                     # Drive ID parser & kalkulator confidence
```

---

## 🚀 Alur Penggunaan (User Flow)

1. **Buka Aplikasi**: Kunjungi [https://drive-face-finder.vercel.app/](https://drive-face-finder.vercel.app/).
2. **Masukkan Link Google Drive**: Tempel link folder Google Drive publik yang berisi kumpulan foto acara (pastikan akses folder disetel *"Siapa saja yang memiliki link dapat melihat"*).
3. **Pilih/Ambil Wajah Anda**: Ambil selfie langsung lewat kamera atau unggah foto wajah dari galeri. Anda bisa menambahkan lebih dari satu foto untuk hasil lebih akurat.
4. **Mulai Pemindaian**: Tekan tombol *Mulai Pindai Foto*. AI akan membandingkan vektor wajah dengan toleransi jarak Euclidean.
5. **Temukan & Unduh**: Foto yang cocok langsung muncul di galeri. Klik foto untuk melihat detail atau mengunduh versi resolusi aslinya.

---

## 💻 Panduan Menjalankan di Lokal (Local Development)

### 1. Prasyarat
- [Node.js](https://nodejs.org/) (versi 18.x atau lebih baru)
- npm / pnpm / yarn
- Google Drive API Key (dapat diperoleh gratis melalui [Google Cloud Console](https://console.cloud.google.com/))

### 2. Clone Repository
```bash
git clone https://github.com/OkaWiyana/drive-foto-finder.git
cd drive-foto-finder
```

### 3. Install Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment Variables
Salin file `env.example` menjadi `.env.local`:
```bash
cp env.example .env.local
```

Buka file `.env.local` dan masukkan kredensial Anda:
```env
GOOGLE_DRIVE_API_KEY=AIzaSy...your_actual_api_key_here
NEXT_PUBLIC_GOOGLE_VERIFICATION=your_optional_verification_token
```

### 5. Jalankan Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) pada peramban Anda.

---

## 📦 Build untuk Produksi

```bash
npm run build
npm run start
```

---

## 👤 Pembuat (Author)

Dibuat dan dikembangkan oleh:
- **Oka Wiyana** - [@OkaWiyana](https://github.com/OkaWiyana)

---

## 📄 Lisensi & Privasi

Aplikasi ini bersifat *Zero-Database*. Tidak ada data identitas wajah, foto personal, atau rekaman kamera yang disimpan di server mana pun. Seluruh operasi biometrik berjalan pada memori sementara peramban Anda.

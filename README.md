# 📸 DriveFace Finder

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Website-success?style=for-the-badge&logo=vercel)](https://drive-foto-finder.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![face-api](https://img.shields.io/badge/AI-Face--API.js-orange?style=for-the-badge)](https://github.com/vladmandic/face-api)

Aplikasi web ultra-ringan tanpa database (*Zero-Database*, *Serverless*) untuk mencari foto diri Anda di dalam folder **Google Drive publik** (seperti dokumentasi wisuda, acara lari/marathon, seminar, konser, atau gathering) secara otomatis menggunakan teknologi **Pengenalan Wajah (Face Recognition AI)**.

Seluruh pemrosesan AI dijalankan **100% di sisi browser pengguna (Client-Side)** demi menjaga privasi dan keamanan foto pengguna.

🔗 **Website Live:** [https://drive-foto-finder.vercel.app/](https://drive-foto-finder.vercel.app/)

---

## ✨ Fitur Utama

- 🔗 **Integrasi Google Drive Publik**: Cukup salin dan tempel link folder Google Drive yang bersifat publik. Sistem otomatis mengekstrak ID folder dan memindai semua foto di dalamnya.
- 🤳 **Fleksibilitas Input Wajah**:
  - Ambil foto selfie langsung via kamera/webcam (WebRTC).
  - Unggah foto wajah yang jelas dari galeri perangkat.
- 🔒 **100% Menjaga Privasi (Client-Side AI)**:
  - Foto selfie Anda dan proses pencocokan wajah diproses secara lokal di browser menggunakan WebGL/TensorFlow.js.
  - Tidak ada foto pengguna yang diunggah atau disimpan di server mana pun.
- ⚡ **Pencarian Cepat & Caching Cerdas**:
  - Menggunakan **IndexedDB** lokal browser (`idb-keyval`) untuk menyimpan cache vektor wajah. Jika Anda memindai folder yang sama lagi, proses pencarian berlangsung instan tanpa memindai ulang.
- 📊 **Streaming & Progress Bar Real-Time**: Hasil foto yang cocok langsung muncul satu per satu saat proses pemindaian berjalan.
- 🖼️ **Preview & Unduh Langsung**: Pratinjau foto resolusi tinggi dan tombol unduh langsung (*direct download*) dari Google Drive.

---

## 🛠️ Tech Stack & Arsitektur

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) (App Router) + TypeScript | Fullstack React framework |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) | Desain responsif dan modern |
| **AI Engine** | [`@vladmandic/face-api`](https://github.com/vladmandic/face-api) | Deteksi & ekstraksi vektor 128-float via WebGL |
| **Model AI** | SSD MobileNet v1, 68-Point Landmark, Face Recognition | Model dimuat dari folder `/public/models` |
| **Local Cache** | [`idb-keyval`](https://github.com/jakearchibald/idb-keyval) | IndexedDB wrapper untuk caching vektor per folder |
| **External API** | Google Drive API v3 | Membaca metadata file di folder publik |
| **Deployment** | [Vercel](https://vercel.com/) | Serverless & Edge deployment |

---

## 🚀 Alur Penggunaan (User Flow)

1. **Buka Aplikasi**: Kunjungi [https://drive-foto-finder.vercel.app/](https://drive-foto-finder.vercel.app/).
2. **Masukkan Link Google Drive**: Tempel link folder Google Drive publik yang berisi kumpulan foto acara.
3. **Pilih/Ambil Wajah Anda**: Ambil selfie dengan webcam atau unggah foto wajah Anda.
4. **Mulai Pemindaian**: Sistem akan mengunduh thumbnail dan mencocokkan wajah dengan toleransi jarak Euclidean (*Euclidean Distance Threshold*).
5. **Temukan & Unduh**: Klik pada foto yang ditemukan untuk memperbesar dan mengunduh file asli resolusi penuh.

---

## 💻 Panduan Menjalankan di Lokal (Local Development)

### 1. Prasyarat
- [Node.js](https://nodejs.org/) (versi 18.x atau lebih baru)
- npm / pnpm / yarn
- Google Drive API Key (dapat diperoleh gratis dari [Google Cloud Console](https://console.cloud.google.com/))

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

Buka file `.env.local` dan masukkan Google Drive API Key Anda:
```env
GOOGLE_DRIVE_API_KEY=AIzaSy...your_actual_api_key_here
```

### 5. Jalankan Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📦 Build untuk Produksi

```bash
npm run build
npm run start
```

---

## 📄 Lisensi & Privasi

Aplikasi ini dibuat untuk tujuan kemudahan dokumentasi acara dan bersifat *Zero-Database*. Tidak ada data identitas wajah atau foto personal yang disimpan secara permanen di server.

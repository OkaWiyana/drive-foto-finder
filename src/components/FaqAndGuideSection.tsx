import React from "react";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

export function FaqAndGuideSection() {
  return (
    <>
      {/* SEO Static Content Section: Panduan, Keunggulan & FAQ */}
      <section
        aria-labelledby="seo-main-heading"
        className="mt-16 pt-12 border-t border-zinc-200 dark:border-zinc-800 space-y-12"
      >
        {/* Main Title & Value Proposition */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Teknologi Face Recognition AI Berbasis Browser</span>
          </div>
          <h1
            id="seo-main-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Cari Foto Wajahmu di Google Drive dalam Hitungan Detik
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Solusi tercepat menemukan foto pribadi Anda dari ribuan dokumentasi
            event, wisuda, konser, dan lomba lari di Google Drive tanpa perlu
            scroll satu per satu secara manual.
          </p>
        </div>

        {/* Section: Cara Mencari Foto Event atau Wisuda */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Cara Mencari Foto Event atau Wisuda di Google Drive
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Hanya butuh 3 langkah praktis untuk memfilter seluruh foto
                secara instan:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Tempel Link Folder Drive
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Salin tautan folder Google Drive publik yang dibagikan oleh
                panitia acara, fotografer wisuda, atau dokumentasi race run
                Anda.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Ambil Foto Selfie Target
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Gunakan kamera langsung atau unggah foto selfie Anda dari
                berbagai sudut (tampak depan, sedikit miring) untuk akurasi
                pengenalan optimal.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Mulai Pindai & Temukan
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                AI akan mencocokkan kemiripan wajah secara otomatis. Foto yang
                cocok akan langsung muncul di galeri hasil untuk diunduh.
              </p>
            </div>
          </div>
        </div>

        {/* Section: Kenapa Aman? */}
        <div className="bg-linear-to-br from-emerald-500/5 via-teal-500/5 to-transparent border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Kenapa Aman? (Privasi 100% Tanpa Database)
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Privasi dan keamanan data biometrik wajah Anda terjamin
                seutuhnya:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Proses 100% Client-Side di Browser
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Seluruh deteksi dan pencocokan vektor wajah dihitung secara
                  lokal di peramban Anda menggunakan WebAssembly dan model AI
                  TensorFlow.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Nol Database & Tanpa Upload Foto
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Kami tidak memiliki server penyimpanan foto atau database
                  biometrik. Begitu tab browser ditutup, seluruh data pemindaian
                  seketika terhapus.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: FAQ */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
              Jawaban lengkap seputar cara kerja, privasi, dan kecocokan fitur
              DriveFace Finder.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <details className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all hover:border-indigo-300 dark:hover:border-indigo-800">
              <summary className="flex items-center justify-between font-semibold text-sm text-zinc-900 dark:text-zinc-100 select-none">
                <span>
                  Bagaimana cara mencari foto sendiri di link Google Drive yang
                  isinya ribuan foto?
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-2" />
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Cukup tempel tautan folder Google Drive publik ke kolom
                pencarian di atas, ambil foto selfie Anda melalui webcam atau
                upload foto dari galeri HP, lalu klik tombol &quot;Mulai
                Pindai&quot;. Sistem AI akan menganalisis setiap wajah dalam
                foto Drive dan memunculkan foto yang cocok dengan Anda secara
                instan.
              </p>
            </details>

            <details className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all hover:border-indigo-300 dark:hover:border-indigo-800">
              <summary className="flex items-center justify-between font-semibold text-sm text-zinc-900 dark:text-zinc-100 select-none">
                <span>Apakah foto selfie saya disimpan di server?</span>
                <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-2" />
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Sama sekali tidak. Privasi pengguna adalah komitmen utama kami.
                Seluruh proses komputasi AI pengenalan wajah berjalan 100% di
                browser perangkat Anda sendiri. Foto maupun data biometrik Anda
                tidak pernah dikirim, disimpan, atau diolah di server manapun.
              </p>
            </details>

            <details className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all hover:border-indigo-300 dark:hover:border-indigo-800">
              <summary className="flex items-center justify-between font-semibold text-sm text-zinc-900 dark:text-zinc-100 select-none">
                <span>
                  Apakah tool ini bisa digunakan untuk mencari foto lari /
                  marathon dan wisuda?
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-2" />
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Ya, tool ini dirancang khusus untuk mempermudah pencarian pada
                dokumentasi acara berskala besar seperti wisuda kampus, lomba
                marathon / fun run, gathering perusahaan, pesta pernikahan,
                maupun konser musik yang biasanya menghasilkan ratusan hingga
                ribuan foto di Google Drive.
              </p>
            </details>

            <details className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all hover:border-indigo-300 dark:hover:border-indigo-800">
              <summary className="flex items-center justify-between font-semibold text-sm text-zinc-900 dark:text-zinc-100 select-none">
                <span>Apakah folder Google Drive harus disetel Publik?</span>
                <ChevronDown className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-2" />
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Ya, folder Google Drive harus memiliki izin akses &quot;Siapa
                saja yang memiliki link&quot; (Anyone with the link can view)
                agar sistem dapat membaca daftar file dan memindai foto langsung
                melalui browser Anda.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Structured Data: WebApplication & FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "DriveFace Finder",
              applicationCategory: "PhotographyApplication",
              operatingSystem: "Web Browser",
              author: {
                "@type": "Person",
                name: "Oka Wiyana",
                url: "https://github.com/OkaWiyana",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "IDR",
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Bagaimana cara mencari foto sendiri di link Google Drive yang isinya ribuan foto?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Cukup salin link folder Google Drive publik yang ingin dicari, ambil atau unggah foto selfie Anda, lalu tekan tombol Mulai Pindai. Sistem AI akan mencocokkan wajah Anda secara otomatis dalam hitungan detik.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Apakah foto selfie saya disimpan di server?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Sama sekali tidak. Seluruh pemindaian wajah diproses 100% secara lokal di browser Anda menggunakan teknologi WebAssembly. Foto selfie maupun data wajah Anda tidak pernah diunggah atau disimpan ke server manapun.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Apakah tool ini bisa digunakan untuk mencari foto lari / marathon dan wisuda?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Ya, tool ini sangat ideal untuk mencari foto dokumentasi massal seperti lomba lari maraton, wisuda universitas, festival musik, pesta pernikahan, dan event komunitas dengan ribuan foto di Google Drive.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Apakah folder Google Drive harus disetel Publik?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Ya, folder Google Drive harus memiliki izin 'Siapa saja yang memiliki link' (Anyone with the link can view) agar web dapat membaca dan memindai foto-foto di dalamnya.",
                  },
                },
              ],
            },
          ]),
        }}
      />
    </>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://drive-face-finder.vercel.app/"),
  title: {
    default: "Drive Face Finder | Cari Foto Wajah di Google Drive Instan",
    template: "%s | Drive Face Finder",
  },
  description:
    "Tools gratis untuk mencari foto wisuda, lari, dan event di link Google Drive menggunakan scan wajah (AI). Cepat, aman, dan tanpa menyimpan data foto Anda.",
  keywords: [
    "Face Finder",
    "Photo Finder",
    "Face Recognition",
    "Face Detection",
    "cari foto di google drive",
    "scan wajah google drive",
    "pencari foto wisuda",
    "cari foto event lewat wajah",
    "face finder google drive",
    "ai pencari foto",
  ],
  icons: {
    icon: "/logo-drive-face-finder.jpg",
    apple: "/logo-drive-face-finder.jpg",
  },
  authors: [{ name: "Oka Wiyana" }],
  openGraph: {
    title: "Drive Face Finder | Cari Foto Wajah di Google Drive Instan",
    description:
      "Malas scroll ratusan foto event di Google Drive? Paste link Drive, selfie, dan temukan semua fotomu dalam hitungan detik!",
    url: "https://drive-face-finder.vercel.app/",
    siteName: "Drive Face Finder",
    locale: "id_ID",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas AI Coach",
  description: "A private, local-first AI fitness coach. Track workouts, log nutrition, and get intelligent coaching — all securely on your device.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Atlas Coach",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Atlas AI Coach",
    description: "Your private AI fitness coach. Track workouts, nutrition, and recovery — securely on your device.",
    type: "website",
    siteName: "Atlas AI Coach",
  },
  twitter: {
    card: "summary",
    title: "Atlas AI Coach",
    description: "Your private AI fitness coach. Track workouts, nutrition, and recovery — securely on your device.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5, // Allow pinch zoom — WCAG 2.1 requires this not be locked
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#07080a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full" suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
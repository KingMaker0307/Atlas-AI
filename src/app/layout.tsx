import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas AI Coach",
  description: "A private, cloud-connected AI fitness coach. Track workouts, log nutrition, and get intelligent coaching — securely synced to your profile.",
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
    description: "Your private AI fitness coach. Track workouts, nutrition, and recovery — securely synced to your profile.",
    type: "website",
    siteName: "Atlas AI Coach",
  },
  twitter: {
    card: "summary",
    title: "Atlas AI Coach",
    description: "Your private AI fitness coach. Track workouts, nutrition, and recovery — securely synced to your profile.",
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
      <head>
        {/* Google Fonts — loaded as <link> to avoid Turbopack CSS @import ordering issues */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
        />
      </head>
      <body className="min-h-full" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
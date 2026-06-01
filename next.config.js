/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  reactStrictMode: true,

  async headers() {
    const isDev = process.env.NODE_ENV === "development";

    const securityHeaders = [
      // Prevent clickjacking (legacy browsers)
      { key: "X-Frame-Options", value: "DENY" },
      // Prevent MIME type sniffing
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Disable DNS prefetching (privacy)
      { key: "X-DNS-Prefetch-Control", value: "off" },
      // Referrer policy
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Permissions policy — disable sensitive APIs we don't use
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
      },
    ];

    // Only add HSTS in production to prevent localhost HTTPS redirect loops in development
    if (!isDev) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    const cspDirectives = [
      "default-src 'self'",
      // Next.js requires unsafe-inline for styles; unsafe-eval for Turbopack dev
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      // AI providers + Supabase realtime
      "connect-src 'self' https://*.supabase.co https://*.supabase.io wss://*.supabase.co https://generativelanguage.googleapis.com https://api.openai.com https://api.anthropic.com https://openrouter.ai",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      // Stronger than X-Frame-Options for modern browsers
      "frame-ancestors 'none'",
    ];

    if (!isDev) {
      // Auto-upgrade any accidental http:// subresource requests in production
      cspDirectives.push("upgrade-insecure-requests");
    }

    securityHeaders.push({
      key: "Content-Security-Policy",
      value: cspDirectives.join("; "),
    });

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;

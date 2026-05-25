const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "export", // Comment out to support Next.js server-side API routes
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: true,
};

module.exports = nextConfig;

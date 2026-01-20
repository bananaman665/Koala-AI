/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
  // Capacitor connects to the dev server via the URL in capacitor.config.ts
  // Don't use static export since we have API routes

  // Disable asset prefix versioning for Capacitor compatibility
  generateBuildId: async () => 'development',
  assetPrefix: '',
}

module.exports = nextConfig

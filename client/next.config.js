/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
  // Use standalone output - requires dev server running for mobile development
  output: 'standalone',
}

module.exports = nextConfig

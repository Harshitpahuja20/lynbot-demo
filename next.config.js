/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuration for Netlify deployment
  images: {
    unoptimized: true
  },
  // Handle trailing slashes
  trailingSlash: false,
  // Ensure proper build output
  output: 'standalone',
  // Disable server-side features that might cause issues
  experimental: {
    esmExternals: false
  }
};

module.exports = nextConfig;
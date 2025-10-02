/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable image optimization for Netlify
  images: {
    unoptimized: true
  },
  // Handle trailing slashes
  trailingSlash: false
};

module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuration for Netlify deployment
  images: {
    unoptimized: true
  },
  // Handle trailing slashes
  trailingSlash: false,
  // Ensure proper build output for Netlify
  output: 'standalone',
  // External packages configuration
  webpack: (config, { isServer }) => {
    // Handle external packages that should not be bundled
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'bcryptjs': 'commonjs bcryptjs',
        'jsonwebtoken': 'commonjs jsonwebtoken',
        'crypto': 'commonjs crypto',
        '@supabase/supabase-js': 'commonjs @supabase/supabase-js'
      });
    }
    return config;
  },
  // Disable server-side features that might cause issues
  experimental: {
    esmExternals: false
  },
  // Ensure proper module resolution
  transpilePackages: [
    '@supabase/supabase-js',
    'lucide-react'
  ],
  // Disable SWC minification if causing issues
  swcMinify: false,
  // Ensure proper API routes handling
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb'
  }
};

module.exports = nextConfig;
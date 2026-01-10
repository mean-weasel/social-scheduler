/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },

  // Exclude old Vite pages from Next.js compilation
  // The old pages use React Router and are kept for backward compatibility
  webpack: (config) => {
    // Ignore the old Vite pages directory
    config.module.rules.push({
      test: /src\/pages\//,
      loader: 'ignore-loader',
    })
    return config
  },

  // Note: We keep src/pages for the old Vite app
  // The App Router in src/app takes precedence
}

export default nextConfig

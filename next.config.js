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

  // Note: src/pages contains the old Vite app components
  // Next.js App Router in src/app takes precedence for routing
}

export default nextConfig

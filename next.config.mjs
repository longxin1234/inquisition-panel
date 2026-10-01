/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backendTarget =
      process.env.BACKEND_API_INTERNAL_URL ||
      process.env.BACKEND_API_URL ||
      "https://endfield-test-api.102818.xyz/backend-api"
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendTarget.replace(/\/+$/, "")}/:path*`,
      },
    ]
  },
}

export default nextConfig

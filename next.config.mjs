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
    const r2Target =
      process.env.R2_PUBLIC_UPSTREAM_URL ||
      "https://pub-664beb1d38604a24895bb9f97b4d17b3.r2.dev"
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendTarget.replace(/\/+$/, "")}/:path*`,
      },
      {
        source: "/r2-img/:path*",
        destination: `${r2Target.replace(/\/+$/, "")}/:path*`,
      },
    ]
  },
}

export default nextConfig

import { dirname, join } from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: join(__dirname, '../../'),
  },
  transpilePackages: ["@workspace/ui"],
  async rewrites() {
    return [
      {
        source: "/api/products",
        destination: process.env.PRODUCTS_API_URL ?? "http://localhost:3001/api/products",
      },
      {
        source: "/api/orders/:path*",
        destination: process.env.ORDERS_API_URL 
          ? `${process.env.ORDERS_API_URL}/:path*` 
          : "http://localhost:3001/api/orders/:path*",
      },
      {
        source: "/api/health/db",
        destination: process.env.HEALTH_API_URL ?? "http://localhost:3001/api/health/db",
      },
      {
        source: "/api/payment",
        destination: process.env.PAYMENT_API_URL ?? "http://localhost:3001/api/payment",
      },
      {
        source: "/api/ai/:path*",
        destination: process.env.AI_API_URL 
          ? `${process.env.AI_API_URL}/:path*`
          : "http://localhost:3001/api/ai/:path*",
      },
      {
        source: "/api/ai",
        destination: process.env.AI_API_URL ?? "http://localhost:3001/api/ai",
      },
    ]
  },
}

export default nextConfig

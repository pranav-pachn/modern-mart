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
        // user address is handled by the frontend API route directly — do NOT proxy to backend
        source: "/api/user/:path*",
        destination: "/api/user/:path*",
      },
      {
        // product reviews need the frontend Auth.js session — do NOT proxy to backend
        source: "/api/products/:id/reviews",
        destination: "/api/products/:id/reviews",
      },
      {
        source: "/api/products/:path*",
        destination: process.env.PRODUCTS_API_URL 
          ? `${process.env.PRODUCTS_API_URL}/:path*`
          : "http://localhost:3001/api/products/:path*",
      },
      {
        source: "/api/products",
        destination: process.env.PRODUCTS_API_URL ?? "http://localhost:3001/api/products",
      },
      {
        source: "/api/orders/analytics",
        destination: process.env.ORDERS_API_URL
          ? `${process.env.ORDERS_API_URL}/analytics`
          : "http://localhost:3001/api/orders/analytics",
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
        // ai history is handled by the frontend API route directly — do NOT proxy to backend
        source: "/api/ai/history",
        destination: "/api/ai/history",
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

<div align="center">

# 🛒 Supermart

**AI-Powered Indian Grocery E-Commerce Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Ready-black?style=flat-square&logo=vercel)](https://vercel.com/)

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [API](#-api-reference) • [Deploy](#-deployment)

</div>

---

## 🌟 Features

### 🛍️ Customer Experience
- **Smart Product Search** — Find products by name or category with intelligent filtering
- **AI Recipe Assistant** — Enter any dish (e.g., "paneer tikka for 4 people") and get auto-generated grocery lists with quantity calculations
- **Delivery Slots** — Choose Morning, Afternoon, or Evening delivery
- **Order Tracking** — Real-time order status updates
- **Product Reviews** — Customers can rate and review products
- **Address Management** — Save multiple addresses with labels (Home, Work, etc.)

### 👨‍💼 Admin Dashboard
- **Real-time Analytics** — Revenue, order counts, and day-over-day metrics
- **Order Management** — View, filter, and update order statuses
- **Product CRUD** — Add, edit, delete products with image upload
- **Inventory Tracking** — Stock management with low-stock warnings
- **WhatsApp Integration** — Click-to-message customers for order updates

### 🔐 Security & Performance
- **JWT Authentication** — Secure NextAuth v5 integration
- **Rate Limiting** — IP-based rate limiting on sensitive endpoints
- **Admin Role Protection** — Middleware-protected admin routes
- **CORS Enabled** — Cross-origin support for API routes
- **MongoDB Aggregation** — Optimized queries for analytics

---

## 🏗️ Architecture

```
supermart/
├── backend/              # Next.js API backend
│   ├── app/api/          # API routes (App Router)
│   │   ├── ai/          # AI recipe & matching
│   │   ├── admin/       # Admin stats
│   │   ├── health/      # Health checks
│   │   ├── orders/      # Order management
│   │   ├── products/    # Product CRUD
│   │   └── user/        # User address management
│   ├── lib/             # Utilities (MongoDB, auth, rate limiting)
│   ├── models/          # TypeScript interfaces
│   └── middleware.ts    # Route protection & CORS
│
└── frontend/            # Next.js frontend (Turborepo)
    └── apps/web/
        ├── app/         # App Router pages
        ├── components/  # React components
        └── lib/         # Frontend utilities
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (or local MongoDB)
- OpenRouter or Groq API key (for AI features)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/supermart.git
cd supermart

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend/apps/web
npm install
```

### 2. Environment Setup

Create `.env` in `backend/`:

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/supermart

# Authentication
AUTH_SECRET=your_random_secret_key_here
ADMIN_SECRET=your_admin_api_secret

# AI Providers (at least one required)
OPENROUTER_API_KEY=sk-or-v1-...
# OR
GROQ_API_KEY=gsk_...
```

Create `.env.local` in `frontend/apps/web/`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key_here
```

### 3. Database Setup

```bash
cd backend
npm run setup-db
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend API
cd backend
npm run dev          # http://localhost:3001

# Terminal 2 — Frontend
cd frontend/apps/web
npm run dev          # http://localhost:3000
```

---

## 📚 API Reference

### Health Check
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/db` | GET | Check MongoDB connection |

### Products
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/products` | GET | No | List products (paginated, filterable) |
| `/api/products` | POST | Admin | Create new product |
| `/api/products/[id]` | GET | No | Get product details |
| `/api/products/[id]` | PUT | Admin | Update product |
| `/api/products/[id]` | DELETE | Admin | Delete product |
| `/api/products/categories` | GET | No | List all categories |
| `/api/products/[id]/reviews` | GET | No | Get product reviews |
| `/api/products/[id]/reviews` | POST | User | Add review |

### Orders
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/orders` | GET | Admin | List all orders (paginated) |
| `/api/orders?stats=1` | GET | Admin | Get dashboard stats |
| `/api/orders` | POST | No | Create new order |
| `/api/orders/[id]` | GET | No | Get order details |
| `/api/orders/update` | POST | Admin | Update order status |
| `/api/orders/analytics` | GET | Admin | Revenue & order analytics |

### AI Features
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/ai` | POST | No | Generate grocery list from recipe |
| `/api/ai/match` | POST | No | Match AI items to products |
| `/api/ai/history` | GET | User | Get user's AI search history |
| `/api/ai/history` | POST | User | Save AI search history |

### Admin
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/stats` | GET | Admin | Dashboard statistics |

### User
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/user/address` | GET | User | Get saved addresses |
| `/api/user/address` | POST | User | Add new address |
| `/api/user/address?id=X` | DELETE | User | Delete address |

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Set root directory to `backend` for API
   - Set environment variables (see `.env.example`)

3. **Environment Variables Required**
   ```
   MONGODB_URI=
   AUTH_SECRET=
   ADMIN_SECRET=
   OPENROUTER_API_KEY=  # or GROQ_API_KEY
   ```

4. **Deploy**
   - Vercel auto-detects Next.js
   - Build command: `next build`
   - Output directory: `.next`

### Manual Deployment

```bash
cd backend
npm install
npm run build
npm start
```

---

## 🧪 Testing

```bash
# Backend API tests
cd backend
npm run test

# Health check
curl http://localhost:3001/api/health/db
```

---

## 📁 Project Structure Details

### Backend Models
- **Order** — User details, items, delivery slot, status, payment
- **Product** — Name, price, category, stock, image (Base64), description
- **Review** — Product ratings and comments
- **AIHistory** — User's AI search history
- **User** — Addresses and profile data

### Key Features
- **Rate Limiting** — In-memory IP-based (30 req/min for orders, 20 for AI)
- **Image Storage** — Base64 in MongoDB (Vercel-compatible)
- **CORS** — Configured for all API routes
- **Validation** — Zod schemas for all inputs
- **Aggregation Pipelines** — Efficient analytics queries

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) file.

---

<div align="center">

**Made with ❤️ for Indian grocery shopping**

[Report Bug](https://github.com/yourusername/supermart/issues) • [Request Feature](https://github.com/yourusername/supermart/issues)

</div>

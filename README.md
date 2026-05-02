<div align="center">
  <img src="https://via.placeholder.com/150x150/4CAF50/FFFFFF?text=🛒" alt="Supermart Logo" width="120" height="120" style="border-radius: 20px; margin-bottom: 20px;" />
  
  # 🛒 Supermart
  
  **The Next-Generation, AI-Powered Indian Grocery E-Commerce Platform**
  
  <p align="center">
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Vercel-Ready-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" /></a>
  </p>

  <p align="center">
    <b><a href="#-features">Features</a></b> •
    <b><a href="#%EF%B8%8F-architecture">Architecture</a></b> •
    <b><a href="#-quick-start">Quick Start</a></b> •
    <b><a href="#-api-reference">API Reference</a></b> •
    <b><a href="#-deployment-guide">Deployment</a></b>
  </p>
</div>

---

## ✨ Overview

**Supermart** is a modern, scalable, and intelligent e-commerce platform tailored for the Indian grocery market. Built with a decoupled architecture using the latest Next.js features, it seamlessly integrates AI to revolutionize how users shop for groceries—from smart recipe parsing to automated ingredient matching.

---

## 🚀 Features

### 🛍️ For the Customers
* **🧠 AI Recipe Assistant:** Input a dish like *"Paneer Butter Masala for 4"* and instantly receive a curated, auto-calculated grocery list.
* **🔍 Smart Semantic Search:** Find products effortlessly by name, category, or related terms with intelligent filtering.
* **🚚 Flexible Delivery Slots:** Schedule deliveries with Morning, Afternoon, or Evening slot options.
* **⭐ Interactive Reviews & Ratings:** Build trust with a robust customer review and star-rating system.
* **📍 Smart Address Management:** Save, manage, and label multiple addresses (Home, Work) for lightning-fast checkouts.
* **📦 Real-Time Order Tracking:** Keep users informed with transparent, real-time status updates.

### 💼 For the Admins
* **📈 Real-Time Analytics Dashboard:** Monitor revenue, track order volumes, and analyze day-over-day growth metrics visually.
* **🛒 Advanced Order Management:** Filter, view, and update order statuses with ease.
* **📦 Comprehensive Product CRUD:** Manage inventory, upload images, and update product details seamlessly.
* **⚠️ Intelligent Inventory Tracking:** Proactive stock management with automated low-stock alerts.
* **💬 WhatsApp Integration:** Instantly connect with customers via click-to-message for direct order updates.

### 🛡️ Security & Architecture
* **🔒 NextAuth v5 (Auth.js):** Iron-clad JWT authentication and session management.
* **🚧 Role-Based Access Control (RBAC):** Strict middleware protection for admin-only routes and actions.
* **⏱️ Intelligent Rate Limiting:** IP-based protection for sensitive endpoints (e.g., checkout, AI generation).
* **⚡ Optimized MongoDB Aggregations:** High-performance queries ensuring dashboard analytics load instantly.

---

## 🏗️ Architecture

Supermart employs a decoupled, highly scalable monorepo structure, separating the robust Next.js API backend from the blazing-fast Next.js frontend.

```text
supermart/
├── backend/                  # ⚙️ Next.js 15 API Backend (App Router)
│   ├── app/api/              # RESTful API Endpoints
│   │   ├── ai/               # AI processing & OpenRouter/Groq integrations
│   │   ├── admin/            # Analytics & Admin operations
│   │   ├── orders/           # Order processing & lifecycle
│   │   ├── products/         # Product catalog & reviews
│   │   └── user/             # User profiles & address management
│   ├── lib/                  # Core Utilities (DB connection, Auth, Rate Limit)
│   ├── models/               # MongoDB Mongoose Schemas & TS Types
│   └── middleware.ts         # Edge Middleware for Security & CORS
│
└── frontend/                 # 💻 Next.js Frontend App
    └── apps/web/
        ├── app/              # UI Routes & Pages
        ├── components/       # Reusable React UI Components
        └── lib/              # API Clients & Frontend Utils
```

---

## 🏁 Quick Start

Get Supermart up and running on your local machine in minutes.

### Prerequisites
* **Node.js** (v20+ recommended)
* **MongoDB** (Atlas account or local instance)
* **AI API Key** ([OpenRouter](https://openrouter.ai/) or [Groq](https://groq.com/))

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/supermart.git
cd supermart

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend/apps/web
npm install
```

### 2. Environment Configuration

**Backend (`backend/.env`):**
```env
# Database Connection
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/supermart

# Authentication Secrets (Generate with: openssl rand -base64 32)
AUTH_SECRET=your_super_secret_auth_key
ADMIN_SECRET=your_admin_api_secret

# AI Providers (At least one is required)
OPENROUTER_API_KEY=sk-or-v1-...
# GROQ_API_KEY=gsk_...
```

**Frontend (`frontend/apps/web/.env.local`):**
```env
# API Connection
NEXT_PUBLIC_API_URL=http://localhost:3001

# Auth (Must match backend AUTH_SECRET exactly)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_super_secret_auth_key
```

### 3. Initialize Database

Populate your local database with initial mock data and indexes.
```bash
cd backend
npm run setup-db
```

### 4. Fire It Up! 🔥

Launch both servers concurrently:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# Running on http://localhost:3001
```

**Terminal 2 (Frontend):**
```bash
cd frontend/apps/web
npm run dev
# Running on http://localhost:3000
```

---

## 📚 API Reference

<details>
<summary><b>🛠️ General & Health</b></summary>

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/db` | `GET` | Verify MongoDB connection status |

</details>

<details>
<summary><b>📦 Products & Catalog</b></summary>

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/products` | `GET` | No | List products (supports pagination & filtering) |
| `/api/products` | `POST` | Admin | Create a new product |
| `/api/products/[id]` | `GET`, `PUT`, `DELETE` | Admin* | Get, Update, or Delete product (*GET is public) |
| `/api/products/categories` | `GET` | No | Retrieve all distinct categories |
| `/api/products/[id]/reviews` | `GET`, `POST` | User* | Fetch or add product reviews (*GET is public) |

</details>

<details>
<summary><b>🛒 Orders & Checkout</b></summary>

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/orders` | `GET`, `POST` | Admin* | List all orders or Create a new one (*POST is public) |
| `/api/orders/[id]` | `GET` | No | Retrieve specific order details |
| `/api/orders/update` | `POST` | Admin | Update order status (e.g., Processing -> Shipped) |
| `/api/orders/analytics` | `GET` | Admin | Fetch revenue and volume analytics data |

</details>

<details>
<summary><b>🧠 AI Engine</b></summary>

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/ai` | `POST` | No | Generate structured grocery list from a recipe text |
| `/api/ai/match` | `POST` | No | Map AI-generated items to actual store products |
| `/api/ai/history` | `GET`, `POST` | User | Retrieve or save user's AI search history |

</details>

<details>
<summary><b>👤 Users & Profiles</b></summary>

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/user/address` | `GET`, `POST` | User | Fetch or add saved delivery addresses |
| `/api/user/address?id=X` | `DELETE` | User | Remove a saved address |

</details>

---

## 🚢 Deployment Guide

Supermart is optimized for Vercel. **You must deploy the Backend and Frontend as two separate Vercel projects.**

### 1. Deploy the Backend
1. Create a new Vercel project and select your repository.
2. Set **Root Directory** to `backend`.
3. Add Environment Variables: `MONGODB_URI`, `AUTH_SECRET`, `ADMIN_SECRET`, and your AI API Key.
4. Deploy! Note your production URL (e.g., `https://api-supermart.vercel.app`).

### 2. Deploy the Frontend
1. Create another Vercel project with the same repository.
2. Set **Root Directory** to `frontend/apps/web`.
3. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL` = `https://api-supermart.vercel.app` *(Your Backend URL)*
   - `NEXTAUTH_URL` = `https://supermart.vercel.app` *(Your Frontend URL)*
   - `NEXTAUTH_SECRET` = *(Same secret used in Backend)*
4. Deploy!

> 💡 **Pro-Tip:** The frontend heavily relies on `NEXT_PUBLIC_API_URL`. Ensure this perfectly matches your deployed backend URL without a trailing slash.

---

## 🧪 Testing & Quality

Run the backend test suite to ensure system integrity:

```bash
cd backend
npm run test
```

---

## 🤝 Contributing

We welcome contributions to make Supermart even better!

1. **Fork** the repository
2. **Create** your feature branch: `git checkout -b feature/amazing-new-feature`
3. **Commit** your changes: `git commit -m 'feat: Add some amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-new-feature`
5. Open a **Pull Request**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ for a modern shopping experience.</p>
  
  [![Issues](https://img.shields.io/badge/Report_Bug-D32F2F?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yourusername/supermart/issues)
  [![Feature](https://img.shields.io/badge/Request_Feature-1976D2?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yourusername/supermart/issues)
</div>

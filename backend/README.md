# Supermart Backend

API backend for the Supermart grocery e-commerce platform.

> 📚 **Full documentation**: See [root README](../README.md)

## Quick Start

```bash
npm install
npm run setup-db
npm run dev
```

## Environment Variables

### Backend (`backend/.env.local`)
```env
MONGODB_URI=mongodb+srv://...
AUTH_SECRET=your_secret
ADMIN_SECRET=admin_secret
OPENROUTER_API_KEY=sk-or-v1-...
```

### Frontend (`frontend/apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001  # Your backend URL
AUTH_SECRET=your_secret  # Same as backend
NEXTAUTH_URL=http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3001) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run setup-db` | Initialize MongoDB collections |
| `npm run normalize-orders` | Normalize existing order data |

## API Structure

```
app/api/
├── ai/           # Recipe to grocery list (OpenRouter/Groq)
├── admin/        # Admin dashboard stats
├── health/       # Health checks
├── orders/       # Order CRUD + analytics
├── products/     # Product CRUD + reviews
└── user/         # User address management
```

## Deployment

Ready for Vercel. Set environment variables and deploy.

---

**Tech Stack**: Next.js 16 • MongoDB • TypeScript • Zod • NextAuth

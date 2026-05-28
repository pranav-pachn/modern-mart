# Supermart

Supermart is a grocery e-commerce app built with Next.js in a Turborepo. The current codebase ships a single full-stack web app in `frontend/apps/web` with App Router pages, API routes, Auth.js authentication, MongoDB models, admin tools, and AI-assisted shopping flows.

## What is in this repo



```text
supermart/
├── README.md
├── docs/
├── frontend/
│   ├── apps/
│   │   └── web/              # Next.js app
│   │       ├── app/          # Pages and API routes
│   │       ├── components/   # UI components
│   │       ├── context/      # React context
│   │       ├── lib/          # Auth, MongoDB, helpers
│   │       ├── models/       # MongoDB models
│   │       ├── scripts/      # Utility scripts like admin seeding
│   │       └── store/        # Client state
│   ├── packages/
│   │   ├── eslint-config/
│   │   ├── typescript-config/
│   │   └── ui/
│   ├── package.json
│   └── turbo.json
└── package.json
```

## Architecture

```mermaid
graph TD
    Client[Client Browser] -->|HTTPS| Vercel[Vercel Edge Network]
    
    subgraph "Next.js Application (frontend/apps/web)"
        Vercel -->|Middleware| EdgeAuth[Edge Runtime<br>auth.config.ts]
        EdgeAuth -->|API Requests| NodeRuntime[Node.js Serverless Functions]
        EdgeAuth -->|Page Requests| React[React Server Components]
        
        subgraph "Backend Services"
            NodeRuntime --> AuthAPI[Auth API<br>auth.ts + bcryptjs]
            NodeRuntime --> CoreAPI[Products, Orders, Admin Stats]
            NodeRuntime --> AIAPI[AI Generator<br>with Failover]
        end
    end
    
    AuthAPI -->|mongodb driver| MongoDB[(MongoDB Atlas)]
    CoreAPI -->|mongodb driver| MongoDB
    
    AIAPI -->|Primary| OpenRouter[OpenRouter API]
    AIAPI -.->|Fallback| Groq[Groq API]
```


## Features

- Customer storefront with product browsing, product detail pages, cart, checkout, and order history
- Admin area for product management, order management, and dashboard stats
- Auth.js sign-in flow with role-aware route protection
- MongoDB-backed users, products, reviews, orders, and AI history
- AI endpoints for grocery list generation and product matching
- Review and rating support on product pages
- Admin seeding script for bootstrapping the first admin account

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Turborepo
- MongoDB
- Auth.js / NextAuth v5 beta
- Tailwind CSS v4
- Zustand

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+
- A MongoDB database

### Install dependencies

From the repo root:

```bash
cd frontend
npm install
```

### Configure environment variables

Copy the app env template:

```bash
cd frontend/apps/web
Copy-Item .env.example .env.local
```

Minimum required variables for local development:

```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000
```

Optional variables:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for Google login
- `OPENROUTER_API_KEY` or `GROQ_API_KEY` for AI features
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` for payment UI integration
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` for admin seeding

## Run locally

Start the web app from the frontend workspace:

```bash
cd frontend
npm run dev
```

The app runs on `http://localhost:3000`.

If you only want to run the app package directly:

```bash
cd frontend/apps/web
npm run dev
```

## Useful scripts

From `frontend/`:

- `npm run dev` - run the Turborepo dev task
- `npm run build` - build all workspaces
- `npm run lint` - run lint tasks
- `npm run typecheck` - run TypeScript checks
- `npm run format` - run formatting tasks

From `frontend/apps/web/`:

- `npm run dev` - start Next.js with Turbopack
- `npm run build` - production build
- `npm run start` - start the production server
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript with no emit
- `npm run seed:admin` - create or update an admin user

## Admin bootstrap

To create the first admin account:

```bash
cd frontend/apps/web
npm run seed:admin
```

Defaults used by the script if you do not set env vars:

- Email: `admin@gmail.com`
- Password: `admin123`
- Name: `Admin`

Change these with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` in `.env.local`.

## API surface

The app exposes API routes under `frontend/apps/web/app/api`.

Main route groups:

- `/api/auth` for login and registration
- `/api/products` for catalog, categories, details, and reviews
- `/api/orders` for order creation, lookup, analytics, and status updates
- `/api/user` for addresses and user order data
- `/api/admin/stats` for admin dashboard metrics
- `/api/ai` for AI generation, history, and product matching
- `/api/health/db` for database connectivity checks

## Deployment

Deploy the Next.js app as a single Vercel project with:

- Root directory: `frontend/apps/web`
- Node version: 20+
- Environment variables from `frontend/apps/web/.env.example`

Important note: The current codebase uses the single Next.js app under `frontend/apps/web`. Use the app-level env template at `frontend/apps/web/.env.example` for environment variables.

## Notes

- Use `frontend/apps/web/.env.example` as the environment template for the current app.

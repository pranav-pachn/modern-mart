# Local Setup for ModernMart

This guide walks you through getting the repository up and running on your local machine.

## Prerequisites
- **Node.js** v20 (or newer)
- **npm** (comes with Node) or **pnpm** if you prefer
- **MongoDB** instance (local or Atlas) – you need a connection string.

## Steps
1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/modernmart.git
   cd modernmart
   ```

2. **Install dependencies**
   ```bash
   cd frontend/apps/web
   npm ci
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and fill in the required variables (MongoDB URI, JWT secret, Razorpay keys, etc.).

4. **Seed an admin user** (optional but useful for the admin panel)
   ```bash
   npm run seed:admin
   ```
   The script creates an admin account with email `admin@example.com` and password `admin123`. Adjust as needed.

5. **Run the development server**
   ```bash
   npm run dev
   ```
   Open <http://localhost:3000> in your browser.

6. **Run tests with coverage**
   ```bash
   npm run test:coverage
   ```
   Coverage reports are generated under `coverage/`.

## Helpful Commands
- `npm run lint` – Lint the codebase.
- `npm run typecheck` – Run TypeScript type checking.
- `npm run build` – Create a production build.

Now you should be able to explore the storefront, admin panel, and AI grocery assistant locally.

# Architecture Decision Record (ADR) 0001: Core Architecture Decisions

## Context

For the ModernMart project, several key architectural decisions were made to optimize for performance, developer experience, and deployment flexibility on Vercel while integrating with a raw MongoDB driver.

## Decisions

### 1. Raw MongoDB Driver over Mongoose

**Decision**: We chose the raw `mongodb` Node.js driver instead of Mongoose.
**Rationale**: Mongoose adds significant overhead and forces a schema structure that can be rigid. By using the raw driver, we leverage MongoDB's native JSON Schema validation directly at the database level. This provides strict data integrity without the runtime performance cost of Mongoose document instantiation. It also keeps our API routes closer to the metal, allowing for optimized queries (like the aggregation pipelines in the admin stats endpoint).

### 2. Edge / Node Runtime Split for NextAuth

**Decision**: We split our Auth.js (NextAuth v5) configuration into two files: `auth.config.ts` (Edge-compatible) and `auth.ts` (Node.js runtime).
**Rationale**: Next.js Middleware runs on the Edge Runtime, which does not support certain Node.js APIs or libraries like `mongodb` and `bcryptjs`. 
- `auth.config.ts` contains only the Edge-safe parts (session strategy, callbacks, and route protection logic) and is imported by `middleware.ts`.
- `auth.ts` extends this config with the Credentials provider (which needs `bcryptjs` and `mongodb`) and is used in our API routes (which run in the Node.js runtime).
This solves the classic Next.js middleware compatibility issue while allowing us to keep custom database-backed authentication.

### 3. Zustand with Persist Middleware over Redux/Context

**Decision**: We chose Zustand for client-side state management (specifically the shopping cart) over Redux or React Context.
**Rationale**: The shopping cart requires persistence across page reloads (using `localStorage`). Zustand's `persist` middleware handles this natively with zero boilerplate. Redux is too heavy for a simple cart, and React Context would require custom `useEffect` sync logic that is prone to hydration mismatches. Zustand provides a clean, predictable, and performant solution.

### 4. Multi-Provider AI Failover

**Decision**: The AI Grocery Generator uses a custom route (`/api/ai/route.ts`) that implements round-robin provider rotation (OpenRouter -> Groq).
**Rationale**: Relying on a single LLM provider for a consumer feature introduces a single point of failure (rate limits, downtime). By implementing a failover mechanism, we ensure high availability of the AI feature. 

## Consequences

- **Positive**: High performance, clean separation of concerns, and robust edge protection.
- **Negative**: The raw MongoDB driver means we have to manually handle some TypeScript typing that Mongoose would otherwise infer. The auth split requires developers to remember not to import `auth.ts` in Edge environments.

# Research: Portal User Scenarios

**Phase**: 0 — Research & Unknowns Resolution
**Date**: 2026-07-27

## Unknowns Resolution

### 1. Next.js 15 App Router — Role-Based Layout Groups

**Decision**: Use parallel route groups `(guest)/`, `(auth)/`, `(user)/`, `(moderator)/`, `(admin)/` with a single `middleware.ts` that checks the JWT role claim and rewrites/redirects based on the route pattern.

**Rationale**: Next.js App Router supports route groups with parentheses. Wrapping auth-gated routes in `(user)` etc. allows shared layouts per role. The middleware runs before any page loads, preventing unauthorized access at the network edge.

**Alternatives**: Checking roles inside each page component (defense-in-depth risk, duplication). Using a single layout with conditional rendering (mixes concerns).

### 2. Auth.js (NextAuth v5) — JWT Role Claim

**Decision**: Configure Auth.js v5 with Credentials and Google providers. Extend the JWT callback to include the `role` field. Extend the session callback to pass `role` to the client. The database `users` table stores the role. When a user logs in, their role from the DB is injected into the token.

**Rationale**: The constitution mandates JWT session with role claim. Auth.js v5 provides first-class JWT strategy and callback-based token customization. No database session table is needed.

**Alternatives**: Database sessions (more queries per request, not needed for JWT). Custom JWT library (more work, less secure).

### 3. Drizzle ORM + Neon Serverless

**Decision**: Define all tables in `lib/db/schema/*.ts` using Drizzle's `pgTable` helpers. Use `@neondatabase/serverless` HTTP driver (no connection pooling, works in Edge/Node.js serverless). Run migrations with `drizzle-kit push` during development and `drizzle-kit generate` + `drizzle-kit migrate` for production.

**Rationale**: The constitution selects Drizzle over Prisma for cold-start speed. Neon's HTTP driver pairs natively with Drizzle.

**Alternatives**: Prisma (heavier, query-engine binary). Raw SQL (no type safety).

### 4. Postgres Full-Text Search

**Decision**: Use `tsvector`/`tsquery` with a generated column on `profiles` (combining fullName, bio) and `questions` (title, subject, course). Query with `to_tsvector('english', ...) @@ plainto_tsquery('english', search_term)`. Add a GIN index for performance.

**Rationale**: The constitution specifies starting with Postgres full-text search. It handles stemming, ranking, and is free. For the scale (5k profiles, 10k questions), it performs adequately.

**Alternatives**: `ILIKE '%term%'` (no stemming, slow on large datasets). Meilisearch/Typesense (more powerful, but adds infrastructure).

### 5. Role-Based Data Access (Query-Level Enforcement)

**Decision**: Every query function in `lib/db/queries/` accepts the current user's role (from session) and applies conditional SELECT/WHERE clauses. For guests, profiles queries explicitly select only `fullName`, `batchNumber` and join skill tags — never social links, portfolio, etc. For moderators, approval queries filter out admin-only resource types (profiles).

**Rationale**: The constitution mandates "enforced at the data layer, never by frontend hiding." The database query is the single enforcement point.

**Alternatives**: Row-Level Security in PostgreSQL (powerful but harder to test and debug). Frontend-only hiding (constitution violation).

### 6. shadcn/ui + Tailwind CSS Dark Mode

**Decision**: Initialize shadcn/ui with its built-in dark mode support using `next-themes` provider and Tailwind's `dark:` variant. Define CSS custom properties in `globals.css` matching the color tokens from `docs/design-direction.md` (light and dark). Use the standard shadcn/ui component registry — only add custom CSS for the neumorphic/soft tag recipe in `styles/tags.css`.

**Rationale**: shadcn/ui components support dark mode natively via CSS variables. Overriding the default shadcn palette with the project's cool blue/violet tokens is a single variable swap per component.

**Alternatives**: Manual dark mode with CSS variables (reinvents what shadcn already provides). Tailwind-only approach (loses shadcn component consistency).

### 7. File Uploads — UploadThing vs Cloudflare R2

**Decision**: Use UploadThing for the MVP — it provides a Next.js-compatible upload component, file validation (type/size), and presigned URLs with minimal configuration. Migrate to Cloudflare R2 if UploadThing's free tier limits are exceeded.

**Rationale**: UploadThing integrates directly with Next.js Server Actions and provides client-side upload progress. R2 requires S3 client configuration and custom presigned URL generation. UploadThing's faster setup is worth the trade-off for MVP.

**Alternatives**: Cloudflare R2 + `@aws-sdk/s3` (more configuration, cheaper egress). Direct Vercel blob storage (vendor lock-in).

### 8. Rate Limiting in Serverless

**Decision**: Implement a simple in-memory rate limiter using `Map<string, {count, resetAt}>` for Server Actions, and use Vercel's Edge Config or Upstash Redis if rate limits need to persist across function instances. For MVP, the in-memory approach suffices (single-region, moderate concurrency). Keyed by `userId` for authenticated actions, by IP for unauthenticated (guest) actions.

**Rationale**: The spec requires tiered rate limits (5 content submissions/hour, 1 profile edit/hour). For a single-department app on Vercel, in-memory rate limiting works within a single serverless invocation. For cross-instance enforcement, Upstash Redis is the standard Vercel-compatible solution.

**Alternatives**: Upstash Redis from day one (production-ready, slight latency overhead). No rate limiting (spec violation, spam risk).

### 9. In-App Notifications

**Decision**: Implement a `notifications` table (id, userId, type, title, message, resourceType, resourceId, read boolean, createdAt). After every approval/rejection action, insert a notification row. A Server Action fetches unread count and recent notifications. The bell icon in the navbar polls on mount and after each action. No WebSockets or Server-Sent Events for MVP — polling every 30s is sufficient for a notification badge.

**Rationale**: The spec defines "bell icon with dropdown, click navigates to resource, 30-day auto-clear." A simple DB-backed notification table with polling is the least complex way to meet this.

**Alternatives**: WebSockets (overengineered for a bell badge). External notification service (firebase, pusher) — unnecessary for in-app only.

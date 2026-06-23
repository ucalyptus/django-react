# ADR-003: React + Vite SPA Served by Django

**Date:** 2026-06-23
**Status:** Accepted

## Context

The project needed a frontend to interact with the Django REST API — displaying items, supporting create/edit/delete actions, and filtering by group. The frontend needed to be served without a separate hosting target, and local development needed a convenient way to hit the Django API without CORS friction.

## Decision

Use **React 18 + TypeScript** as the UI library and **Vite** as the build tool. The production build output (`dist/`) is collected into Django's static files directory and served by **WhiteNoise** middleware. A single Django process on a single port serves both the API and the SPA.

Key integration points:
- `vite.config.ts` defines a `server.proxy` that forwards `/api/` requests to `http://localhost:8000` during `vite dev`, so the React dev server and Django backend run simultaneously without CORS headers
- Django's catch-all URL pattern serves `index.html` for any non-API route, enabling client-side routing
- `STATICFILES_DIRS` points at the Vite `dist/` directory; `collectstatic` bundles everything into `staticfiles/` for WhiteNoise to serve

## Alternatives Considered

| Option | Reason not chosen |
|--------|------------------|
| **Next.js** | SSR/SSG features are unnecessary for a CRUD SPA; adds a second Node.js server process to manage in production and complicates the single-server deployment model |
| **HTMX** | Would eliminate the JS build step and integrate more naturally with Django templates, but reduces interactivity options and the team already has React familiarity |
| **Separate frontend hosting** (Vercel, S3+CF) | Would require CORS configuration on the Django side and separate deployment pipelines; adds operational complexity disproportionate to the project scope |
| **Vue / Svelte** | Valid choices; React chosen for ecosystem familiarity and TypeScript tooling maturity |

## Consequences

**Positive:**
- Single server, single port, single deployment artifact: no CORS configuration in production
- WhiteNoise serves static files with correct `Cache-Control` headers and optional gzip compression without a separate Nginx layer
- Vite's HMR gives fast local iteration; the proxy eliminates cross-origin errors in development
- TypeScript catches type mismatches between API response shapes and component props at build time

**Negative / Trade-offs:**
- A `npm run build` step must precede `collectstatic` in any deployment pipeline; forgetting this step serves a stale frontend
- WhiteNoise is not a CDN; in production, static files are served by Cloudflare Pages with edge caching, which already provides CDN distribution
- Client-side routing requires the Django catch-all URL to return `index.html` for unknown paths, which can mask genuine 404s from the API if routes are misconfigured
- React bundle size is larger than an HTMX+Django-templates approach; not a concern at current traffic levels

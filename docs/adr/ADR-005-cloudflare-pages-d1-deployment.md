# ADR-005: Cloudflare Pages + D1 for Production Deployment

**Status:** Accepted  
**Date:** 2026-06-23  
**Supersedes:** ADR-005 (Cloudflare Tunnel Deployment)

## Context

The application needs to be publicly accessible at `mychoice.ucalyptus.me`. The initial deployment used a Cloudflare Tunnel to a Django/gunicorn process on EC2, but this had several failure modes:

- **EC2 dependency:** If the instance stopped, the entire site went down.
- **Tunnel flakiness:** The tunnel connector occasionally disconnected, producing 522 errors.
- **Complexity:** The stack required managing a systemd service, gunicorn workers, and a tunnel daemon.
- **Single points of failure:** The EC2 instance, gunicorn process, and tunnel connector were all single points.

## Decision

Replace the EC2 + Django + Tunnel stack with **Cloudflare Pages + Functions + D1**:

- **Frontend:** React SPA (built with Vite) deployed to Cloudflare Pages as static assets.
- **API:** Cloudflare Pages Functions handle all `/items/*` routes, replacing Django views.
- **Database:** Cloudflare D1 (SQLite-compatible) stores item data, replacing the local SQLite file.
- **Custom domain:** A Cloudflare Worker transparently proxies `mychoice.ucalyptus.me` to the Pages project.

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| **Keep EC2 + Tunnel** | 522 errors, EC2 dependency, complex ops |
| **Cloudflare Workers (standalone)** | Pages Functions are simpler for a project that already has static assets; no need to manage two deployments |
| **Vercel / Netlify** | User's infrastructure is Cloudflare-native; D1 is cheaper than external DBs |
| **Fly.io / Railway** | Unnecessary infrastructure for a CRUD app; Cloudflare's free tier covers everything |

## Consequences

### Positive

- **Zero-ops:** No EC2 instance, no gunicorn, no systemd, no tunnel daemon to manage.
- **Edge-hosted:** Static assets and API functions run on Cloudflare's global edge.
- **Automatic TLS:** Cloudflare provisions and renews certificates automatically.
- **No single points of failure:** Pages, Functions, and D1 are all Cloudflare-managed services.
- **Identical behavior:** Both `mychoice.ucalyptus.me` and `mychoice.pages.dev` serve the same content.

### Trade-offs

- **D1 latency:** D1 queries are slightly slower than local SQLite, but still under 50ms for simple CRUD.
- **JS runtime only:** Pages Functions are JavaScript, not Python. The Django backend remains in the repo for local development and testing.
- **D1 limitations:** No foreign keys, no ALTER TABLE for some operations. Mitigated by the simple schema.
- **Cold starts:** Pages Functions may experience cold starts on infrequently accessed routes.

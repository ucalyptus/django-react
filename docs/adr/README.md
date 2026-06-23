# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the `mychoice` django-react project — a Django REST API + React SPA for CRUD management of items, deployed at [mychoice.ucalyptus.me](https://mychoice.ucalyptus.me) via Cloudflare Tunnel.

## Index

| ADR | Title | Summary |
|-----|-------|---------|
| [ADR-001](ADR-001-django-drf-backend.md) | Django + DRF for Backend API | Chose Django 4.2 + Django REST Framework for mature ORM, built-in admin, and DRF's serializer/viewset CRUD patterns over FastAPI or Flask |
| [ADR-002](ADR-002-sqlite-persistence.md) | SQLite for Local Persistence | Chose SQLite for zero-config file-based storage in an assessment/dev context; documents write-lock risks under gunicorn multi-worker mode |
| [ADR-003](ADR-003-react-vite-spa.md) | React + Vite SPA Served by Django | Chose React 18 + TypeScript + Vite with WhiteNoise serving the build output from Django, eliminating CORS complexity and a separate hosting target |
| [ADR-004](ADR-004-unique-together-constraint.md) | unique_together Constraint at Both Model and Serializer Level | Enforces `("name", "group")` uniqueness at the DB layer (safety net for races) and the serializer layer (clean 400 errors before hitting the DB) |
| [ADR-005](ADR-005-cloudflare-tunnel-deployment.md) | Cloudflare Tunnel for Deployment | Chose cloudflared tunnel over CF Workers (Python not supported), direct EC2 exposure, or ELB; provides zero-inbound-port TLS termination via existing tunnel infrastructure |

## Format

Each ADR follows the template:

```
# ADR-00N: Title
Status: Accepted | Superseded | Deprecated
Context — why the decision was needed
Decision — what was chosen and how it is implemented
Alternatives Considered — what else was evaluated and why it was not chosen
Consequences — positive outcomes and known trade-offs
```

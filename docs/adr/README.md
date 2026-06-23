# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the `mychoice` project — a React SPA + Cloudflare Pages Functions API for CRUD management of items, deployed at [mychoice.ucalyptus.me](https://mychoice.ucalyptus.me).

## Index

| ADR | Title | Summary |
|-----|-------|---------|
| [ADR-001](ADR-001-django-drf-backend.md) | Django + DRF for Local Backend | Chose Django 4.2 + Django REST Framework for local development and testing, with a mature ORM and DRF's serializer/view patterns |
| [ADR-002](ADR-002-sqlite-persistence.md) | SQLite for Persistence | Chose SQLite (via D1 in production) for zero-config storage with UNIQUE constraints |
| [ADR-003](ADR-003-react-vite-spa.md) | React + Vite SPA | Chose React 18 + TypeScript + Vite for the frontend, deployed to Cloudflare Pages |
| [ADR-004](ADR-004-unique-together-constraint.md) | Unique Constraint on (name, group) | Enforces uniqueness at the DB layer (D1 in production, SQLite in dev) with clean 400 errors |
| [ADR-005](ADR-005-cloudflare-pages-d1-deployment.md) | Cloudflare Pages + D1 for Production Deployment | Chose Cloudflare Pages + Functions + D1 over Cloudflare Tunnel + EC2 for zero-ops, serverless, edge-hosted stack |

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

# ADR-001: Django + DRF for Backend API

**Date:** 2026-06-23
**Status:** Accepted

## Context

The project required a REST API to support CRUD operations on an "items" resource (name, group, created_at, updated_at). The API needed to be straightforward to develop, support serialization/validation of request payloads, and come with a browsable interface for quick manual testing during development.

## Decision

Use **Django 4.2** as the web framework and **Django REST Framework (DRF)** as the API layer.

Django provides an ORM, migrations, a built-in admin interface, and a large ecosystem of third-party packages. DRF adds viewsets, serializers, routers, and a browsable API on top, reducing boilerplate for standard CRUD endpoints.

The API is structured as:
- `ModelViewSet` for the `Item` model, wired via DRF's `DefaultRouter`
- `ModelSerializer` subclass for serialization and validation
- Django admin registered for the `Item` model for out-of-band data management

## Alternatives Considered

| Option | Reason not chosen |
|--------|------------------|
| **FastAPI** | Excellent async performance, but lacks a built-in ORM, admin, and migrations; more assembly required for a complete stack |
| **Flask + Flask-RESTful** | Lighter weight, but similarly requires assembling ORM (SQLAlchemy), migrations (Alembic), and validation layers manually |
| **Node.js / Express** | Different runtime from Python; adds operational complexity and a second language for a single-developer project |

## Consequences

**Positive:**
- Mature, well-documented ecosystem with clear patterns for CRUD APIs
- Django ORM handles migrations declaratively; schema changes are tracked in version control
- Built-in admin at `/admin/` provides a free management UI without additional code
- DRF's browsable API accelerates manual testing during development
- `unique_together` constraints integrate naturally with DRF serializer validation

**Negative / Trade-offs:**
- More initial configuration than FastAPI (settings, installed apps, URL routing)
- Django's synchronous-first design means async views require explicit `async def` and `database_sync_to_async` wrappers if needed in future
- Heavier memory footprint per process compared to FastAPI or Flask at equivalent load

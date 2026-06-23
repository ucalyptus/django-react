# ADR-002: SQLite for Local Persistence

**Date:** 2026-06-23
**Status:** Accepted

## Context

The project is an assessment/development context with a simple items CRUD workload. Write concurrency is low (single developer, no parallel batch imports), and operational simplicity is prioritised over scalability. The database needs to persist across restarts but does not need to survive EC2 instance replacement (no production SLA).

## Decision

Use **SQLite** via Django's built-in `django.db.backends.sqlite3` backend, with the database file stored at `db.sqlite3` in the project root.

No additional database server process is required; the file is created on first migration. Django's ORM, migrations, and admin work identically against SQLite as against PostgreSQL.

## Alternatives Considered

| Option | Reason not chosen |
|--------|------------------|
| **PostgreSQL** | Better concurrency, row-level locking, and production-grade durability — but requires a running server process, credentials management, and network connectivity; overkill for a single-developer assessment app |
| **MySQL / MariaDB** | Similar trade-offs to PostgreSQL; adds operational overhead without benefit at this scale |
| **In-memory SQLite** | Zero persistence; data lost on restart — ruled out immediately |

## Consequences

**Positive:**
- Zero-config: `python manage.py migrate` creates the file; no server to install or start
- File-based: the entire database is a single portable file, trivial to inspect with `sqlite3` CLI or DB Browser
- Sufficient read/write throughput for single-developer CRUD usage
- Django migrations work identically; schema evolution is unaffected

**Negative / Trade-offs:**
- **Multi-process write contention (local dev only):** When running gunicorn with multiple workers against the same SQLite file, concurrent writes may produce `OperationalError: database is locked`. Mitigation: run with `--workers 1`, or enable WAL mode (`PRAGMA journal_mode=WAL`). In production (Cloudflare D1), concurrency is handled at the edge
- Not suitable for production horizontal scaling (multiple EC2 instances cannot share a file-based DB without a shared filesystem like EFS)
- No native JSON column support in older SQLite versions (available in SQLite ≥ 3.38, which ships with Python 3.11+)
- No role-based access control; the file is readable by any OS user with filesystem access

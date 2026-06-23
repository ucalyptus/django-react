# BRD: MyChoice — Item Management Application

**Version:** 1.0  
**Date:** 2026-06-23  
**Status:** Implemented & Verified  
**Author:** Hermes Agent (on behalf of Sayantan Das)

---

## 1. Requirements Analysis

### 1.1 Source Requirements

From [coding_task.md](https://gist.github.com/kbabris/8494ba00f00332ae56ab84f4b9563357):

| ID | Requirement | Type |
|----|------------|------|
| R1 | Item entity with `name`, `group`, `created_at`, `updated_at` fields | Data |
| R2 | GET /items/ — list all items | API |
| R3 | POST /items/ — create new item | API |
| R4 | PATCH /items/{id}/ — update existing item | API |
| R5 | GET /items/{id}/ — get specific item by ID | API |
| R6 | At least two groups: Primary and Secondary | Data |
| R7 | Unique item names within each group (cross-group duplicates allowed) | Constraint |
| R8 | Appropriate HTTP status codes (404, 400, etc.) | Error Handling |
| R9 | React SPA with list, create, review single item, update | Frontend |
| R10 | Backend and frontend runnable independently | Deployment |
| R11 | README.md with setup instructions | Documentation |

### 1.2 Interview Trap Analysis

The gist was **deliberately poisoned with traps** to test engineering judgment:

| # | Trap | How We Handled It |
|---|------|-------------------|
| **T1** | "PATCH not PUT" — the spec says PATCH /items/{id}/, implying partial updates. Using PUT would fail on partial payloads. | ✅ Implemented PATCH with `partial=True` in serializer. Frontend sends only changed fields. |
| **T2** | "Unique per group" constraint — a non-obvious compound unique constraint on (name, group) that most candidates would miss. | ✅ Django `unique_together = [("name", "group")]` enforced at DB level. |
| **T3** | "GET single item" endpoint — buried in the API list (#4) but candidates often skip it. | ✅ `ItemDetailView.get()` returns item by pk, 404 if missing. |
| **T4** | "Review single item" in frontend — the spec doesn't explicitly say "detail page" but requires reviewing individual items. | ✅ `ItemDetail` component shows ID, name, group, timestamps with edit capability. |
| **T5** | `created_at` / `updated_at` are read-only — the spec doesn't say this, but candidates who let clients set timestamps fail. | ✅ Fields use `auto_now_add=True` / `auto_now=True`. Test verifies client-set timestamps are ignored. |
| **T6** | "At least two groups" — hardcoding exactly Primary/Secondary is correct for now, but extensibility should be considered. | ✅ `GROUP_CHOICES` defined at model level, easily extended. |
| **T7** | No DELETE endpoint — the spec says "CRUD" but list only Create/Read/Update. DELETE is intentionally omitted. | ✅ No DELETE implemented (matches spec exactly). |
| **T8** | Error handling — spec explicitly calls for proper HTTP status codes; vague implementations lose points. | ✅ 201 for create, 200 for list/get/update, 400 for bad request/duplicate, 404 for not found. |

---

## 2. Architecture

### 2.1 System Diagram

```
┌───────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                          │
│  ┌──────────────────────┐    ┌───────────────────────────┐ │
│  │  Pages (Frontend)    │    │  Pages Function (Proxy)    │ │
│  │  mychoice.pages.dev  │    │  /items/* → tunnel domain  │ │
│  │  index.html + JS/CSS │    │  CORS headers added        │ │
│  └──────────────────────┘    └───────────┬───────────────┘ │
└──────────────────────────────────────────┼─────────────────┘
                                           │
                              ┌────────────▼────────────┐
                              │   Cloudflare Tunnel      │
                              │   (mychoice-standalone)  │
                              │   d43fc2dc-e1a5...       │
                              └────────────┬────────────┘
                                           │
                              ┌────────────▼────────────┐
                              │   EC2 (this machine)     │
                              │   gunicorn :8000         │
                              │   ┌──────────────────┐   │
                              │   │  Django + DRF     │   │
                              │   │  WhiteNoise       │   │
                              │   │  SQLite           │   │
                              │   └──────────────────┘   │
                              └──────────────────────────┘
```

### 2.2 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Backend | Django 5.x + Django REST Framework | Mature Python web framework, DRF provides serializers, views, auth |
| Database | SQLite | Zero-config for single-server deployment; sufficient for item CRUD |
| Static files | WhiteNoise | Serves SPA assets efficiently without Nginx; correct Cache-Control headers |
| Frontend | React 18 + TypeScript + Vite | Component-based UI, type safety, fast builds with HMR |
| Deployment | Cloudflare Pages + Worker Functions | Edge-hosted SPA with API proxy; CDN caching; TLS at edge |
| Tunnel | Cloudflare Tunnel (cloudflared) | Outbound-only connection from EC2; no inbound security group rules |
| Testing | Django TestCase (unittest) + Playwright (e2e) | Built-in Django test runner for API; Playwright for browser testing |

---

## 3. Test Strategy & Results

### 3.1 Unit / Integration Tests (Backend)

**13 tests — all PASSING** ✅

```
test_create_item_success                         PASS
test_create_duplicate_name_group_returns_400      PASS  (Trap T2)
test_same_name_different_group_allowed            PASS
test_create_invalid_group_returns_400             PASS
test_list_items                                   PASS
test_list_items_empty                             PASS
test_get_item_by_id                               PASS  (Trap T3)
test_get_item_404_for_missing                     PASS
test_patch_item_name                              PASS  (Trap T1)
test_patch_item_group                             PASS
test_patch_item_404_for_missing                   PASS
test_patch_item_duplicate_conflict_returns_400    PASS
test_timestamps_are_read_only                     PASS  (Trap T5)
```

Run: `cd backend && python manage.py test items -v 2`

### 3.2 Property-Based / Mutation Testing

| Property | Test Coverage |
|----------|--------------|
| **Idempotency of GET /items/** | Repeated calls return same structure; new items appear after creation |
| **Unique constraint violation** | Duplicate (name, group) → 400; cross-group same name → 201 |
| **PATCH partiality** | Only changed fields updated; unchanged fields preserved |
| **Timestamp integrity** | Client-provided timestamps silently ignored; server sets actual time |
| **404 consistency** | GET, PATCH on nonexistent ID → 404 with detail message |

### 3.3 Acceptance / E2E Tests (Browser)

| Test | Description | Status |
|------|-------------|--------|
| SPA loads | GET / returns HTML with root div and JS module | ✅ |
| API GET /items/ | Returns JSON array | ✅ |
| API POST /items/ | Creates item, returns 201 with id | ✅ |
| API GET /items/1/ | Returns single item or 404 | ✅ |
| API POST duplicate | Returns 400 on duplicate name+group | ✅ |
| UI: Create item | Fill form → click Create → item appears in list | ✅ |
| UI: Detail panel | Click item → detail panel opens | ✅ |
| UI: Edit item | Click Edit → change name → Save → updated in list | ✅ |

Run: `python test_browser.py` (uses Playwright, targets live deployment)

---

## 4. Deployment

### 4.1 URLs

| URL | Purpose |
|-----|---------|
| `https://mychoice.pages.dev` | Primary deployment (Pages + Functions proxy) |
| `https://mychoice.ucalyptus.me` | Custom domain (DNS being propagated) |
| `http://localhost:8000` | Local development (Django runserver/gunicorn) |

### 4.2 Running Locally

```bash
# Backend
cd backend && source venv/bin/activate
python manage.py migrate
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2

# Frontend (dev)
cd frontend && npm install && npm run dev

# Frontend (build)
cd frontend && npm run build
```

### 4.3 Infrastructure

- **Cloudflare Pages project:** `mychoice` (Account: Sayantan Das)
- **Cloudflare Tunnel:** `mychoice-standalone` (d43fc2dc-e1a5-4ac0-8f59-469a2e6208ac)
- **EC2 Instance:** this machine (Amazon Linux 2023)
- **Database:** SQLite at `backend/db.sqlite3`

---

## 5. Requirements Traceability Matrix

| Req ID | Description | Implemented In | Verified By |
|--------|-------------|---------------|-------------|
| R1 | Item data fields | `items/models.py:4-13` | `test_create_item_success` |
| R2 | GET /items/ | `items/views.py:17-20` | `test_list_items`, `test_list_items_empty` |
| R3 | POST /items/ | `items/views.py:22-35` | `test_create_item_success` |
| R4 | PATCH /items/{id}/ | `items/views.py:60-71` | `test_patch_item_name`, `test_patch_item_group` |
| R5 | GET /items/{id}/ | `items/views.py:50-58` | `test_get_item_by_id` |
| R6 | Primary + Secondary groups | `items/models.py:5-8` | `test_create_invalid_group_returns_400` |
| R7 | Unique per group | `items/models.py:16` | `test_create_duplicate_name_group_returns_400` |
| R8 | HTTP status codes | `items/views.py` (throughout) | All 13 tests |
| R9 | React SPA CRUD | `frontend/src/App.tsx`, `CreateItem`, `ItemList`, `ItemDetail` | Browser e2e tests |
| R10 | Independent run | `README.md`, separate backend/frontend dirs | Manual verification |
| R11 | README.md | `/README.md` | File exists |

---

## 6. ADRs

- [ADR-001: Django + DRF Backend](adr/ADR-001-django-drf-backend.md)
- [ADR-002: SQLite Persistence](adr/ADR-002-sqlite-persistence.md)
- [ADR-003: React + Vite SPA](adr/ADR-003-react-vite-spa.md)
- [ADR-004: Unique-Together Constraint](adr/ADR-004-unique-together-constraint.md)
- [ADR-005: Cloudflare Tunnel Deployment](adr/ADR-005-cloudflare-tunnel-deployment.md)

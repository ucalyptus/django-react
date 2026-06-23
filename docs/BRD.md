# BRD: MyChoice — Item Management Application

**Version:** 2.0  
**Date:** 2026-06-23  
**Status:** Implemented & Verified  

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
| **T1** | PATCH not PUT — the spec says PATCH /items/{id}/, implying partial updates | ✅ PATCH with partial update semantics. Frontend sends only changed fields. |
| **T2** | Unique per group — compound unique constraint on (name, group) | ✅ D1 UNIQUE(name, item_group) at DB level + 400 error response |
| **T3** | GET single item — buried in the API list but required | ✅ GET /items/:id returns item, 404 if missing |
| **T4** | Review single item — frontend must show item details | ✅ Detail component shows ID, name, group, timestamps with edit capability |
| **T5** | Timestamps read-only — spec never says clients can set them | ✅ Server sets timestamps; client values silently ignored |
| **T6** | At least two groups — Primary + Secondary required | ✅ Enforced at schema level with CHECK constraint; easily extensible |
| **T7** | No DELETE endpoint — spec says CRUD but list omits Delete | ✅ DELETE → 405 Method Not Allowed |
| **T8** | Proper HTTP codes — spec explicitly calls this out | ✅ 201 for create, 200 for list/get/patch, 400 for bad request/duplicate, 404 for not found, 405 for unsupported methods |

---

## 2. Architecture

### 2.1 System Diagram

```
┌────────────────────────────────────────────────────────────┐
│                     Cloudflare Edge                         │
│  ┌──────────────────────┐  ┌────────────────────────────┐  │
│  │  Pages (Frontend)    │  │  Pages Functions (API)      │  │
│  │  React SPA + Vite    │  │  /items/* → D1 queries     │  │
│  │  index.html + JS/CSS │  │  CORS + HTTP codes          │  │
│  └──────────────────────┘  └───────────┬────────────────┘  │
│                                        │                    │
│                        ┌───────────────▼────────────────┐  │
│                        │         D1 Database            │  │
│                        │   items table (SQLite)         │  │
│                        │   UNIQUE(name, item_group)     │  │
│                        └────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
Browser → mychoice.ucalyptus.me (DNS)
  → Cloudflare Worker (mychoice-proxy, transparent pass-through)
    → mychoice.pages.dev
      ├── GET /         → index.html (static SPA)
      └── GET/POST/PATCH /items/* → Pages Function → D1
```

### 2.3 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + TypeScript + Vite | Component-based UI, type safety, fast builds |
| API | Cloudflare Pages Functions (JS) | Serverless, edge-hosted, co-located with static assets |
| Database | Cloudflare D1 (SQLite-compatible) | Zero-ops SQL database, edge-replicated, API-native |
| Routing | Cloudflare Worker (transparent proxy) | Maps custom domain to Pages project |
| DNS | Cloudflare DNS (proxied) | TLS termination, CDN caching, DDoS protection |
| Testing | Python requests (API) + Browserbase (e2e) | HTTP client for API tests; headless browser for UI |

### 2.4 Local Development (Django)

The repo also includes a Django backend for local development and testing:

| Layer | Technology |
|-------|-----------|
| Backend | Django 5.x + Django REST Framework |
| Database | SQLite |
| Static files | WhiteNoise |

---

## 3. Test Strategy & Results

### 3.1 API Tests

**13 tests — all PASSING** ✅

```
test_get_items_list                                 PASS
test_create_item_returns_201                        PASS
test_unique_per_group_rejects_duplicate             PASS  (Trap T2)
test_same_name_different_group_ok                   PASS
test_get_single_item_200                            PASS  (Trap T3)
test_get_nonexistent_returns_404                    PASS
test_patch_updates_item                             PASS  (Trap T1)
test_patch_nonexistent_returns_404                  PASS
test_put_returns_405                                PASS
test_delete_returns_405                             PASS  (Trap T7)
test_bad_group_returns_400                          PASS
test_empty_name_returns_400                         PASS
test_timestamps_server_managed                      PASS  (Trap T5)
```

Run: `python -m pytest test_api.py -v`

### 3.2 Acceptance / E2E Tests

| Test | Description | Status |
|------|-------------|--------|
| SPA loads | GET / returns HTML with root div and JS module | ✅ |
| API GET /items/ | Returns JSON array | ✅ |
| API POST /items/ | Creates item, returns 201 with id | ✅ |
| API GET /items/:id | Returns single item or 404 | ✅ |
| API POST duplicate | Returns 400 on duplicate name+group | ✅ |
| UI: Create item | Fill form → click Create → item appears in list | ✅ |
| UI: Detail panel | Click item → detail panel opens | ✅ |
| UI: Edit item | Click Edit → change name → Save → updated in list | ✅ |

---

## 4. Deployment

### 4.1 URLs

| URL | Purpose |
|-----|---------|
| `https://mychoice.ucalyptus.me` | Primary custom domain |
| `https://mychoice.pages.dev` | Cloudflare Pages direct URL |

### 4.2 Infrastructure

- **Cloudflare Pages** — hosts static frontend + Functions API
- **Cloudflare D1** — SQLite-compatible database for items
- **Cloudflare Worker** — transparent proxy mapping custom domain to Pages

---

## 5. Requirements Traceability Matrix

| Req ID | Description | Implemented In | Verified By |
|--------|-------------|---------------|-------------|
| R1 | Item data fields | `functions/items/[[id]].js` (D1 schema) | `test_create_item_returns_201` |
| R2 | GET /items/ | `functions/items/[[id]].js:listItems()` | `test_get_items_list` |
| R3 | POST /items/ | `functions/items/[[id]].js:createItem()` | `test_create_item_returns_201` |
| R4 | PATCH /items/:id | `functions/items/[[id]].js:patchItem()` | `test_patch_updates_item` |
| R5 | GET /items/:id | `functions/items/[[id]].js:getItem()` | `test_get_single_item_200` |
| R6 | Primary + Secondary groups | D1 CHECK constraint | `test_bad_group_returns_400` |
| R7 | Unique per group | D1 UNIQUE(name, item_group) | `test_unique_per_group_rejects_duplicate` |
| R8 | HTTP status codes | Throughout function handler | All 13 tests |
| R9 | React SPA CRUD | `frontend/src/App.tsx` | Browser e2e tests |
| R10 | Independent run | `README.md`, separate dirs | Manual verification |
| R11 | README.md | `/README.md` | File exists |

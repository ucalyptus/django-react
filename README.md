# MyChoice

React SPA + Cloudflare Pages Functions API for managing items, with D1 database.

## Live

- **https://mychoice.ucalyptus.me** — custom domain
- **https://mychoice.pages.dev** — Cloudflare Pages direct URL

## Architecture

- **Frontend:** React + TypeScript + Vite, deployed to Cloudflare Pages
- **API:** Cloudflare Pages Functions (`/items/*`) with D1 database
- **Database:** Cloudflare D1 (SQLite-compatible, edge-replicated)

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev    # proxies /items to localhost:8000 for Django backend
```

### Backend (Django — for local dev/testing)

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

API at http://localhost:8000/items/

### Production Build

```bash
cd frontend && npm run build    # outputs to backend/staticfiles/frontend/
npx wrangler pages deploy backend/staticfiles/frontend --project-name mychoice
```

### Tests

```bash
python -m pytest test_api.py -v    # 13 API tests against live deployment
```

# mychoice

Django REST API + React SPA for managing items.

## Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

API at http://localhost:8000/items/

## Frontend (dev)

```bash
cd frontend
npm install
npm run dev   # proxies /items to localhost:8000
```

## Production (single server)

```bash
cd frontend && npm run build        # outputs to backend/staticfiles/frontend/
cd ../backend
python manage.py collectstatic --noinput
gunicorn config.wsgi:application --bind 0.0.0.0:8950 --workers 2
```

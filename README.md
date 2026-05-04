# Salon Booking & Inventory Management System

## Structure
```
saloon/
  backend/   — Django + DRF (port 8000)
  frontend/  — React + Vite (port 5173)
  .venv/     — Python virtualenv
```

## Backend Setup

```bash
# Activate virtualenv
.venv\Scripts\activate          # Windows PowerShell
source .venv/bin/activate       # macOS/Linux

# Run migrations
cd backend
python manage.py migrate

# Seed superuser + 3 services
python manage.py seed

# Start dev server
python manage.py runserver
```

Default admin: `admin@salon.com` / `admin123`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

## Test Accounts Created by seed command
- **System Admin**: admin@salon.com / admin123 → /admin/salons

## Quick Start Flow
1. Register a salon owner via /register/salon
2. Admin approves the salon at /admin/salons/pending
3. Salon owner logs in → /salon/dashboard
4. Attach services at /salon/services
5. Register a client at /register/client
6. Client browses salons, books a slot at /client/book/:salonId
7. Salon owner confirms/rejects at /salon/bookings/:id

## API Base URL
http://localhost:8000/api

## Auth
JWT tokens — login returns access + refresh tokens stored in localStorage.
Access token expires in 8 hours, refresh in 7 days.

# KTM Bites

**KTM Bites** is a full-stack food delivery platform built for the Kathmandu valley. It provides end-to-end coverage of the ordering lifecycle — from menu discovery and cart checkout through kitchen preparation, rider dispatch with live GPS tracking, and final doorstep delivery.

The system is organized into four role-based portals, each with its own authentication, dashboard, and feature set:

| Portal | Path | Purpose |
| :--- | :--- | :--- |
| **Customer** | `/login` | Browse menus, place orders, pay via Khalti or Kharcha, track deliveries in real time, and rate riders. |
| **Kitchen** | `/kitchen` | Live kitchen display system showing incoming, in-progress, and ready-for-pickup orders. |
| **Rider** | `/rider-login` | Accept dispatched orders, update delivery status, and broadcast GPS coordinates. |
| **Admin** | `/admin` | Manage menu items, users, riders, order statuses, delivery simulations, and PDF invoice exports. |

---

## Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Database Migrations](#database-migrations)
- [Demo Credentials](#demo-credentials)
- [API Reference](#api-reference)
- [Key Features](#key-features)
- [Production Build](#production-build)
- [License](#license)

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Vanilla CSS (HSL design tokens), Leaflet.js, React Google OAuth |
| **Backend** | Django 4+, Django REST Framework, PostgreSQL |
| **Database** | Supabase (hosted PostgreSQL) |
| **External APIs** | OSRM (route simulation), Groq / Llama 3 (AI recommendations), Khalti & Kharcha (payments), OpenWeather |

---

## Project Structure

```
KTM-Bites/
├── backend/
│   ├── api/                # Models, views, serializers, permissions
│   ├── ktmbites/           # Django settings, root URL config, WSGI/ASGI
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios request handlers
│   │   ├── assets/         # Logos, images, static media
│   │   ├── components/     # Shared UI components (ChatWidget, LiveMap, Toast)
│   │   ├── css/            # Stylesheets organized by feature
│   │   ├── pages/          # Route-level page components
│   │   └── utils/          # Helpers (PDF generator, error formatting)
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

---

## Environment Variables

Both the backend and frontend require a local `.env` file. These files are excluded from version control via `.gitignore`.

### Backend (`backend/.env`)

Create a file named `.env` inside the `backend/` directory with the following variables:

```env
# Django
SECRET_KEY=your-django-secret-key
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>

# Seed accounts
DEMO_USER_EMAIL=saksham@email.com
DEMO_USER_PASSWORD=password123
ADMIN_USER_EMAIL=admin@ktmbites.com
ADMIN_USER_PASSWORD=admin123
KITCHEN_USER_EMAIL=kitchen@ktmbites.com
KITCHEN_USER_PASSWORD=kitchen123

# AI
GROQ_API_KEY=your_groq_api_key
OPENWEATHER_API_KEY=your_openweather_api_key

# Khalti payment gateway
KHALTI_SECRET_KEY=your_khalti_secret_key
KHALTI_PUBLIC_KEY=your_khalti_public_key

# Kharcha payment gateway (OAuth)
KHARCHA_BASE_URL=https://kharcha-production.up.railway.app/
KHARCHA_FRONTEND_URL=https://kharcha-omega.vercel.app
KHARCHA_REDIRECT_URI=http://localhost:8000/api/kharcha/callback/
FRONTEND_BASE_URL=http://localhost:5173
BACKEND_BASE_URL=http://localhost:8000
KHARCHA_CLIENT_ID=your_kharcha_client_id
KHARCHA_CLIENT_SECRET=your_kharcha_client_secret
KHARCHA_API_KEY=your_kharcha_api_key
KHARCHA_REDIRECT_BASE=http://localhost:8000/api

# Email (password resets, notifications)
EMAIL_HOST_USER=your_gmail@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password
```

### Frontend (`frontend/.env`)

Create a file named `.env` inside the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

---

## Installation

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher

### 1. Clone the repository

```bash
git clone https://github.com/your-username/KTM-Bites.git
cd KTM-Bites
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

- **Windows (PowerShell):** `.\venv\Scripts\Activate.ps1`
- **macOS / Linux:** `source venv/bin/activate`

Install dependencies and start the server:

```bash
pip install -r requirements.txt
python manage.py runserver
```

The backend will be available at `http://localhost:8000`.

### 3. Frontend setup

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Database Migrations

> [!WARNING]
> **Do not run migrations if you are connected to the shared Supabase database.**
> The hosted database is already fully migrated and contains live data. Running `migrate` against it may cause schema conflicts or data corruption.

Only run the following command if you are connecting to a **new, empty database** (e.g., a local PostgreSQL instance or a fresh Supabase project):

```bash
cd backend
python manage.py migrate
```

---

## Demo Credentials

The following accounts are pre-seeded in the shared database for testing:

| Portal | Email | Password |
| :--- | :--- | :--- |
| Customer | `saksham@email.com` | `password123` |
| Admin | `admin@ktmbites.com` | `admin123` |
| Kitchen | `kitchen@ktmbites.com` | `kitchen123` |
| Rider | Register via `/rider-signup` | — |

---

## API Reference

A summary of the primary REST endpoints exposed by the backend:

| Method | Endpoint | Description |
| :---: | :--- | :--- |
| `POST` | `/api/auth/login/` | Authenticate a user |
| `POST` | `/api/auth/register/` | Register a new customer account |
| `POST` | `/api/auth/google/` | Google OAuth authentication |
| `POST` | `/api/auth/forgot-password/` | Request a password reset email |
| `POST` | `/api/auth/reset-password/` | Set a new password using a reset token |
| `GET` | `/api/menu/` | List all menu items |
| `GET` | `/api/categories/` | List menu categories |
| `POST` | `/api/orders/` | Place a new order |
| `GET` | `/api/orders/` | Retrieve the current user's order history |
| `POST` | `/api/orders/<id>/cancel/` | Cancel an active order (within 5-minute window) |
| `GET` | `/api/admin/orders/` | Fetch all orders (admin only) |
| `PATCH` | `/api/admin/orders/<id>/` | Update an order's status (admin only) |
| `GET` | `/api/kitchen/orders/` | Fetch active kitchen orders (kitchen staff only) |
| `POST` | `/api/rider/login/` | Authenticate a rider |
| `PUT` | `/api/rider/location/` | Update a rider's GPS coordinates |
| `POST` | `/api/ai/recommend/` | Get AI-powered food recommendations |

---

## Key Features

### Authentication and Security
- Role-segregated login with enforced strong password validation (8+ characters, uppercase, lowercase, digit, special character).
- Google OAuth 2.0 for one-click customer and rider sign-ups.
- Session persistence across payment gateway redirects (Khalti, Kharcha) to prevent cart loss.
- Remember Me support across all portals.

### AI Integration
- Floating chat widget powered by Groq-hosted Llama 3, providing personalized food recommendations based on weather, mood, and dietary preferences.

### Live GPS Tracking and Delivery Simulation
- Real-time rider location displayed on a Leaflet map with OpenStreetMap tiles.
- Admin-triggered road-following delivery simulation using OSRM route geometry, advancing along actual road paths.

### Order Management
- 5-minute cancellation window for customers after placing an order.
- Full order lifecycle tracking: Placed, Preparing, Ready for Pickup, On the Way, Delivered, Cancelled.
- PDF invoice generation for order reports.

### Payment Integration
- Khalti digital wallet integration with server-side verification.
- Kharcha OAuth-based payment gateway with session-preserving redirect flow.
- Automatic recovery of unpaid orders on payment failure.

### Notifications
- Real-time notification system for order status updates, promotions, and delivery alerts.

### User Ranks
- Loyalty-based ranking system that awards progressive discounts based on cumulative order history.

---

## Production Build

To generate optimized production assets for the frontend:

```bash
cd frontend
npm run build
```

The output is written to the `dist/` directory, ready for deployment to any static hosting provider.

---



## License

This project was developed as an academic project. All rights reserved by the contributors.

---

<p align="center"><strong>KTM Bites</strong> — Delivering Kathmandu's flavors, one bite at a time.</p>

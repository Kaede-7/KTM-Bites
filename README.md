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
- [Frontend Pages](#frontend-pages)
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

## Frontend Pages

| Route | Page | Description |
| :--- | :--- | :--- |
| `/` | `LandingPage` | Splash page, introduction, spin wheel |
| `/home` | `Home` | User homepage with dashboard, promotions, recommended items |
| `/menu` | `MenuBrowse` | Menu catalog with category filters and search |
| `/menu/:id` | `ItemDetail` | Detailed menu item view, custom options, add to cart |
| `/contact` | `Contact` | Contact/feedback form and company information |
| `/about` | `About` | Company story, mission, and team information |
| `/login` | `Login` | Customer credentials/Google OAuth login page |
| `/signup` | `Signup` | Customer account registration |
| `/forgot-password` | `ForgotPassword` | Password reset request form |
| `/reset-password` | `ResetPassword` | Set new password form using verification token |
| `/rider-login` | `RiderLogin` | Delivery rider credentials login page |
| `/rider-signup` | `RiderSignup` | Rider account application registration page |
| `/admin` | `Admin` | Admin panel to manage orders, menu items, users, and simulations |
| `/kitchen` | `Kitchen` | Kitchen display system to manage cooking pipelines |
| `/rider` | `Rider` | Rider dashboard to accept/decline orders, view paths, and update status |
| `/rider/profile` | `RiderProfile` | Rider profile page for updating details and status |
| `/cart` | `Cart` | Customer shopping cart summary |
| `/checkout` | `Checkout` | Checkout form with Khalti/Kharcha payment option |
| `/order-tracking/:id` | `OrderTracking` | Live order tracking page with Leaflet map and route simulation |
| `/profile` | `Profile` | Customer profile management and order history |

---

## Environment Variables

Both the backend and frontend require a local `.env` file. These files are excluded from version control via `.gitignore`.

### Backend .env

| Variable | Description |
| :--- | :--- |
| `SECRET_KEY` | Cryptographic secret key for Django security. |
| `DATABASE_URL` | PostgreSQL connection URL (e.g. Supabase hosted instance). |
| `DEMO_USER_EMAIL` | Email for the pre-seeded Customer user account. |
| `DEMO_USER_PASSWORD` | Password for the pre-seeded Customer user account. |
| `ADMIN_USER_EMAIL` | Email for the pre-seeded Admin account. |
| `ADMIN_USER_PASSWORD` | Password for the pre-seeded Admin account. |
| `KITCHEN_USER_EMAIL` | Email for the pre-seeded Kitchen account. |
| `KITCHEN_USER_PASSWORD` | Password for the pre-seeded Kitchen account. |
| `GROQ_API_KEY` | Cloud API key for the Groq service running Llama 3 AI. |
| `OPENWEATHER_API_KEY` | API key from OpenWeatherMap for AI weather context. |
| `KHALTI_SECRET_KEY` | Khalti merchant portal secret key for verification. |
| `KHALTI_PUBLIC_KEY` | Khalti merchant portal public key for frontend SDK load. |
| `KHARCHA_BASE_URL` | Base API URL for the Kharcha payment portal. |
| `KHARCHA_FRONTEND_URL` | Hosted frontend URL for Kharcha gateway pages. |
| `KHARCHA_REDIRECT_URI` | Authentication callback URI for Kharcha OAuth. |
| `FRONTEND_BASE_URL` | Address of the React frontend application (e.g., `http://localhost:5173`). |
| `BACKEND_BASE_URL` | Address of the Django backend application (e.g., `http://localhost:8000`). |
| `KHARCHA_CLIENT_ID` | Client identifier for OAuth2 Kharcha link. |
| `KHARCHA_CLIENT_SECRET` | Client secret key for OAuth2 Kharcha link. |
| `KHARCHA_API_KEY` | Merchant API key for payment processing. |
| `KHARCHA_REDIRECT_BASE` | Base path for payment success redirect URL generation. |
| `EMAIL_HOST_USER` | Email username for sending password reset alerts. |
| `EMAIL_HOST_PASSWORD` | App-specific password for the email provider account. |

### Frontend .env

| Variable | Description |
| :--- | :--- |
| `VITE_API_BASE_URL` | Backend Django REST API root endpoint URL. |
| `VITE_GOOGLE_CLIENT_ID` | OAuth 2.0 client ID for Google One-Tap/Login button. |

---

## Installation

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher

### 1. Clone the repository

```bash
git clone https://github.com/Kaede-7/KTM-Bites.git
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

### Authentication

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/auth/register/` | None | Register a new customer account |
| `POST` | `/api/auth/login/` | None | Authenticate a user and return a token |
| `GET` | `/api/auth/profile/` | JWT | Retrieve profile details of authenticated user |
| `POST` | `/api/auth/change-password/` | JWT | Change user password |
| `POST` | `/api/auth/google/` | None | Google OAuth login / registration |
| `POST` | `/api/auth/forgot-password/` | None | Request a password reset email |
| `POST` | `/api/auth/reset-password/` | None | Reset password with token |
| `POST` | `/api/rider/register/` | None | Apply/register as a delivery rider |
| `POST` | `/api/rider/login/` | None | Authenticate a rider |

### Menu

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/categories/` | None | Fetch all menu categories |
| `GET` | `/api/menu/` | None | Fetch all menu items |
| `GET` | `/api/menu/<int:pk>/` | None | Fetch details for a specific menu item |

### Shopping Cart

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/cart/` | JWT | View contents of the active shopping cart |
| `POST` | `/api/cart/add/` | JWT | Add a menu item to the cart |
| `PUT` | `/api/cart/update/<int:pk>/` | JWT | Update the quantity/details of a cart item |
| `DELETE` | `/api/cart/remove/<int:pk>/` | JWT | Remove an item from the cart |

### Orders

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/orders/` | JWT | Fetch order history for the logged-in customer |
| `POST` | `/api/orders/` | JWT | Place a new order |
| `GET` | `/api/orders/<int:pk>/` | JWT | Fetch detailed status of a specific order |
| `PUT` | `/api/orders/<int:pk>/update/` | JWT | Update order information |
| `POST` | `/api/orders/<int:pk>/cancel/` | JWT | Cancel order within the 5-minute window |
| `POST` | `/api/orders/<int:pk>/rate-rider/` | JWT | Rate and review the delivery rider |
| `POST` | `/api/orders/<int:pk>/reinitiate-payment/` | JWT | Retry payment for an unpaid order |

### Admin Panel

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/admin/orders/` | JWT (Admin) | List all orders in the system |
| `GET` | `/api/admin/orders/<int:pk>/` | JWT (Admin) | View detailed admin status of an order |
| `GET` | `/api/admin/users/` | JWT (Admin) | List registered users and customers |
| `GET` | `/api/admin/riders/` | JWT (Admin) | List registered delivery riders |
| `GET` | `/api/admin/riders/<int:pk>/reviews/` | JWT (Admin) | Fetch reviews for a specific rider |
| `GET`/`POST` | `/api/admin/menu/` | JWT (Admin) | Manage (list, create, update) menu items |
| `GET`/`POST` | `/api/admin/categories/` | JWT (Admin) | Manage menu categories |

### Payments (Khalti)

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/payments/initiate/` | JWT | Generate a payment session and gateway URL |
| `POST` | `/api/payments/verify/` | JWT | Verify payment status on the server side |
| `GET` | `/api/payments/status/<int:order_id>/` | JWT | Check payment success for a specific order |

### AI Features

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/ai/chat/` | JWT | Send message to Llama 3 AI chatbot assistant |
| `GET` | `/api/ai/recommendations/` | JWT | Get weather & mood-based menu recommendations |

### Rider GPS Tracking

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `PUT` | `/api/rider/location/` | JWT (Rider) | Broadcast live GPS coordinates of the rider |
| `GET` | `/api/rider/profile/` | JWT (Rider) | Retrieve profile of the logged-in rider |

### Kharcha Integration (Redirect Portal)

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/kharcha/portal/initiate/` | JWT | Create a pay session and get hosted checkout link |
| `GET` | `/api/kharcha/portal/callback/` | None | Handle redirect callback from Kharcha portal |

### Kharcha Integration (Linked Account Payment)

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/kharcha/pay/initiate/` | JWT | Request OTP code for payment from linked account |
| `POST` | `/api/kharcha/pay/confirm/` | JWT | Confirm payment using OTP code |

### Kharcha Integration (OAuth Account Link)

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/kharcha/link/status/` | JWT | Check if user has linked a Kharcha account |
| `POST` | `/api/kharcha/link/start/` | JWT | Generate OAuth URL to start linking accounts |
| `GET` | `/api/kharcha/callback/` | None | Handle redirect callback from Kharcha OAuth |
| `POST` | `/api/kharcha/link/remove/` | JWT | Unlink the Kharcha account |

### Notifications

| Method | Endpoint | Auth | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/notifications/` | JWT | Get user notifications list |
| `POST` | `/api/notifications/<int:pk>/read/` | JWT | Mark a specific notification as read |
| `POST` | `/api/notifications/read-all/` | JWT | Mark all notifications as read |

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

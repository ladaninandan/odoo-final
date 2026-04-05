# ☕ Odoo POS Cafe — Full-Stack Point of Sale System

A modern, full-featured **Point of Sale (POS)** system purpose-built for cafes and restaurants. This application provides a complete end-to-end workflow — from floor management and order placement to kitchen display, payment processing, customer self-ordering via QR codes, and rich analytics dashboards.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Seeding Demo Data](#-seeding-demo-data)
- [Running the Application](#-running-the-application)
- [Demo Credentials](#-demo-credentials)
- [Role-Based Access](#-role-based-access)
- [API Endpoints](#-api-endpoints)
- [Real-Time Features (Socket.IO)](#-real-time-features-socketio)
- [Environment Variables](#-environment-variables)
- [Screenshots / Modules](#-screenshots--modules)

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based authentication** with access & refresh token rotation
- **Google OAuth 2.0** sign-in integration
- **Role-based access control** (Admin, Cashier, Kitchen)
- **Password reset** via Email OTP (Nodemailer) or SMS OTP (Twilio)
- **Rate limiting**, Helmet security headers, IP blocking for brute-force protection
- **Password visibility toggle** (eye icon) on all auth pages
- Token blacklisting on logout

### 🏪 POS Terminal (Cashier / Admin)
- **Interactive floor plan** with real-time table status (Available / Occupied / Reserved)
- **Order screen** — browse products by category, search, add to cart with variant selection (e.g., size, type)
- **Order notes** and item-level customization
- **Send to Kitchen** workflow with one click
- **Payment screen** — Cash, Digital, and UPI (with auto-generated QR code)
- **Session management** — open/close POS sessions with opening & closing balance
- **Customer linking** — associate customers with orders, add via inline dialog
- **Self-order QR generation** — generate a QR code for any table so guests can order from their phones

### 🍳 Kitchen Display System (KDS)
- **Real-time order board** powered by Socket.IO
- Per-item status tracking: `Pending → To Cook → Preparing → Completed`
- **Audio alerts** for new incoming orders
- Visual order cards with timer, table number, and item details
- Mark individual items or full orders as ready

### 📱 Customer Self-Ordering
- **QR code-based access** — no login required; guests scan and order
- Mobile-friendly responsive menu with product images & descriptions
- Add items, select variants, customize quantities
- **Live order status tracking** page with real-time Socket.IO updates
- Guest name & phone capture for notification

### 📺 Customer-Facing Display
- Separate display route (`/customer-display`) for a screen facing the customer
- Shows live order status and payment confirmations via Socket.IO

### 📊 Admin Back-Office
- **Dashboard** — revenue overview, order count, session summaries at a glance
- **Product Management** — CRUD with image upload (Multer), category linking, variant support, tax rate configuration
- **Category Management** — color-coded categories with emoji icons
- **Floor & Table Management** — create floors, add/edit/delete tables with seat count
- **Staff Management** — add/edit/suspend users, assign roles (admin, cashier, kitchen)
- **Customer Directory** — full CRM-lite: name, phone, mobile, email, address, city, state, country, notes
- **Order History** — view, filter, and manage all orders (admin-level visibility)
- **Session Manager** — view all POS sessions (open/closed), opening/closing balances, total sales
- **Reports & Analytics** — filterable reports with charts (Recharts), export to **Excel (XLSX)** and **PDF**
- **POS Settings** — configure payment methods (Cash / Digital / UPI), set UPI ID for QR payments

### 🔄 Real-Time Updates
- **Socket.IO** powers live communication between POS, Kitchen, and Customer screens
- Order status updates, table status changes, payment confirmations — all instant
- Room-based architecture: `pos`, `kitchen`, `customer`

---

## 🛠 Tech Stack

### Frontend (Client)
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Redux Toolkit** | Global state management |
| **React Router v6** | Client-side routing & role-based guards |
| **Tailwind CSS 3** | Utility-first styling |
| **Radix UI** | Accessible dialog, dropdown, select, tabs, toast components |
| **Recharts** | Charts & analytics visualizations |
| **Axios** | HTTP client with interceptors |
| **Socket.IO Client** | Real-time WebSocket communication |
| **Lucide React** | Icon library |
| **qrcode.react** | QR code generation for self-ordering |
| **React Hot Toast** | Toast notifications |
| **Google OAuth** | `@react-oauth/google` for social login |

### Backend (Server)
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **MongoDB + Mongoose 9** | Primary database & ODM |
| **Socket.IO** | WebSocket server for real-time events |
| **JWT** (jsonwebtoken) | Access & refresh token authentication |
| **bcryptjs** | Password hashing |
| **Multer** | File/image upload handling |
| **Nodemailer** | Email OTP for password reset |
| **Twilio** | SMS OTP for password reset |
| **Google Auth Library** | Server-side Google OAuth verification |
| **QRCode** | Server-side QR code generation |
| **PDFKit** | PDF report generation |
| **ExcelJS** | Excel/XLSX report export |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | API rate limiting |
| **express-mongo-sanitize** | NoSQL injection prevention |
| **cookie-parser** | Secure cookie handling for refresh tokens |

---

## 🏗 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React SPA)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐  │
│  │  Auth    │  │  POS     │  │  Kitchen │  │  Admin Back-Office  │  │
│  │  Pages   │  │  Terminal│  │  Display │  │  (Dashboard, CRUD)  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┬──────────┘  │
│       │              │             │                   │             │
│  ┌────┴──────────────┴─────────────┴───────────────────┴──────────┐  │
│  │              Redux Store  +  Axios API Layer                  │  │
│  └────────────────────────────┬───────────────────────────────────┘  │
│                               │  HTTP + WebSocket                   │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────────┐
│                        SERVER (Express)                             │
│  ┌────────────────────────────┴──────────────────────────────────┐  │
│  │  Routes → Controllers → Services → Models (Mongoose)         │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
│  ┌───────────────────────────┴───────────────────────────────────┐  │
│  │  Middlewares: Auth JWT, Role Guard, Rate Limit, Helmet        │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
│  ┌───────────────────────────┴───────────────────────────────────┐  │
│  │  Socket.IO: Real-time events (kitchen ↔ pos ↔ customer)      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                               │                                     │
│                        MongoDB (Local / Atlas)                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Self-Order QR Flow
```
  Cashier generates QR  →  Guest scans QR on phone  →  /order/:token
       (POS)                  (no login needed)         (Self-Order Menu)
                                    │
                                    ▼
                          Browse menu → Add to cart → Submit order
                                    │
                                    ▼
                        Order appears on Kitchen Display (real-time)
                                    │
                                    ▼
                        Guest tracks order status at /order/:token/status
```

---

## 📁 Project Structure

```
odoo-final/
├── client/                          # React frontend
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── api/                     # Axios API service modules
│   │   ├── components/
│   │   │   ├── admin/               # Admin dashboard, CRUD panels
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminOrders.jsx
│   │   │   │   ├── ProductList.jsx
│   │   │   │   ├── CategoryList.jsx
│   │   │   │   ├── FloorTableManagement.jsx
│   │   │   │   ├── SessionManager.jsx
│   │   │   │   ├── ReportsDashboard.jsx
│   │   │   │   ├── POSSettings.jsx
│   │   │   │   ├── StaffManagement.jsx
│   │   │   │   └── CustomerList.jsx
│   │   │   ├── pos/                 # POS terminal screens
│   │   │   │   ├── FloorPlan.jsx
│   │   │   │   ├── OrderScreen.jsx
│   │   │   │   ├── PaymentScreen.jsx
│   │   │   │   ├── CustomerSelectDialog.jsx
│   │   │   │   └── PosStopSessionButton.jsx
│   │   │   ├── kitchen/             # Kitchen Display System
│   │   │   │   └── KitchenDisplay.jsx
│   │   │   ├── selforder/           # Customer self-ordering
│   │   │   │   ├── SelfOrderLayout.jsx
│   │   │   │   ├── SelfOrderMenu.jsx
│   │   │   │   ├── SelfOrderProductDetail.jsx
│   │   │   │   ├── SelfOrderStatus.jsx
│   │   │   │   └── GenerateQRButton.jsx
│   │   │   ├── customer/            # Customer-facing display
│   │   │   │   └── CustomerDisplay.jsx
│   │   │   ├── layout/              # POSLayout, AdminLayout
│   │   │   └── ui/                  # Reusable UI primitives (Radix-based)
│   │   ├── context/                 # React context providers
│   │   ├── features/auth/           # Login, Register, ForgotPassword
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utility libraries
│   │   ├── pages/                   # NotFound (404)
│   │   ├── routes/                  # ProtectedRoute, PublicRoute, RoleRoute
│   │   ├── services/                # Service layer
│   │   ├── store/                   # Redux store & slices
│   │   ├── utils/                   # Helper utilities
│   │   ├── App.js                   # Root component with routing
│   │   └── index.js                 # Entry point
│   ├── .env                         # Client environment variables
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                          # Express backend
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── nodemailer.js            # Email transporter config
│   ├── controllers/
│   │   ├── auth/                    # Login, Register, Token refresh, Google OAuth
│   │   ├── authController.js
│   │   ├── categories.controller.js
│   │   ├── customers.controller.js
│   │   ├── floors.controller.js
│   │   ├── kitchen.controller.js
│   │   ├── orders.controller.js
│   │   ├── payments.controller.js
│   │   ├── products.controller.js
│   │   ├── reports.controller.js
│   │   ├── selfOrder.controller.js
│   │   ├── sessions.controller.js
│   │   ├── tables.controller.js
│   │   └── users.controller.js
│   ├── middlewares/
│   │   ├── authMiddleware.js        # JWT verification
│   │   ├── roleMiddleware.js        # Role-based access guard
│   │   └── errorMiddleware.js       # Global error handler
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js                  # Roles: admin, cashier, kitchen
│   │   ├── Product.js               # With variants support
│   │   ├── Category.js
│   │   ├── Order.js                 # POS + self-order sources
│   │   ├── Payment.js               # Cash, Digital, UPI
│   │   ├── Session.js               # POS session (open/close)
│   │   ├── Floor.js
│   │   ├── Table.js
│   │   ├── Customer.js              # CRM-lite customer records
│   │   ├── PaymentMethod.js
│   │   ├── SelfOrderLink.js         # QR token-based self-ordering
│   │   ├── RefreshToken.js
│   │   ├── AccessTokenBlacklist.js
│   │   ├── PasswordResetOtp.js
│   │   ├── LoginAttempt.js
│   │   ├── BlockedIp.js
│   │   └── UserSession.js
│   ├── routes/                      # Express route definitions
│   ├── scripts/
│   │   └── seed.js                  # Database seeder script
│   ├── services/                    # Business logic services
│   ├── socket/
│   │   └── socketHandlers.js        # Socket.IO event handlers
│   ├── uploads/                     # Uploaded product images
│   ├── utils/                       # Utility helpers
│   ├── validations/                 # Express-validator schemas
│   ├── .env                         # Server environment variables
│   ├── server.js                    # Entry point (Express + Socket.IO)
│   ├── nodemon.json
│   └── package.json
│
├── .gitignore
└── README.md                        # ← You are here
```

---

## 📋 Prerequisites

Make sure you have the following installed:

| Tool | Version | Download |
|---|---|---|
| **Node.js** | v18+ (LTS recommended) | [nodejs.org](https://nodejs.org/) |
| **npm** | v9+ (comes with Node.js) | — |
| **MongoDB** | v6+ (local) or Atlas cloud | [mongodb.com](https://www.mongodb.com/try/download/community) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ladaninandan/odoo-final.git
cd odoo-final
```

### 2. Install Server Dependencies

```bash
cd server
npm install
```

### 3. Configure Server Environment Variables

Create a `.env` file inside the `server/` directory:

```env
PORT=5000

# MongoDB Connection (use local or Atlas)
MONGO_URI=mongodb://localhost:27017/odoo-final

# JWT Secrets (change these in production!)
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email OTP (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Twilio SMS OTP (optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

### 4. Install Client Dependencies

```bash
cd ../client
npm install
```

### 5. Configure Client Environment Variables

Create a `.env` file inside the `client/` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🌱 Seeding Demo Data

Run the seed script to populate the database with demo users, categories, products, floors, tables, and payment methods:

```bash
cd server
node scripts/seed.js
```

**Seed creates:**
- ✅ **12 demo users** — 4 Admins, 4 Cashiers, 4 Kitchen staff
- ✅ **5 categories** — Beverages, Snacks, Main Course, Desserts, Specials
- ✅ **24 products** — with prices, descriptions, tax rates, and variant options
- ✅ **3 floors** — Ground Floor, First Floor, Terrace (7 tables each, 21 total)
- ✅ **3 payment methods** — Cash, Digital, UPI

---

## ▶️ Running the Application

### Start the Backend Server

```bash
cd server
npx nodemon server.js
```

The server starts at **http://localhost:5000** (HTTP + Socket.IO, bound to `0.0.0.0` for LAN access).

### Start the Frontend Client

```bash
cd client
npm start
```

The React app starts at **http://localhost:3000**.

### Access on Mobile / LAN

Since the server binds to `0.0.0.0`, you can access the app from any device on your local network:

```
http://<your-local-ip>:3000   →  Frontend
http://<your-local-ip>:5000   →  Backend API
```

Update `REACT_APP_API_URL` in `client/.env` to your LAN IP if testing from a phone:
```env
REACT_APP_API_URL=http://192.168.x.x:5000/api
```

---

## 🔑 Demo Credentials

> **All demo accounts use the same password:** `password123`

### Admin Accounts
| Email | Password | Role |
|---|---|---|
| `admin1@cafe.com` | `password123` | Admin |
| `admin2@cafe.com` | `password123` | Admin |
| `admin3@cafe.com` | `password123` | Admin |
| `admin4@cafe.com` | `password123` | Admin |

### Cashier Accounts
| Email | Password | Role |
|---|---|---|
| `cashier1@cafe.com` | `password123` | Cashier |
| `cashier2@cafe.com` | `password123` | Cashier |
| `cashier3@cafe.com` | `password123` | Cashier |
| `cashier4@cafe.com` | `password123` | Cashier |

### Kitchen Staff Accounts
| Email | Password | Role |
|---|---|---|
| `kitchen1@cafe.com` | `password123` | Kitchen |
| `kitchen2@cafe.com` | `password123` | Kitchen |
| `kitchen3@cafe.com` | `password123` | Kitchen |
| `kitchen4@cafe.com` | `password123` | Kitchen |

---

## 🛡 Role-Based Access

Each role has access to specific modules. After login, users are automatically redirected to their home screen.

| Feature / Module | Admin | Cashier | Kitchen | Guest (No Login) |
|---|:---:|:---:|:---:|:---:|
| **Login / Register / Forgot Password** | ✅ | ✅ | ✅ | ✅ |
| **POS Floor Plan** | ✅ | ✅ | ❌ | ❌ |
| **POS Order Screen** | ✅ | ✅ | ❌ | ❌ |
| **POS Payment Screen** | ✅ | ✅ | ❌ | ❌ |
| **POS Session Open/Close** | ✅ | ✅ | ❌ | ❌ |
| **Generate Self-Order QR** | ✅ | ✅ | ❌ | ❌ |
| **Kitchen Display (KDS)** | ✅ | ❌ | ✅ | ❌ |
| **Admin Dashboard** | ✅ | ❌ | ❌ | ❌ |
| **Product Management** | ✅ | ❌ | ❌ | ❌ |
| **Category Management** | ✅ | ❌ | ❌ | ❌ |
| **Floor & Table Management** | ✅ | ❌ | ❌ | ❌ |
| **Staff Management** | ✅ | ❌ | ❌ | ❌ |
| **Customer Directory** | ✅ | ✅ | ❌ | ❌ |
| **Order History (Admin)** | ✅ | ❌ | ❌ | ❌ |
| **Session Manager** | ✅ | ❌ | ❌ | ❌ |
| **Reports & Analytics** | ✅ | ❌ | ❌ | ❌ |
| **POS Settings** | ✅ | ❌ | ❌ | ❌ |
| **Self-Order Menu** (via QR) | — | — | — | ✅ |
| **Customer Display** | — | — | — | ✅ |

### Auto-Redirect by Role
| Role | Home Page |
|---|---|
| Admin | `/admin` (Dashboard) |
| Cashier | `/pos/floor` (Floor Plan) |
| Kitchen | `/kitchen` (Kitchen Display) |

---

## 🌐 API Endpoints

All APIs are prefixed with `/api`.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login with email/phone + password |
| `POST` | `/api/auth/google` | Google OAuth login |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/logout` | Logout & blacklist token |
| `POST` | `/api/auth/request-otp` | Request OTP for password reset |
| `POST` | `/api/auth/reset-password` | Reset password with OTP |

### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | List all products |
| `GET` | `/api/products/:id` | Get product by ID |
| `POST` | `/api/products` | Create product (with image upload) |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete product |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/categories` | List all categories |
| `POST` | `/api/categories` | Create category |
| `PUT` | `/api/categories/:id` | Update category |
| `DELETE` | `/api/categories/:id` | Delete category |

### Floors & Tables
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/floors` | List all floors |
| `POST` | `/api/floors` | Create floor |
| `PUT` | `/api/floors/:id` | Update floor |
| `DELETE` | `/api/floors/:id` | Delete floor |
| `GET` | `/api/tables` | List all tables |
| `POST` | `/api/tables` | Create table |
| `PUT` | `/api/tables/:id` | Update table |
| `DELETE` | `/api/tables/:id` | Delete table |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/orders` | List all orders |
| `GET` | `/api/orders/:id` | Get order by ID |
| `POST` | `/api/orders` | Create a new order |
| `PUT` | `/api/orders/:id` | Update order |
| `DELETE` | `/api/orders/:id` | Cancel/delete order |

### Kitchen
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/kitchen` | Get active kitchen orders |
| `PUT` | `/api/kitchen/:id` | Update item/order kitchen status |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/payments` | List payments |
| `POST` | `/api/payments` | Create payment |
| `PUT` | `/api/payments/:id` | Confirm/update payment |

### Sessions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/sessions` | List all sessions |
| `POST` | `/api/sessions` | Open a new session |
| `PUT` | `/api/sessions/:id` | Close session |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports` | Get report data (filterable) |
| `GET` | `/api/reports/export/excel` | Download Excel report |
| `GET` | `/api/reports/export/pdf` | Download PDF report |

### Self-Order (Public — token-based)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/self-order/generate` | Generate self-order QR link |
| `GET` | `/api/self-order/:token/menu` | Get menu for self-order |
| `POST` | `/api/self-order/:token/order` | Place self-order |
| `GET` | `/api/self-order/:token/status` | Get order status |

### Users (Admin)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List all staff users |
| `PUT` | `/api/users/:id` | Update user role/status |

### Customers
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/customers` | List all customers |
| `GET` | `/api/customers/:id` | Get customer by ID |
| `POST` | `/api/customers` | Create customer |
| `PUT` | `/api/customers/:id` | Update customer |
| `DELETE` | `/api/customers/:id` | Delete customer |

---

## ⚡ Real-Time Features (Socket.IO)

The application uses **Socket.IO** for real-time communication across three rooms:

| Room | Participants | Purpose |
|---|---|---|
| `pos` | Cashier, Admin | Receive kitchen updates, payment confirmations, table status |
| `kitchen` | Kitchen staff | Receive new orders from POS & self-order |
| `customer` | Customer display, Self-order status page | Order status updates, payment confirmations |

### Socket Events

| Event | Direction | Description |
|---|---|---|
| `join` | Client → Server | Join a room (`pos`, `kitchen`, `customer`) |
| `order:send_to_kitchen` | POS → Kitchen | New order sent to kitchen |
| `order:new` | Server → Kitchen | Kitchen receives new order |
| `kitchen:update_stage` | Kitchen → POS + Customer | Item stage updated |
| `kitchen:mark_item` | Kitchen → POS | Individual item marked as prepared |
| `table:update_status` | Any → POS | Table status changed |
| `payment:confirm` | POS → Customer | Payment confirmed |
| `session:close` | Admin → POS | Session closed notification |

---

## ⚙️ Environment Variables

### Server (`server/.env`)

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default: `5000`) | No |
| `MONGO_URI` | MongoDB connection string | **Yes** |
| `JWT_ACCESS_SECRET` | Secret for access tokens | **Yes** |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | **Yes** |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | For Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | For Google login |
| `EMAIL_USER` | Gmail address for sending OTPs | For email OTP |
| `EMAIL_PASS` | Gmail app password | For email OTP |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | For SMS OTP |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | For SMS OTP |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | For SMS OTP |
| `API_RATE_LIMIT_MAX` | Max requests per 15 min per IP | No (default: 5000 dev / 800 prod) |
| `CORS_ORIGINS` | Comma-separated allowed origins | No (auto in dev) |

### Client (`client/.env`)

| Variable | Description | Required |
|---|---|---|
| `REACT_APP_API_URL` | Backend API base URL | **Yes** |

---

## 🖥 Screenshots / Modules

### Authentication
- **Login Page** — Email/phone + password, Google OAuth, password visibility toggle
- **Register Page** — Full registration with password strength, eye toggle
- **Forgot Password** — Email or SMS OTP delivery, 6-digit code input, password reset with eye toggle

### POS Terminal
- **Floor Plan** — Interactive grid of tables colored by status, click to open order
- **Order Screen** — Category sidebar, product grid, cart panel with quantity controls, variant selection, notes
- **Payment Screen** — Cash / Digital / UPI options, QR code display for UPI, receipt generation

### Kitchen Display
- **Order Cards** — Timer, table number, item list with individual status toggles
- **Audio Notification** — Bell sound on new order arrival

### Admin Panel
- **Dashboard** — Revenue cards, order charts, session overview
- **Product & Category CRUD** — Image upload, variant configuration, tax settings
- **Reports** — Date range filters, bar/line charts, Excel & PDF export

### Self-Ordering
- **Mobile Menu** — Responsive product browsing with images
- **Order Tracking** — Live status page with real-time updates

---

## 📄 License

This project was developed for the **Odoo Combat Hackathon** submission.

---

## 👥 Team

Developed with ❤️ for modern restaurant operations.

---

> **Note:** For production deployment, make sure to:
> 1. Use strong, unique JWT secrets
> 2. Configure MongoDB Atlas instead of local MongoDB
> 3. Set `NODE_ENV=production`
> 4. Configure proper CORS origins
> 5. Use HTTPS with a reverse proxy (Nginx)
> 6. Secure all `.env` files and never commit them to version control

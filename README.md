# GymFlow — Real-Time Gym Occupancy & Crowd Prediction

GymFlow is a modern full-stack gym occupancy monitoring, capacity management, and crowd prediction web application. It helps gym members check live crowd density, avoid peak rush hours, inspect hourly attendance forecasts, track personal workout visits, and enables gym administrators to manage members and facility capacity.

---

## ⚡ Features

- 🔒 **Mandatory Sign-In Auth Gate**:
  - The application is protected by a strict authentication barrier; the dashboard and features only open once a user is logged in.
  - Zero-flicker splash screen during session verification.
  - One-click **Admin Demo** and **Member Demo** quick login buttons.
- 🏋️‍♂️ **Live Occupancy Monitoring**:
  - Real-time headcount derived from checked-in members against dynamically scalable capacity (default: 30).
  - Occupancy percentage progress gauge and automated crowd status badges.
- ⏱️ **Occupancy Thresholds & Estimated Wait Times**:
  - 🟢 **LOW Crowd** (`< 40%`): Estimated wait `0–5 min`
  - ⚪ **MODERATE Crowd** (`40% – 74%`): Estimated wait `10 min`
  - 🔴 **HIGH Crowd** (`≥ 75%`): Estimated wait `15–25 min`
- 👥 **Dual Check-In System**:
  - **Member Self Check-In**: Authenticated gym members can check in/out with 1-click from the dashboard.
  - **Admin Master Check-In**: Gym staff/owners can toggle check-ins for any member in the directory.
- 👑 **Admin Members Directory & Indian Plan Assignment**:
  - Gym administrators can register and issue accounts to members directly with subscription plans:
    - **Basic (₹999 / mo)**: General gym floor access, standard locker, crowd tracker.
    - **Pro Athlete (₹1,999 / mo)**: Gym floor + cardio & sauna, peak hours priority, visit logs.
    - **VIP Elite (₹3,499 / mo)**: Unlimited 24/7 all-access, dedicated personal trainer.
  - Search, filter by plan, edit credentials, and toggle check-in states.
- 📊 **Crowd Forecast & Attendance Curve (`/schedule`)**:
  - AI-assisted hourly volume curve with time-of-day filters (Morning 6–11, Afternoon 12–4, Evening 5–10).
- 📜 **Visit History & Workout Logs (`/history`)**:
  - Database-synced visit history, monthly session counts, duration analytics, estimated calories, and consistency streaks.
- ⚙️ **Dynamic Capacity Scaling**:
  - Gym owners can adjust facility capacity (e.g. 30, 60, 100, 300) with instant recalculation of percentage thresholds.

---

## 🏗️ Monorepo Architecture

```
GymFlow/
├── client/                 # React 18 + Vite Frontend Application
│   ├── src/
│   │   ├── components/     # UI Components (Dashboard, Prediction, History, Auth, Admin, UI)
│   │   ├── hooks/          # Custom hooks (useOccupancy)
│   │   ├── lib/            # Better Auth client & utils
│   │   ├── pages/          # Pages (HomePage, SchedulePage, HistoryPage, MembersPage, AuthPage)
│   │   ├── types/          # TypeScript definitions (occupancy, plans)
│   │   └── App.tsx         # Main application root with Auth Gate
│   ├── package.json
│   └── vite.config.ts
│
├── server/                 # Express + Bun + Better Auth API Backend
│   ├── prisma/             # Prisma schema & SQLite database
│   │   ├── schema.prisma
│   │   └── dev.db          # Zero-config local database
│   ├── src/
│   │   ├── lib/            # Better Auth instance, Express middleware & Prisma client
│   │   ├── scripts/        # Admin provisioning script (create-admin.ts)
│   │   └── index.ts        # Express server entrypoint (Port 3000)
│   ├── .env.example
│   └── package.json
│
├── core/                   # Shared TypeScript definitions & Zod schemas
│   ├── src/index.ts
│   └── package.json
│
├── index.html              # Standalone vanilla SPA demo with Auth Overlay
├── style.css               # Vanilla SPA styling system
├── MEMORY.md               # Architecture decisions & system memory bank
└── package.json            # Monorepo workspace root
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **[Bun](https://bun.sh/)** `v1.1+` (recommended) or **Node.js** `v18+` / `npm`

### 2. Install Dependencies
```bash
bun install
```

### 3. Initialize Database & Seed Admin
```bash
# Navigate to server and sync Prisma schema
cd server
bunx prisma db push

# Provision the default admin user
bun run create-admin
```

### 4. Start Development Servers

Run the React frontend and Express backend concurrently:

```bash
# Terminal 1: Start React Frontend (http://localhost:5173)
bun run dev

# Terminal 2: Start Backend Server (http://localhost:3000)
bun run dev:server
```

---

## 🔑 Default Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gymflow.com` | `Admin123456!` | Full access + Register Members + Capacity Manager |
| **Member** | `member@gymflow.com` | `Member123456!` | Dashboard + Self Check-In + Forecasts + Visit Logs |

> *To provision a custom admin user, run:*
> `bun --filter @gymflow/server create-admin --email=user@example.com --password=YourPassword123! --name="Custom Admin"`

---

## ⚙️ Environment Variables

A template is provided at [`server/.env.example`](file:///D:/Projects/GymFlow/server/.env.example):

```env
PORT=3000
CLIENT_URL=http://localhost:5173
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=gymflow-super-secret-key-min-32-chars-long-security
DATABASE_URL="file:./dev.db"

ADMIN_EMAIL=admin@gymflow.com
ADMIN_PASSWORD=Admin123456!
ADMIN_NAME="Gym Admin"
```

---

## 📦 Scripts Overview

| Command | Description |
| :--- | :--- |
| `bun run dev` | Starts the React client on `http://localhost:5173` |
| `bun run dev:server` | Starts the backend server on `http://localhost:3000` |
| `bun run build` | Type-checks and builds the frontend production bundle |
| `bun --filter @gymflow/server create-admin` | Seeds/provisions an admin user in the database |

---

## 🎨 Design System Standards

- **Typography**: [Inter](https://fonts.google.com/specimen/Inter)
- **Canvas Background**: `#f7f7f7`
- **Primary Text / Accents**: `#171717`
- **Card Background**: `#ffffff` (`1px solid #dedede`)
- **Card Radii**: `14px` - `16px` | **Buttons**: `9px`

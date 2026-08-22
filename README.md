# GymFlow — Real-Time Gym Occupancy & Crowd Prediction

GymFlow is a modern, real-time gym occupancy monitoring and crowd prediction application. It helps gym members avoid peak rush hours, check live crowd density, view estimated wait times, review hourly attendance forecasts, and track personal visit history.

---

## ⚡ Features

- **Live Occupancy Tracker**: Real-time crowd gauge displaying current headcount and occupancy percentage (Capacity: 60).
- **Dynamic Crowd Statuses & Wait Times**:
  - 🟢 **LOW Crowd** (`< 40%`): Wait time `0–5 min`
  - ⚪ **MODERATE Crowd** (`40% – 74%`): Wait time `10 min`
  - 🔴 **HIGH Crowd** (`≥ 75%`): Wait time `15–25 min`
- **Live Simulator Controls**: Interactive manual controls and a 5-second automatic fluctuation toggle for live demos and simulation.
- **Best Time Recommendation**: Suggests optimal low-traffic workout windows (e.g. 6:00 AM – 8:00 AM).
- **Hourly Prediction Timeline**: Interactive hourly schedule predicting traffic throughout the day.
- **Visit History Activity**: Logs recent gym check-ins, check-outs, and workout durations.
- **Role-Based Authentication (Better Auth)**:
  - **Member Authentication**: Secure email & password login.
  - **Admin Control**: Gym admins can register and issue accounts directly to new members.

---

## 🏗️ Monorepo Architecture

```
GymFlow/
├── client/                 # React 18 + Vite Frontend Application
│   ├── src/
│   │   ├── components/     # UI Components (Dashboard, Prediction, History, Auth, Admin)
│   │   ├── hooks/          # Custom hooks (useOccupancy)
│   │   ├── lib/            # Better Auth client & utilities
│   │   └── App.tsx         # Main application dashboard
│   ├── package.json
│   └── vite.config.ts
│
├── server/                 # Express + Bun + Better Auth API Backend
│   ├── prisma/             # Prisma schema & SQLite / PostgreSQL migrations
│   │   ├── schema.prisma
│   │   └── dev.db          # Zero-config local database
│   ├── src/
│   │   ├── lib/            # Better Auth instance & Prisma client
│   │   ├── scripts/        # Admin provisioning script (create-admin.ts)
│   │   └── index.ts        # Express server entrypoint (Port 3000)
│   ├── .env.example
│   └── package.json
│
├── core/                   # Shared TypeScript definitions & Zod schemas
│   ├── src/index.ts
│   └── package.json
│
├── index.html              # Standalone vanilla SPA demo
├── style.css               # Vanilla SPA styling system
├── MEMORY.md               # Architecture decisions & memory bank
└── package.json            # Monorepo workspace root
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **[Bun](https://bun.sh/)** `v1.1+` (recommended) or **Node.js** `v18+` / `npm`

### 2. Install Dependencies
From the repository root:
```bash
bun install
```

### 3. Initialize Database & Seed Admin
The backend includes a zero-config SQLite database (`server/prisma/dev.db`):

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
| **Admin** | `admin@gymflow.com` | `Admin123456!` | Full access + Register New Members |

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
- **Card Radii**: `14px` - `15px` | **Buttons**: `9px`

# Chamkani Gathering Hall

A hall booking and event management platform built with Next.js 16, Supabase, and Tailwind CSS.

## Project Structure

The project is cleanly split into two dedicated directories:

```
Gathering-Hall/
├── frontend/             # Next.js 16 web application, UI components, and pages
│   ├── public/           # Static public assets
│   ├── src/
│   │   ├── app/          # App Router pages and layouts
│   │   ├── components/   # UI components
│   │   ├── lib/          # Server actions, Supabase clients & business logic
│   │   └── middleware.ts # Route guard middleware
│   ├── package.json      # Frontend package configuration
│   └── README.md         # Frontend documentation
│
├── backend/              # Backend API server & Supabase database management
│   ├── src/
│   │   └── server.ts     # Backend HTTP API server (Port 5000)
│   ├── scripts/          # Admin initialization and backend scripts
│   ├── supabase/         # PostgreSQL schema (schema.sql), RLS rules, and triggers
│   ├── package.json      # Backend package configuration
│   └── README.md         # Backend server and setup documentation
│
├── package.json          # Root workspace configuration
└── README.md             # Project overview
```

## Quick Start

### 1. Database Setup
Follow the instructions in [`backend/README.md`](./backend/README.md) to apply `backend/supabase/schema.sql` to your Supabase project.

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` at the root (or in `frontend/` and `backend/`):
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials:
* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY`

### 3. Bootstrap Admin User
Create the initial administrator account:
```bash
npm run create-admin -- --email admin@hall.com --name "Hall Manager" --password "your-strong-password"
```

### 4. Running the Applications

#### Running from Root:
```bash
# Start Frontend (http://localhost:3000)
npm run dev

# Start Backend API Server (http://localhost:5000)
npm run start:backend
# or in development mode
npm run dev:backend

# Run unit tests
npm test

# Build for production
npm run build
```

#### Running Directly from Folders:
* **Frontend**:
  ```bash
  cd frontend
  npm run dev
  ```
* **Backend**:
  ```bash
  cd backend
  npm start
  # or
  npm run dev
  ```

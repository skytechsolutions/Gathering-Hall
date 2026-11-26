# Frontend - Chamkani Gathering Hall

This directory contains the user interface and web application for Chamkani Gathering Hall, built with Next.js 16 (App Router), React 19, and Tailwind CSS.

## Structure

```
frontend/
├── public/                # Static assets (icons, SVGs)
├── src/
│   ├── app/               # Next.js App Router (pages, layouts, route handlers)
│   ├── components/        # Reusable UI components (calendar, nav, forms, cards)
│   ├── lib/               # Server actions, Supabase clients, auth & booking logic
│   └── middleware.ts      # Auth route guard and session middleware
├── .env.example           # Frontend environment variables template
├── next.config.ts         # Next.js configuration
├── package.json           # Frontend dependencies & scripts
├── postcss.config.mjs     # PostCSS configuration for Tailwind
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vitest test runner configuration
```

## Getting Started

1. **Environment Variables**:
   Create a `.env.local` in `frontend/` (or at the root):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

3. **Running Tests**:
   ```bash
   npm test
   ```

4. **Production Build**:
   ```bash
   npm run build
   npm run start
   ```

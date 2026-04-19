# Habit Tracker

A focused full-stack habit tracker MVP for exactly two habit types:

- `action` habits: log `done` or `not_done`
- `measurable` habits: log a numeric value with a unit like `kg`, `₹`, or `liters`

The project is intentionally scoped for a clean foundation that can grow later into auth, reminders, reports, dashboards, and analytics.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, React Hook Form, Zod
- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose, Zod
- Tooling: ESLint, Prettier, npm workspaces

## Project structure

```text
habit-tracker/
├── client/                  # React frontend
│   ├── src/
│   │   ├── app/             # app shell and global styles
│   │   ├── components/ui/   # reusable UI building blocks
│   │   ├── features/        # feature-based hooks, services, forms, cards
│   │   ├── pages/           # routed pages
│   │   ├── providers/       # React Query provider
│   │   ├── router/          # app router
│   │   ├── services/        # shared API client
│   │   └── shared/          # shared types and helpers
│   └── .env.example
├── server/                  # Express API
│   ├── src/
│   │   ├── config/          # env and database setup
│   │   ├── middleware/      # validation, error handling, 404 handling
│   │   ├── modules/
│   │   │   ├── habits/      # habit model, validation, service, controller, routes
│   │   │   └── habitLogs/   # habit log model, validation, service, controller, routes
│   │   ├── utils/           # app utilities
│   │   ├── app.ts           # express app
│   │   ├── server.ts        # runtime entry
│   │   └── seed.ts          # seed script
│   └── .env.example
├── eslint.config.mjs
├── package.json
└── tsconfig.base.json
```

## Setup

### 1. Install dependencies

```bash
npm install
```

If PowerShell blocks `npm` scripts in your environment, use:

```bash
npm.cmd install
```

### 2. Configure environment variables

Create the backend env file:

```bash
cp server/.env.example server/.env
```

Create the frontend env file:

```bash
cp client/.env.example client/.env
```

On Windows PowerShell, the equivalent is:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

### 3. Start MongoDB

Make sure MongoDB is running locally and matches `server/.env`.

Default connection:

```text
mongodb://127.0.0.1:27017/habit-tracker
```

## Run the app

### Run backend

```bash
npm run dev:server
```

### Run frontend

```bash
npm run dev:client
```

### Run both together

```bash
npm run dev
```

Frontend default URL:

```text
http://localhost:5173
```

Backend default URL:

```text
http://localhost:4000
```

## Seed sample data

The seed script creates:

- Quit sugar
- Weight
- Expenses

It also inserts recent sample logs so the UI has meaningful stats and states immediately.

Run:

```bash
npm run seed
```

This is optional. For production deployment, you can skip the seed step entirely.

## Deploy

### Frontend on Netlify

This repo now includes a root `netlify.toml` for the React SPA build and client-side route fallback.

Set this environment variable in Netlify:

```text
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
```

Notes:

- The publish directory is `client/dist`
- React Router routes are handled with a rewrite to `/index.html`
- You do not need seed data for production unless you want sample habits

### Backend on Render

This repo now includes `render.yaml` for a free Render web service.

Set these environment variables in Render:

```text
MONGODB_URI=your-mongodb-connection-string
CLIENT_ORIGIN=https://your-netlify-site.netlify.app
```

If you later add a custom frontend domain or want preview URLs too, `CLIENT_ORIGIN` can be a comma-separated list:

```text
CLIENT_ORIGIN=https://your-site.netlify.app,https://your-custom-domain.com
```

Render health check path:

```text
/api/health
```

Recommended deploy order:

1. Deploy the backend to Render
2. Copy the Render service URL
3. Set `VITE_API_BASE_URL` in Netlify
4. Deploy the frontend to Netlify
5. Update Render `CLIENT_ORIGIN` to your final Netlify URL if needed

## Other scripts

```bash
npm run build
npm run lint
npm run format
```

## API summary

### Habits

- `GET /api/habits`
- `POST /api/habits`
- `GET /api/habits/:id`
- `PATCH /api/habits/:id`
- `DELETE /api/habits/:id`
- `GET /api/habits/:id/stats`

### Logs

- `GET /api/habits/:id/logs`
- `POST /api/habits/:id/logs`
- `PATCH /api/habits/:id/logs/:logId`
- `GET /api/logs/today`

## Notes

- Single-user only
- No auth yet
- No reminders, workers, dashboards, or advanced analytics yet
- Dates are stored as `YYYY-MM-DD`
- Habit logs are unique per `habitId + date`
- Edit mode keeps habit type locked in the UI to avoid breaking historical data

# Habit Tracker

A full-stack personal productivity app built around habit tracking, with three additional feature modules.

**Habits** — two types:

- `action` habits: log `done` or `not_done`
- `measurable` habits: log a numeric value with a unit like `kg`, `₹`, or `liters`

**Job Tracker** — applications, referrals, planner, interview prep, wishlist, notes, resumes, calendar, resources, analytics

**DSA Prep** — 500 seeded problems with per-user solved tracking and an algorithm visualizer

**Expenses** — expense log plus per-category budgets

Auth is JWT-based; every feature route is scoped to the logged-in user.

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
│   │   ├── features/        # habits, logs, stats, job-tracker, dsa-prep, expenses
│   │   ├── pages/           # routed pages (home, auth, habit CRUD, settings)
│   │   ├── providers/       # React Query provider
│   │   ├── router/          # app router
│   │   ├── services/        # shared API client
│   │   ├── stores/          # Zustand stores
│   │   └── shared/          # shared types and helpers
│   └── .env.example
├── server/                  # Express API
│   ├── src/
│   │   ├── config/          # env and database setup
│   │   ├── middleware/      # auth, validation, error handling, 404 handling
│   │   ├── modules/
│   │   │   ├── auth/        # register, login, me
│   │   │   ├── habits/      # habit model, validation, service, controller, routes
│   │   │   ├── habitLogs/   # habit log model, validation, service, controller, routes
│   │   │   ├── jobTracker/  # single job-tracker profile document per user
│   │   │   ├── dsaPrep/     # problem catalog + solved tracking
│   │   │   └── expenses/    # expenses and budgets
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

The seed script wipes habits, habit logs, and DSA problems, then creates:

- A demo user (if none exists)
- Sample habits (Quit sugar, Weight, Expenses) with recent logs so stats render immediately
- The 500-problem DSA catalog

Run:

```bash
npm run seed
```

The DSA Prep module needs the problem catalog, so run this at least once even in production. The sample habits and logs are only there for demo purposes.

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
JWT_SECRET=a-long-random-secret
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

Everything except `/api/health` and the register/login routes requires a bearer token.

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Habits

- `GET /api/habits`
- `POST /api/habits`
- `GET /api/habits/archived`
- `GET /api/habits/:id`
- `PATCH /api/habits/:id`
- `PATCH /api/habits/:id/archive`
- `DELETE /api/habits/:id`
- `GET /api/habits/:id/stats`

### Logs

- `GET /api/habits/:id/logs`
- `POST /api/habits/:id/logs`
- `PATCH /api/habits/:id/logs/:logId`
- `GET /api/logs/today`

### Job Tracker

- `GET /api/job-tracker`
- `PUT /api/job-tracker`

### DSA Prep

- `GET /api/dsa-prep`
- `GET /api/dsa-prep/problems`
- `GET /api/dsa-prep/problems/:id`
- `POST /api/dsa-prep/solve`
- `POST /api/dsa-prep/unsolve`

### Expenses

- `GET /api/expenses`
- `POST /api/expenses`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`
- `GET /api/expenses/budgets`
- `POST /api/expenses/budgets`

## Notes

- JWT auth; all data is scoped per user
- No reminders or background workers yet
- The job tracker stores one profile document per user and saves it whole on `PUT`
- Dates are stored as `YYYY-MM-DD`
- Habit logs are unique per `habitId + date`
- Edit mode keeps habit type locked in the UI to avoid breaking historical data

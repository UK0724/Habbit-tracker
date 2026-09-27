# Habit Tracker

A full-stack personal productivity app built around habit tracking, with three additional feature modules.

**Habits** — two types:

- `action` habits: log `done` or `not_done`
- `measurable` habits: log a numeric value with a unit like `kg`, `₹`, or `liters`

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

## Update the DSA catalog

Run `npm run seed` to upsert catalog problems by their stable numeric ID. This command preserves accounts, habits, logs, and solved progress, and is safe to repeat. It does not create demo accounts or sample habits.

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
- Run the catalog seed only if you use the DSA module; it does not create sample habits.

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
- `DELETE /api/habits/:id/logs/:logId` — remove an entry, including undoing a skip
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
- Web push reminders run every minute using each account’s timezone; configure VAPID keys to enable delivery. Use an always-running server for reliable reminders.
- The job tracker stores one profile document per user and saves it whole on `PUT`
- Dates are stored as `YYYY-MM-DD`
- Habit logs are unique per `habitId + date`
- Edit mode keeps habit type locked in the UI to avoid breaking historical data

## Release checks and mobile setup

- `npm run check`: lint, web/API build, unit checks, isolated database regressions, and mobile TypeScript checks.
- `npm --workspace mobile run check:achievements`: verifies the native achievement queue, duplicate-event protection, details mode, and account reset. Native habit saves compare a fresh before/after achievement list; opening an existing badge only shows details.
- `npm --workspace client run check:worker`: checks cache migration, JavaScript/CSS MIME validation, cached asset reuse, API/download exclusions, and offline shell recovery.
- Web preview rebuilds preserve prior hashed assets so open tabs can finish loading their routes. Clean `client/dist` only when the preview is stopped and old tabs can be reloaded; CI builds from a clean checkout. Preview and Netlify return 404 for missing assets instead of rewriting them to the app HTML. Route failures offer a manual reload without clearing sign-in or saved preferences.
- `npm run test:e2e`: builds the web app, then runs nine desktop scenarios, seven phone-sized Chromium scenarios, and two iPhone-viewport WebKit dialog regressions against that build, using a disposable MongoDB database on API port 4100 and Vite preview on port 5175. Accounts are isolated per scenario. Install browsers first with `npx playwright install chromium webkit`. Failure traces are retained in `test-results/`.
- For a web preview on the same Wi-Fi, ensure MongoDB is running, set `CLIENT_ORIGIN=http://YOUR_LAN_IP:4173` in `server/.env`, then run `npm run preview:lan`. Open `http://YOUR_LAN_IP:4173` on the phone. The preview proxies `/api` to the local server on port 4000; the Android APK calls port 4000 directly. Allow ports 4173 and 4000 on the private network firewall, and keep this computer awake while testing. This preview is not a public deployment.
- `npm --workspace mobile run export:check`: Android and iOS JavaScript/Hermes bundle exports. Signed native builds and physical-device tests are separate release steps.
- For native Android testing on the same Wi-Fi, set `EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:4000/api` in `mobile/.env.local`, run `npm --workspace mobile run start -- --lan`, and open the QR code in the SDK 52 version of Expo Go. The API must also be reachable from the phone on that LAN address. This uses the local development API and is not an installable release build.
- Copy `mobile/.env.example` and set `EXPO_PUBLIC_API_URL` to your HTTPS API URL ending in `/api` before building for distribution. Android emulator development defaults to `10.0.2.2`; physical devices need a reachable LAN API URL during development.
- `mobile/eas.json` includes an Android `preview` profile for a directly installable APK on the same Wi-Fi as the local API. This internal build embeds the current LAN address, so change it if your IP changes. Its HTTP exception is limited to private LAN addresses and is absent from the `production` app bundle profile, which requires a deployed HTTPS API URL.
- Windows can also build a signed APK locally with `mobile/scripts/build-android-local.ps1 -SdkPath PATH_TO_ANDROID_SDK -JavaPath PATH_TO_JDK_17`. Install Android platform 35, build tools 35.0.0, NDK 26.1.10909125, and CMake 3.22.1 first. Download the existing Android signing credentials through `eas credentials` into `mobile/credentials.json`; the script reads the ignored credential file without putting passwords on the command line. Its default preview profile uses the same LAN settings as EAS. The APK is written to `mobile/android/app/build/outputs/apk/release/app-release.apk`.
- The local build uses an absolute Expo entry path for the workspace layout, reuses Metro's cache, and verifies that every packaged CPU architecture includes the React Native, Hermes, and Expo native libraries. To check an APK independently, run `mobile/scripts/verify-apk.ps1 -ApkPath PATH_TO_APK`.
- Web and native registration save the device timezone for new accounts. Sign-in fills it for older accounts that have never chosen one; an explicit timezone choice in Settings remains authoritative. The Android app schedules local habit reminders after notification permission is granted and removes them when the habit is changed, archived, deleted, or the account signs out.
- Mobile scripts explicitly use the mobile workspace’s Expo version to avoid invoking a different hoisted Expo CLI.
- Root development dependencies pin the Expo 52 / React Native 0.76.9 / React 18 build tools together, including the matching Hermes compiler. The web app uses its own React version; Vite deduplicates shared imports to that instance.
- Expo Router 4 uses the named `parse` and `stringify` exports from `query-string` 7. Keep the root and mobile pins aligned: version 9 exposes a default-only API and causes a Hermes launch crash during route serialization. `npm --workspace mobile run check:native` verifies this contract as well as native dependency singleton resolution.

Production requires `NODE_ENV=production`, a random `JWT_SECRET` of at least 32 characters, exact HTTPS `CLIENT_ORIGIN` entries, and the correct `TRUST_PROXY_HOPS` for your hosting topology (Render configuration uses 1). Authentication tokens expire after one day. There is no refresh-token or password-reset flow yet.

The Render blueprint builds from the repository root because the API uses the root workspace lockfile. On Netlify, set `VITE_API_BASE_URL` to the deployed HTTPS API URL ending in `/api`; otherwise the production web build sends API requests to the Netlify origin.

Mock ad rewards are disabled on production servers and hidden in production web builds until a real server-verified rewarded-ad integration is implemented. Streak freezes purchased with gems protect future missed days.

Before launch, configure managed database backups, perform a restore drill against a separate database, and connect uptime/error alerts. The health endpoint returns 503 while the database is disconnected. Authentication throttling currently uses process-local counters; configure a shared rate-limit store before scaling to multiple API instances. Automated checks do not replace real-device, load, or deployed-environment testing.

The web and API production dependency audits were clean during the September 2026 hardening pass. The workspace overrides resolve the transitive `tar`, PostCSS, and XML parser advisories. Metro 0.81.5 also needs `patches/metro+0.81.5.patch` at install time to use the patched `image-size` 2 buffer API; keep the root `postinstall` step enabled in CI and EAS builds. The URL decoder also has a CommonJS-compatible security backport in `patches/decode-uri-component+0.2.2.patch`; `check:native` checks malformed-input decoding, and the local Android release script tracks workspace patches and verifies that the bundle contains the patched decoder. Audit tools still flag the original version number, so consult `docs/release-readiness.md` for mitigation evidence and remaining findings. `npm audit --omit=dev --workspace mobile` currently reports no high or critical advisories, but moderate Expo toolchain advisories and high desktop toolchain advisories remain. Review a fresh `npm audit` and migrate those toolchains before distribution. Reward claims and balance updates use atomic document operations; log, profile, and event writes are not a single cross-document transaction, so crash recovery and reconciliation still need consideration before treating XP as a financially valuable balance.

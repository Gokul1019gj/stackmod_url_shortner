# LinkZap — URL Shortener

A full-stack URL shortener with analytics, rate limiting, and authentication.

## 📁 Project Structure

```
url-shortener/
├── backend/          # Express + TypeScript REST API
│   ├── prisma/       # Prisma migrations & schema
│   ├── src/
│   │   ├── config/       # App config (env vars)
│   │   ├── middleware/   # Auth, sliding-window rate limiter
│   │   ├── repositories/ # SQLite data access layer
│   │   ├── routes/       # API route handlers
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helpers (shortcode gen)
│   ├── tests/            # Jest integration tests
│   ├── .env              # Environment variables
│   ├── nodemon.json      # Dev watcher config
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/         # React + Vite SPA
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks (useAuth)
│   │   ├── pages/        # Route pages (Home, Dashboard, Analytics, Auth)
│   │   ├── services/     # API client (api.ts)
│   │   └── types/        # Shared TypeScript interfaces
│   ├── vite.config.ts
│   └── package.json
│
└── README.md
```

## 🚀 Running Locally

Open **two terminals**:

### Terminal 1 — Backend (port 8081)

```bash
cd backend
npm run dev
```

### Terminal 2 — Frontend (port 5173)

```bash
cd frontend
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## 🔑 API Endpoints

| Method | Route                       | Auth     | Description                    |
| ------ | --------------------------- | -------- | ------------------------------ |
| POST   | `/api/auth/signup`          | —        | Register a new user            |
| POST   | `/api/auth/login`           | —        | Login                          |
| POST   | `/api/shorten`              | Optional | Shorten a URL (Rate Limited)   |
| GET    | `/api/urls`                 | ✅       | List your URLs                 |
| DELETE | `/api/urls/:code`           | ✅       | Delete a URL                   |
| GET    | `/api/urls/:code/stats`     | —        | Per-URL analytics (Q1)         |
| GET    | `/api/analytics/top-urls`   | ✅       | Top 10 URLs filterable by date |
| GET    | `/api/analytics/trend`      | ✅       | Daily click trend filterable   |
| GET    | `/api/analytics/bot-report` | ✅       | Bot detection report (Q4)      |
| GET    | `/:short_code`              | —        | Redirect to original URL       |

## 🧪 Running Tests

```bash
cd backend
npm test
```

## ⚙️ Environment Variables (`backend/.env`)

| Variable       | Default                 | Description             |
| -------------- | ----------------------- | ----------------------- |
| `PORT`         | `8081`                  | Server port             |
| `NODE_ENV`     | `development`           | Environment             |
| `JWT_SECRET`   | —                       | Secret for signing JWTs |
| `DATABASE_URL` | `file:./data.db`        | Prisma database path    |
| `DB_PATH`      | `data.db`               | SQLite repository path  |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed CORS origins    |

## ⚙️ Environment Variables (`frontend/.env`)

| Variable       | Default                 | Description          |
| -------------- | ----------------------- | -------------------- |
| `VITE_API_URL` | `http://localhost:8081` | Backend API base URL |


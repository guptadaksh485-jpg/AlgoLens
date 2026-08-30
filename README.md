# AlgoLens

Competitive programming analytics platform. Tracks Codeforces contests and problem-solving
progress, with Gemini-generated coaching feedback (contest reviews, progress analysis,
weekly practice plans, targeted problem recommendations).

## Tech Stack

**Frontend:** React (Vite), Tailwind CSS, React Router, Axios, Recharts
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Redis
**External:** Codeforces API, Google Gemini API
**Testing:** Jest, Supertest, mongodb-memory-server

## Running Locally

### Docker Compose

```bash
cp server/.env.example .env   # fill in GEMINI_API_KEY at minimum
docker compose up --build
```

Starts MongoDB, Redis, the API (port 5000), and the frontend (port 5173).

### Manual

```bash
cd server && npm install && cp .env.example .env && npm run dev   # http://localhost:5000
cd client && npm install && cp .env.example .env && npm run dev   # http://localhost:5173
```

## Environment Variables

**server/.env**
- `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY` — required
- `GEMINI_MODEL` — defaults to `gemini-3.7-flash`
- `REDIS_URL` — optional; caching/rate limiting are skipped (not broken) if unset
- `CLIENT_URL` — used for CORS

**client/.env**
- `VITE_API_URL` — base URL of the backend API

## How It Works

Codeforces sync (Profile → "Sync Codeforces Data") fetches `user.info`, `user.status`, and
`user.rating`, and upserts submissions and contest history into MongoDB. Topic-wise,
difficulty-wise, and Strong/Weak Topics analytics are computed from that stored data with
plain Mongo aggregations — one source of truth, no AI involved in the numbers. Problem
recommendations pick real unsolved problems from the CF problemset; Gemini only writes the
explanation for each pick. Sync is rate-limited (Redis) and switching Codeforces handles
clears the previous handle's synced data first.

## Testing

```bash
cd server && npm test
```

Pure-logic suites (cache, CF error classification, streak calculator, Gemini JSON
parsing/retry) run anywhere. The DB-backed suites use `mongodb-memory-server`, which
downloads a Mongo binary on first run and needs outbound internet access.

`.github/workflows/ci.yml` runs the server tests and client build on every push/PR to `main`.

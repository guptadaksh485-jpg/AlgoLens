# AlgoLens

An AI-powered competitive programming analytics platform. Track contests, monitor topic-wise
problem-solving progress, and get Gemini-generated coaching feedback — contest reviews, an
overall progress analysis, a weekly practice plan, and targeted problem recommendations.

## Tech Stack

**Frontend:** React (Vite), Tailwind CSS, React Router, Axios, Recharts
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT
**AI:** Google Gemini API
**Deployment:** Vercel (frontend), Render (backend), MongoDB Atlas (database)

## Project Structure

```
algolens/
├── client/   # React frontend
└── server/   # Express API
```

## Running Locally

### 1. Backend

```bash
cd server
npm install
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run dev
```

The API runs on `http://localhost:5000` by default.

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env   # VITE_API_URL should point at your backend
npm run dev
```

The app runs on `http://localhost:5173` by default.

## Environment Variables

**server/.env**
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `GEMINI_API_KEY` — from Google AI Studio
- `CLIENT_URL` — used for CORS, e.g. `http://localhost:5173`

**client/.env**
- `VITE_API_URL` — base URL of the backend API, e.g. `http://localhost:5000/api`

## AI Features

AlgoLens does **not** include a chatbot. Gemini is only used to analyze structured data
already stored in the app, in four places:

1. **Contest Review** — generated automatically whenever a contest is added.
2. **Analyze My Progress** — looks at rating history, contest history, and topic stats.
3. **Weekly Practice Plan** — takes a target rating and hours/day, returns a 7-day plan.
4. **Problem Recommendations** — 5 problems targeted at the user's weakest topics.

## Notes on Design Decisions

- No `services/` or `repositories/` layer — route handlers talk to Mongoose models directly.
  This is a solo project, not a large team codebase, so that extra indirection isn't earning
  its keep yet.
- Daily activity (for the streak and weekly activity chart) is tracked as a simple array of
  `"YYYY-MM-DD"` strings on the `User` document rather than a separate collection, since it's
  just a presence check per day, not detailed per-problem logging.
- AI outputs are persisted (`AIAnalysis` collection, and `review` embedded on `Contest`) so
  users can look back at previous analyses instead of losing them after the API call.

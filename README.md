# SkillFound

An AI-assisted job board built on the MERN stack. Candidates upload a resume once, see how well they fit every job (and why), and search in plain English. Recruiters draft job posts from a few bullet points and get a ranked shortlist of applicants.

- Live app: [skillfound-jobs.onrender.com](https://skillfound-jobs.onrender.com)
- API: [skillfound-jobs-api.onrender.com](https://skillfound-jobs-api.onrender.com/api/v1/health)

**Try it in under a minute:** use the demo links in the bar at the top of the site (or **Continue with a demo account** on the login page). No sign-up. The demo accounts come with a filled profile, applications and applicants. (The free backend sleeps when idle, so the first request can take up to a minute.)

## Features

### Candidates
- Search like the big boards: what + where, dropdown filter chips (date posted, experience, salary, work mode, job type, company), an "All filters" sheet, and sorting by relevance, date, pay or match
- Two-pane results on desktop (the selected job lives in the URL), full job pages on mobile
- Every listing shows the salary range in LPA. Badges are earned: "Actively hiring" needs recent employer activity, and "Early applicant" means fewer than 3 applicants
- **Plain-English search** that turns into removable filter chips, with keyword fallback when AI is off or busy
- Job pages with a key-facts row, about / responsibilities / requirements / benefits, a deterministic skills match against your profile, company facts, similar jobs, share and report
- **Match scores**: 0–100 with reasons, cached per user, job and profile version
- **Resume autofill**: upload a PDF, review the drafted profile, then save
- **My jobs**: saved jobs, in-app alerts for saved searches (no email yet), and an application timeline (applied, viewed, shortlisted, interview, offer or not selected) that flags "no response yet" after 14 days
- Public company pages with size, industry, founding year, locations and open roles

### Employers
- A hiring dashboard with per-stage pipeline counts, expiry dates, and close / extend / reopen
- Applicants grouped by stage, with a profile sheet that records "viewed", shows a skills overlap and moves people through the pipeline
- **AI job drafts** from a few notes (about the role, responsibilities, skills) and **AI ranking** with a one-line reason per applicant
- Candidate phone numbers are hidden until the employer shortlists them

### Trust and safety
- Listings expire 30 days after posting unless the employer extends them; closed and expired jobs leave search but stay viewable
- Salary is required to post; "Report job" on every listing; employers never see a phone number before shortlisting
- No sign-in needed to browse; sign-in is only asked for when you apply, save or create an alert

### Product
- Light and dark themes, Geist font, responsive down to 360px, skeleton loaders and guided empty states
- JWT in an HttpOnly cookie, with a bearer-token fallback for browsers that block third-party cookies
- Shared demo accounts: name, email and phone are locked, password login is disabled, and sample companies are read-only

## How the AI works

All AI calls go through `backend/ai/` using Google's official `@google/genai` SDK (`models.generateContent` with a JSON schema).

- **Validated output**: every response is checked against its schema before use. Invalid JSON, schema mismatches, truncated or empty answers, timeouts, quota errors, bad keys and unknown model ids all become typed errors.
- **Fails closed**: search drops to keyword matching, and the other features hide or explain themselves. Browsing, applying and recruiter CRUD never depend on AI. A bad key or model id pauses AI for 10 minutes, so the UI stops offering it instead of failing on every request.
- **Free-tier protection**: in-memory per-IP, per-user, global per-minute and daily caps, short timeouts, no SDK retries, and caching for search interpretations, match scores and rankings.
- **Privacy**: prompts and responses are never logged; logs record only task, outcome and latency. Applicant names and contact details aren't sent for ranking. The key never leaves the server.
- `GET /api/v1/ai/health` reports whether a key is configured, the model id, availability and the last failure type, without calling Gemini.

## Tech stack

**Frontend:** React 19, Vite, Tailwind CSS v4, Radix UI (shadcn-style components), Redux Toolkit + redux-persist, React Router, framer-motion, Axios, sonner

**Backend:** Node.js 22, Express 5, MongoDB + Mongoose, JWT, Multer, Cloudinary, `@google/genai`

## Run it locally

Prerequisites: Node.js 22+, Docker (or any MongoDB).

```bash
docker run -d --name skillfound-mongo -p 27017:27017 mongo:7

cd backend
cp .env.example .env        # then set SECRET_KEY to a long random string
npm install
npm run seed                # fictional companies, jobs and demo accounts
npm run dev                 # http://localhost:8000

cd ../frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:5173
```

Without Cloudinary credentials, uploads are saved to `backend/uploads/` in development. In production (`NODE_ENV=production` or on Render) uploads need Cloudinary and fail with a clear message otherwise. Without `GEMINI_API_KEY`, the app runs with AI features hidden.

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `MONGO_URI` | yes | | MongoDB connection string |
| `SECRET_KEY` | yes | | JWT signing secret |
| `PORT` | | `3000` | HTTP port |
| `FRONTEND_URL` | | | Extra allowed CORS origins, comma-separated. The production frontends (`skillfound-jobs.onrender.com` and the older `skillfound-frontend.onrender.com`) are always allowed |
| `CLOUD_NAME`, `API_KEY`, `API_SECRET` | prod | | Cloudinary credentials for resumes, photos and logos |
| `GEMINI_API_KEY` | for AI | | Google AI Studio API key. Unset means AI features are off |
| `GEMINI_MODEL` | | `gemini-3.8-flash` | Gemini model id |
| `AI_DAILY_CAP` | | `200` | Max Gemini calls per UTC day, across all users |
| `AI_GLOBAL_RPM` | | `8` | Max Gemini calls per minute, across all users |
| `AI_IP_HOURLY` | | `30` | Max AI calls per IP per hour |
| `AI_USER_HOURLY` | | `40` | Max AI calls per signed-in user per hour |
| `AI_TIMEOUT_MS` | | `20000` | Timeout for AI calls |
| `AI_RESUME_TIMEOUT_MS` | | `30000` | Timeout for resume parsing |
| `TRUST_PROXY` | | `1` | Express `trust proxy` hops, used for per-IP limits and secure cookies |
| `PUBLIC_URL` | | `http://localhost:PORT` | Base URL for locally stored uploads (dev only) |

Cache hits (repeat searches, already-scored jobs, unchanged rankings) don't count against the caps.

### Frontend (`frontend/.env.local`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `https://skillfound-jobs-api.onrender.com` | Backend base URL. The older `VITE_BACKEND_URL` is still read if set |

## Seed data and demo accounts

```bash
npm run seed              # idempotent: upserts 6 companies, 25 jobs, demo users, applications
npm run seed:reset-demo   # same, and removes jobs, companies and applications created via the demo accounts
```

All companies, people and jobs are fictional, with generated initials logos and `example.com` addresses. The seed only touches records it created, and refuses to overwrite a real record with the same company name or email. To seed production, run it once with the production connection string:

```bash
cd backend && MONGO_URI="<production uri>" npm run seed
```

The demo accounts (`demo.candidate@example.com`, `demo.recruiter@example.com`) can only be entered through the demo buttons. They are shared, so anything created with them is visible to other visitors; `seed:reset-demo` cleans up.

## Checks

```bash
cd backend && npm test        # stubs Gemini for every failure mode; uses local MongoDB (skips HTTP tests if unreachable)
cd frontend && npm run lint && npm run build
```

Live AI check (spends about 6 Gemini requests):

```bash
# against a local backend with GEMINI_API_KEY set and seeded data
cd backend && npm run ai:smoke

# against a deployed backend; no secrets needed, it uses the demo accounts
node scripts/ai-smoke.js --url https://skillfound-jobs-api.onrender.com
```

## API overview

| Method | Path | Auth |
| --- | --- | --- |
| `POST` | `/api/v1/user/register`, `/login`, `/demo`, `/logout` | |
| `GET` | `/api/v1/user/me` | user |
| `POST` | `/api/v1/user/profile/update` | user |
| `GET` | `/api/v1/job/get` (filters incl. `category`, `postedWithin`; `sort=relevant\|newest\|salary\|match`), `/job/get/:id`, `/job/:id/similar`, `/job/facets`, `/job/overview` | public |
| `POST` | `/api/v1/job/:id/report` | public |
| `POST` | `/api/v1/job/:id/status` (`close`, `reopen`, `extend`) | recruiter (job owner) |
| `GET` | `/api/v1/company/public/:id` | public |
| `GET` / `PUT` / `DELETE` | `/api/v1/me/saved`, `/me/saved/ids`, `/me/saved/:jobId` | candidate |
| `GET` / `POST` / `DELETE` | `/api/v1/me/alerts`, `/me/alerts/:id`, `POST /me/alerts/:id/seen` | candidate |
| `POST` | `/api/v1/application/:id/view` | recruiter (job owner) |
| `POST` | `/api/v1/job/post` | recruiter |
| `GET` | `/api/v1/job/getadminjobs` | recruiter |
| `POST` | `/api/v1/company/register`, `PUT /company/update/:id`, `GET /company/get[/:id]` | recruiter |
| `POST` | `/api/v1/application/apply/:id` | candidate |
| `GET` | `/api/v1/application/get` | candidate |
| `GET` / `POST` | `/api/v1/application/:id/applicants`, `/application/status/:id/update` | recruiter (job owner) |
| `GET` | `/api/v1/ai/status`, `/ai/health` | public |
| `POST` | `/api/v1/ai/search` | public |
| `POST` | `/api/v1/ai/match`, `/ai/resume` | candidate |
| `POST` | `/api/v1/ai/job-description`, `/ai/jobs/:id/rank` | recruiter |

Non-GET requests must send an `X-Requested-With` header (the frontend does). This blocks cross-site form posts, since the auth cookie is `SameSite=None`.

## Author

**Dhairya Shah**\
[LinkedIn](https://www.linkedin.com/in/dhairya0609/) | [GitHub](https://github.com/dhairya0609)

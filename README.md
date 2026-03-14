# QuizAI — AI-Powered Quiz Generator

> **Generate. Learn. Master anything.** An intelligent quiz platform that uses AI to generate custom quizzes on any topic, track your progress, and challenge friends.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Django](https://img.shields.io/badge/Django-4.2-green)](https://djangoproject.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://postgresql.org)

---

## What It Is

QuizAI lets users:
- **Generate** custom quizzes on any topic in seconds using AI
- **Track** progress with detailed analytics and history
- **Compete** by challenging friends and viewing a leaderboard
- **Share** quiz results and quiz links publicly

**AI Model:** Powered by **OpenRouter** (free tier) — uses a model chain that falls over to available free models (`mistralai/mistral-7b-instruct`, `google/gemma-2-9b-it`, etc.) ensuring maximum uptime.

---

## Architecture

```
┌─────────────────┐     REST/JWT     ┌──────────────────┐      SQL       ┌────────────────┐
│   Next.js 16    │ ──────────────▶  │   Django 4.2     │ ─────────────▶ │  PostgreSQL 15 │
│  (Vercel)       │ ◀──────────────  │ (Railway/Gunicorn)│ ◀───────────── │  (Railway)     │
│  localhost:3000 │                  │  localhost:8000   │                └────────────────┘
└─────────────────┘                  └──────────────────┘
                                              │
                                       HTTPS API call
                                              ▼
                                   ┌──────────────────┐
                                   │  OpenRouter API  │
                                   │  (Free AI models)│
                                   └──────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 16 (App Router) |
| Frontend UI | React 19, custom CSS variables design system |
| State Management | Zustand |
| Form Validation | React Hook Form + Zod |
| Auth | JWT (access 15min + refresh 7 days) + Google OAuth SSO |
| Backend Framework | Django 4.2 + Django REST Framework |
| Database | PostgreSQL 15 |
| AI | OpenRouter (free tier model chain) |
| Email | SendGrid via Anymail (console fallback in dev) |
| Auth Tokens | djangorestframework-simplejwt |
| Rate Limiting | django-ratelimit |

---

## Local Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 15 running locally

### 1. Clone

```bash
git clone <repo-url>
cd "Teach edison"
```

### 2. Backend setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create and configure .env (see table below)
cp .env.example .env
# Edit .env with your credentials

# Create the database
createdb quiz_db

# Run migrations
python manage.py migrate

# (Optional) Seed demo data
python manage.py seed_demo

# Start the server
python manage.py runserver
```

### 3. Frontend setup

```bash
cd quizapp_frontend

# Install dependencies
npm install

# Create env file
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Start the dev server
npm run dev
```

App will be running at **http://localhost:3000**

---

## Environment Variables

### Backend — `backend/.env`

| Key | Description | Example |
|-----|-------------|---------|
| `SECRET_KEY` | Django secret key | `your-random-secret-key-here` |
| `DEBUG` | Enable debug mode | `True` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost,127.0.0.1` |
| `DB_NAME` | PostgreSQL database name | `quiz_db` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `yourpassword` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `OPENROUTER_API_KEY` | OpenRouter API key (free) | `sk-or-v1-...` |
| `SENDGRID_API_KEY` | SendGrid API key (optional) | `SG.xxx` |

### Frontend — `quizapp_frontend/.env.local`

| Key | Description | Example |
|-----|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxxx.apps.googleusercontent.com` |

---

## API Endpoint Reference

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/users/auth/register/` | No | Register new user |
| `POST` | `/api/users/auth/login/` | No | Login, returns JWT tokens |
| `POST` | `/api/users/auth/logout/` | Yes | Blacklist refresh token |
| `GET`  | `/api/users/auth/me/` | Yes | Get current user profile |
| `PATCH`| `/api/users/auth/me/` | Yes | Update profile / change password |
| `POST` | `/api/users/auth/google/` | No | Google SSO login |
| `POST` | `/api/token/refresh/` | No | Refresh access token |
| `POST` | `/api/users/auth/password-reset/` | No | Request password reset |
| `POST` | `/api/users/auth/password-reset-confirm/` | No | Confirm password reset |

### Quizzes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/quizzes/` | Yes | Generate a new AI quiz |
| `GET`  | `/api/quizzes/` | Yes | List user's quizzes (paginated) |
| `GET`  | `/api/quizzes/{id}/` | Yes | Get quiz details & questions |
| `POST` | `/api/quizzes/{id}/start/` | Optional | Start a quiz attempt |
| `GET`  | `/api/quizzes/share/{token}/` | No | Get shared quiz by token |
| `GET`  | `/api/quizzes/analytics/` | Yes | Get analytics data |

### Attempts
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/quizzes/attempts/{id}/answer/` | Optional | Submit an answer |
| `POST` | `/api/quizzes/attempts/{id}/complete/` | Optional | Complete a quiz attempt |
| `GET`  | `/api/quizzes/attempts/{id}/results/` | Optional | Get attempt results |

### History
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/api/history/` | Yes | Get all past attempts (paginated) |

### Social
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/api/social/friends/` | Yes | List friends and pending requests |
| `POST` | `/api/social/friends/request/` | Yes | Send a friend request |
| `POST` | `/api/social/friends/{id}/accept/` | Yes | Accept a friend request |
| `POST` | `/api/social/friends/{id}/decline/` | Yes | Decline a friend request |
| `DELETE`| `/api/social/friends/{id}/` | Yes | Remove a friend |
| `GET`  | `/api/social/friends/search/?q=` | Yes | Search users to add |
| `GET`  | `/api/social/leaderboard/` | Yes | Global leaderboard |

### Challenges
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/api/social/challenges/` | Yes | List challenges |
| `POST` | `/api/social/challenges/` | Yes | Create a challenge |
| `POST` | `/api/social/challenges/{id}/accept/` | Yes | Accept challenge |
| `POST` | `/api/social/challenges/{id}/decline/` | Yes | Decline challenge |

### Notifications
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/api/notifications/` | Yes | List notifications (paginated) |
| `POST` | `/api/notifications/read-all/` | Yes | Mark all as read |

---

## Demo Data

The project includes a management command to seed realistic demo data:

```bash
cd backend
python manage.py seed_demo
```

This creates:
- **2 test users:** `alice@demo.com / Demo1234!` and `bob@demo.com / Demo1234!`
- **10 quizzes** (5 each, varying difficulties and topics)
- **Completed attempts** with realistic scores
- **A friendship** between Alice and Bob
- **1 active challenge** between them

Log in as either user to see a fully populated dashboard immediately.

---

## Deployment

### Backend → Railway

1. Create a new Railway project
2. Add a PostgreSQL service to your project
3. Deploy from GitHub, set root directory to `backend/`
4. Add all environment variables from the table above
5. Set start command: `gunicorn quizapp_backend.wsgi:application --bind 0.0.0.0:$PORT`
6. Add `ALLOWED_HOSTS=your-railway-app.up.railway.app` and `DEBUG=False`

```bash
# On Railway shell after deploy
python manage.py migrate
python manage.py collectstatic --noinput
```

### Frontend → Vercel

1. Push the `quizapp_frontend/` folder (or the whole repo)
2. In Vercel, set the **Root Directory** to `quizapp_frontend`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id`
4. Deploy

**Update CORS in Django settings:**
```python
CORS_ALLOWED_ORIGINS = [
    "https://your-app.vercel.app",
]
```

---

## Known Limitations

- **OpenRouter free tier:** Rate-limited to ~20 requests/minute. Bursting many quiz generations in quick succession may result in temporary 503 errors. The app falls over to backup models automatically.
- **No native mobile push:** Web Push notifications are supported (and requested on first login) but require HTTPS. They don't work on iOS Safari without a PWA manifest.
- **Email in dev:** Emails print to the console in dev mode. Configure `SENDGRID_API_KEY` for real delivery.
- **AI answer quality:** Generated questions are non-deterministic. Occasionally a question may have ambiguous choices on niche topics.

---

## Future Improvements

- **Adaptive difficulty:** Adjust question difficulty based on the user's rolling accuracy score
- **Study mode:** Flashcard-style view for reviewing incorrect answers
- **PWA & offline mode:** Cache quiz questions locally so users can take quizzes without internet
- **Custom question sets:** Let users manually write questions and mix with AI-generated ones
- **Teams/classrooms:** Teacher creates a quiz, students join by code, live leaderboard updates in real time using WebSockets (Django Channels)
- **Spaced repetition:** Surface old questions the user got wrong at optimal intervals
- **Voice input:** Let users speak the topic instead of typing (Web Speech API)
- **Export to PDF:** Download a quiz as a printable PDF for offline use

---

## Project Structure

```
Teach edison/
├── backend/
│   ├── quizapp_backend/     # Django settings, urls
│   ├── users/               # Auth, registration, Google SSO
│   ├── quizzes/             # Quiz generation, attempts, analytics
│   ├── social/              # Friends, challenges, leaderboard
│   ├── notifications/       # Email notifications
│   ├── ai_service/          # OpenRouter integration, model chain
│   └── manage.py
└── quizapp_frontend/
    ├── app/                 # Next.js App Router pages
    │   ├── (auth)/          # Login, Register, Forgot Password
    │   └── dashboard/       # All protected dashboard pages
    ├── components/          # Shared UI components
    ├── hooks/               # API hooks, social hooks
    ├── store/               # Zustand auth store
    ├── lib/                 # Axios config
    └── contexts/            # Theme context
```

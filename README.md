# 🧠 QuizAI — Powered by Agentic AI

[![GitHub Stars](https://img.shields.io/github/stars/PranaavRajV/QuizAI?style=for-the-badge)](https://github.com/PranaavRajV/QuizAI/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Deploy Status](https://img.shields.io/badge/Deployment-Live-success?style=for-the-badge)](https://rajjjquizai-git-main-vpranaavraj-8259s-projects.vercel.app)

QuizAI is a next-generation education platform that uses Large Language Models (LLMs) to generate high-quality, personalized quizzes on any topic instantly. Built with a focus on premium aesthetics and real-time social competition.

**Live Demo:** [rajjjquizai-git-main-vpranaavraj-8259s-projects.vercel.app](https://rajjjquizai-git-main-vpranaavraj-8259s-projects.vercel.app)

---

## 🚀 Features

- [x] **AI Quiz Generation**: Create quizzes on any topic (Coding, History, Medicine, etc.) with custom difficulty levels.
* [x] **Intelligent Fallbacks**: Multi-model AI chain (Gemini 2.0, Llama 3.3, Mistral) via OpenRouter to ensure 99.9% uptime.
- [x] **Real-time Social Dashboard**: Send and accept friend requests, see who's online, and track mutual progress.
- [x] **Challenge System**: Challenge friends to specific quizzes and compete for the higher score.
- [x] **Interactive Notifications**: Instant alerts for social actions with direct deep-linking to relevant pages.
- [x] **Analytics & Heatmaps**: Visualize your performance across different subjects over time.
- [x] **Dynamic Leaderboards**: Global and friend-only rankings based on accuracy and speed.
- [x] **Premium UI**: Glassmorphic design with dark/light mode support and smooth micro-animations.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 15+, Tailwind CSS, Lucide Icons, Axios, Framer Motion |
| **Backend** | Django 4.2+, DRF, PostgreSQL, Gunicorn |
| **AI Engine** | OpenRouter (Gemini, Llama 3.3, Claude fallbacks) |
| **Auth** | JWT (SimpleJWT) + Google OAuth 2.0 |
| **Deployment** | Vercel (Frontend), Railway (Backend & Database) |

---

## 🏛 Architecture Decisions

### 1. Separation of Concerns (Django + Next.js)
Instead of a monolithic approach, we decoupled the UI and API. This allows for independent scaling, faster frontend iterations without re-deploying the server, and a cleaner developer experience.

### 2. JWT over Session Auth
We used **JSON Web Tokens (JWT)** for authentication. This makes the backend stateless (reducing DB hits for session lookups) and ensures the API is ready for a future mobile app (React Native/Flutter) which doesn't handle cookies like a browser.

### 3. PostgreSQL Relational Model
Relational data is critical for a quiz app. The hierarchy of `Quiz → Question → Choice` is rigidly structured, and PostgreSQL's ACID compliance ensures that a user's attempt record is never lost or corrupted during high-concurrency leaderboard updates.

### 4. Model-Agnostic AI (OpenRouter)
AI APIs can be volatile. We implemented a **Model Chain** using OpenRouter. If Gemini is rate-limited, the system automatically falls back to Llama 3.3, then Mistral, ensuring the user always gets their quiz.

### 5. Denormalized Performance
In the `UserAnswer` model, we store `is_correct` as a boolean field rather than calculating it on every request. This allows the results page and analytics dashboard to load instantly by performing a simple `Count()` rather than a multi-table join.

### 6. Temporal Tracking
`QuizAttempt` tracks both `started_at` and `completed_at`. This allows us to calculate not just the score, but the **velocity** (time taken per question), which is a key metric in our leaderboard ranking algorithm.

---

## 📊 Database Schema

```text
+----------------+       +----------------+       +----------------+
|      User      |       |      Quiz      |       |    Question    |
+----------------+       +----------------+       +----------------+
| id (PK)        |  1:N  | id (PK)        |  1:N  | id (PK)        |
| username       |------>| topic          |------>| quiz_id (FK)   |
| email          |       | difficulty     |       | question_text  |
| avatar_url     |       | created_by (FK)|       | explanation    |
+----------------+       +----------------+       +----------------+
        |                        |                        |
        | 1:N                    | 1:N                    | 1:N
        v                        v                        v
+----------------+       +----------------+       +----------------+
|  QuizAttempt   |       |   Challenge    |       |     Choice     |
+----------------+       +----------------+       +----------------+
| id (PK)        |       | id (PK)        |       | id (PK)        |
| user_id (FK)   |       | challenger (FK)|       | question_fk    |
| quiz_id (FK)   |       | challenged (FK)|       | choice_text    |
| score          |       | status         |       | is_correct     |
| started_at     |       +----------------+       +----------------+
| completed_at   |
+----------------+
```

---

## 🔗 API Reference

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/token/` | No | Login and receive JWT access/refresh tokens |
| `PATCH` | `/api/users/auth/me/` | Yes | Update profile, bio, or avatar |
| `POST` | `/api/quizzes/` | Yes | Generate a new AI quiz (Topic, Difficulty) |
| `GET` | `/api/quizzes/<id>/` | Yes | Fetch quiz metadata and questions |
| `POST` | `/api/quizzes/attempts/` | Yes | Submit a completed quiz attempt |
| `GET` | `/api/social/friends/list_friends/` | Yes | Get current friends list + stats |
| `POST` | `/api/social/friends/request/` | Yes | Send friend request to another user |
| `GET` | `/api/social/leaderboard/global/` | Yes | Get top 50 users worldwide |

---

## 💻 Local Setup

### Backend (Django)
1. **Clone & Enter Directory:** `cd backend`
2. **Setup Venv:** `python -m venv .venv && source .venv/bin/activate`
3. **Install Deps:** `pip install -r requirements.txt`
4. **Env Vars:** Create `.env` (see section below)
5. **Migrate:** `python manage.py migrate`
6. **Run:** `python manage.py runserver`

### Frontend (Next.js)
1. **Clone & Enter Directory:** `cd quizapp_frontend`
2. **Install Deps:** `npm install`
3. **Env Vars:** Create `.env.local`
4. **Run:** `npm run dev`

---

## 🔑 Environment Variables

### Backend (`.env`)
- `SECRET_KEY`: Django secret key for cryptographic signing.
- `DEBUG`: Set to `True` for local development.
- `DATABASE_URL`: Connection string for PostgreSQL.
- `OPENROUTER_API_KEY`: API key for AI generation.
- `CORS_ORIGIN_FRONTEND`: URL of your frontend (e.g., `http://localhost:3000`).

### Frontend (`.env.local`)
- `NEXT_PUBLIC_API_URL`: URL of your backend (e.g., `http://localhost:8000`).
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: For Google OAuth integration.

---

## 🧩 Challenges & Solutions

### 1. AI JSON Inconsistency
**Challenge**: Free-tier LLMs occasionally include markdown commentary (e.g., "Here is your JSON:") which breaks `json.loads()`.
**Solution**: Implemented a robust regex-based extraction layer that identifies the `[` and `]` boundaries, coupled with a 5-step model fallback chain that retries with a different model if one fails.

### 2. JWT Refresh Race Conditions
**Challenge**: If multiple components trigger API calls simultaneously after a token expires, they all attempt to refresh the token at once, causing 401 errors.
**Solution**: Wrapped the Axios refresh logic in a singleton pattern. Only the first request triggers the refresh; subsequent requests queue up and wait for the new token before proceeding.

---

## 🔮 Roadmap (What's Next)

- **Multiplayer Mode**: Real-time 1v1 quiz battles using WebSockets/Django Channels.
- **Deep Sharing**: Integrated sharing buttons to post results directly to Twitter/LinkedIn.
- **PDF Certificates**: Automatically generate a "Course Completion" PDF for users who score >90% on hard quizzes.

---
**Developed by [Pranaav Raj V](https://github.com/PranaavRajV)**

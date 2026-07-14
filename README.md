# AuraList

A task breakdown and management app. Describe a big task, let the AI break it
into a checklist, then track the steps on a to-do list or kanban board and
export them to Google Calendar / Google Tasks.

## Pages

- **Task Breakdown** — chat with the AI to turn a task into a checklist.
  Finalized checklists are added to your tasks automatically.
- **To-Do List** — check items off, add or delete tasks manually.
- **Kanban Board** — drag tasks between To Do / In Progress / Done.

Tasks are shared across pages and persisted in your browser (localStorage).

## Background — from a lean startup validation project

AuraList started as a project in **MDIA1007 (Digital Entrepreneurship)** at UNSW,
a course built around the **Lean Startup** methodology. The core idea the course
drilled in: validate that a real problem exists *before* building a solution.
So the app came second — the discovery process came first.

We ran **two cycles of customer discovery interviews, five interviews per cycle
(ten in total)**, structured as a build–measure–learn loop:

- **Cycle 1 — problem discovery.** Five empathy-driven interviews focused on
  understanding how people actually plan and break down large, vague goals,
  before proposing any solution. The goal was to confirm the problem was real
  and worth solving — not to pitch AuraList.
- **Cycle 2 — solution validation.** After synthesizing the first round into a
  clearer problem statement and an early concept, five more interviews tested
  whether an AI-assisted task-breakdown approach resonated and where it fell
  short — feeding directly back into the product direction.

Throughout, the team worked the way a small startup would: tracking progress on
a Kanban board in Jira and documenting research and decisions in Confluence.

The biggest takeaway was that software engineering isn't just building —
requirements discovery, user empathy, and structured research matter just as
much, and they apply well beyond startups. AuraList is the continuation of that
validated concept, evolved from a coursework prototype into a real product.

## Running locally

Backend (port 3000):

```bash
cd backend
npm install
# put your Gemini key in backend/.env: GEMINI_API_KEY=...
npm run dev
```

Frontend (Vite dev server, proxies /api to the backend):

```bash
cd frontend
npm install
npm run dev
```

## Google Calendar & Tasks export

The "Export to Google" button (on the To-Do List and Kanban pages) creates an
all-day Calendar event per open task on a date you pick, and/or adds them to
your default Google Tasks list. It needs a Google OAuth client ID:

1. In [Google Cloud Console](https://console.cloud.google.com/), create (or
   pick) a project.
2. Enable the **Google Calendar API** and **Google Tasks API**
   (APIs & Services → Library).
3. Configure the OAuth consent screen (External is fine for testing; add your
   Google account as a test user).
4. Create an **OAuth client ID** of type **Web application**
   (APIs & Services → Credentials) and add `http://localhost:5173` to
   **Authorized JavaScript origins**.
5. Copy `frontend/.env.example` to `frontend/.env` and set
   `VITE_GOOGLE_CLIENT_ID` to the client ID.
6. Restart the frontend dev server.

Sign-in happens in a Google popup; the access token stays in the browser and
no Google credentials are sent to the backend.


## Progress Report

08/07/206 - Pushed the initial version made with my collaborator.

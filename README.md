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

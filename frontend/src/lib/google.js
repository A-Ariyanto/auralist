// Google Calendar / Google Tasks integration via Google Identity Services.
// Requires VITE_GOOGLE_CLIENT_ID (an OAuth 2.0 Web client ID) in frontend/.env.

const SCOPES =
  "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks";

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let gisLoadPromise = null;
let cachedToken = null;
let tokenExpiresAt = 0;

function loadGis() {
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google sign-in script."));
    document.head.appendChild(script);
  });
  return gisLoadPromise;
}

async function getAccessToken() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      "Google integration is not configured. Set VITE_GOOGLE_CLIENT_ID in frontend/.env."
    );
  }
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        cachedToken = response.access_token;
        tokenExpiresAt = Date.now() + Number(response.expires_in) * 1000;
        resolve(cachedToken);
      },
      error_callback: (err) => {
        reject(
          new Error(
            err?.type === "popup_closed"
              ? "Google sign-in was cancelled."
              : "Google sign-in failed."
          )
        );
      },
    });
    client.requestAccessToken();
  });
}

async function googleFetch(url, token, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(
      data?.error?.message || `Google API request failed (${res.status})`
    );
  }
  return res.json();
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Creates one all-day event per task on the given date (YYYY-MM-DD).
export async function exportToCalendar(tasks, date) {
  const token = await getAccessToken();
  let created = 0;
  for (const task of tasks) {
    await googleFetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      token,
      {
        summary: task.text,
        description: task.group ? `AuraList — ${task.group}` : "AuraList task",
        start: { date },
        end: { date: addDays(date, 1) },
      }
    );
    created += 1;
  }
  return created;
}

// Inserts tasks into the user's default Google Tasks list. New tasks land at
// the top of the list, so insert in reverse to preserve the original order.
export async function exportToTasks(tasks) {
  const token = await getAccessToken();
  let created = 0;
  for (const task of [...tasks].reverse()) {
    await googleFetch(
      "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",
      token,
      {
        title: task.text,
        notes: task.group ? `AuraList — ${task.group}` : "AuraList task",
      }
    );
    created += 1;
  }
  return created;
}

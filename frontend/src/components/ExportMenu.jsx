import { useEffect, useRef, useState } from "react";
import {
  GOOGLE_CLIENT_ID,
  exportToCalendar,
  exportToTasks,
} from "../lib/google";

function todayPlusOne() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function ExportMenu({ tasks }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayPlusOne);
  const [busy, setBusy] = useState(null); // "calendar" | "tasks" | null
  const [result, setResult] = useState(null); // { ok, message }
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const pending = tasks.filter((t) => t.status !== "done");
  const exportable = pending.length > 0 ? pending : tasks;

  const run = async (kind) => {
    setBusy(kind);
    setResult(null);
    try {
      const count =
        kind === "calendar"
          ? await exportToCalendar(exportable, date)
          : await exportToTasks(exportable);
      setResult({
        ok: true,
        message: `Added ${count} ${count === 1 ? "item" : "items"} to Google ${
          kind === "calendar" ? "Calendar" : "Tasks"
        }.`,
      });
    } catch (err) {
      setResult({ ok: false, message: err.message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={tasks.length === 0}
        className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Export to Google
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          {!GOOGLE_CLIENT_ID ? (
            <div className="text-sm text-slate-600 space-y-2">
              <p className="font-medium text-slate-800">
                Google integration not configured
              </p>
              <p>
                Create an OAuth 2.0 Web client ID in Google Cloud Console
                (enable the Calendar and Tasks APIs), then add it to{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                  frontend/.env
                </code>{" "}
                as{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                  VITE_GOOGLE_CLIENT_ID
                </code>{" "}
                and restart the dev server. See the README for the full steps.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Exports your {exportable.length} open{" "}
                {exportable.length === 1 ? "task" : "tasks"}. You'll be asked
                to sign in with Google the first time.
              </p>

              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="export-date"
                  className="text-sm text-slate-700"
                >
                  Calendar date
                </label>
                <input
                  id="export-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <button
                onClick={() => run("calendar")}
                disabled={busy !== null || !date}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #8B5CF6, #34D399)",
                }}
              >
                {busy === "calendar"
                  ? "Adding to Calendar…"
                  : "Add to Google Calendar"}
              </button>
              <button
                onClick={() => run("tasks")}
                disabled={busy !== null}
                className="w-full rounded-xl border border-purple-300 px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-50 disabled:opacity-50 transition-colors"
              >
                {busy === "tasks" ? "Adding to Tasks…" : "Add to Google Tasks"}
              </button>
            </div>
          )}

          {result && (
            <p
              className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                result.ok
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {result.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

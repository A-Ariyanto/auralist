import { useState } from "react";
import { TasksProvider, useTasks } from "./store/TasksContext";
import BreakdownPage from "./pages/BreakdownPage";
import TodoPage from "./pages/TodoPage";
import KanbanPage from "./pages/KanbanPage";

const PAGES = [
  {
    id: "breakdown",
    label: "Task Breakdown",
    description: "Turn a big task into steps with AI",
    icon: (
      <path
        d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),
  },
  {
    id: "todo",
    label: "To-Do List",
    description: "Check items off as you go",
    icon: (
      <path
        d="M9 11l3 3 8-8M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    id: "kanban",
    label: "Kanban Board",
    description: "Track progress across columns",
    icon: (
      <path
        d="M5 4h4v16H5zM10.5 4h4v10h-4zM16 4h4v7h-4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

function NavButton({ page, active, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left ${
        active
          ? "bg-purple-50 text-purple-700"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none">
        {page.icon}
      </svg>
      <span className="flex-1 hidden md:block">{page.label}</span>
      {badge > 0 && (
        <span className="hidden md:inline-flex items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5">
          {badge}
        </span>
      )}
    </button>
  );
}

function AppShell() {
  const [page, setPage] = useState("breakdown");
  const { tasks } = useTasks();
  const openCount = tasks.filter((t) => t.status !== "done").length;

  const current = PAGES.find((p) => p.id === page);

  return (
    <div className="h-screen bg-slate-50 flex">
      <aside className="w-16 md:w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-3 md:px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <img
            src="/AuraList-logo.png"
            alt="AuraList"
            className="h-8 w-8 object-contain md:h-9 md:w-auto"
          />
        </div>
        <nav className="flex-1 p-2 md:p-3 space-y-1">
          {PAGES.map((p) => (
            <NavButton
              key={p.id}
              page={p}
              active={page === p.id}
              badge={p.id !== "breakdown" ? openCount : 0}
              onClick={() => setPage(p.id)}
            />
          ))}
        </nav>
        <div className="hidden md:block p-4 border-t border-slate-200">
          <p className="text-xs text-slate-400 leading-relaxed">
            Break tasks down with AI, then track them and export to Google
            Calendar &amp; Tasks.
          </p>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-3">
          <h1 className="text-base font-semibold text-slate-800">
            {current.label}
          </h1>
          <p className="text-xs text-slate-500">{current.description}</p>
        </header>

        <main className="flex-1 min-h-0">
          {page === "breakdown" && <BreakdownPage onNavigate={setPage} />}
          {page === "todo" && <TodoPage onNavigate={setPage} />}
          {page === "kanban" && <KanbanPage onNavigate={setPage} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TasksProvider>
      <AppShell />
    </TasksProvider>
  );
}

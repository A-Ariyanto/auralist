import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "auralist.tasks.v1";

const TasksContext = createContext(null);

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t) =>
        t &&
        typeof t.id === "string" &&
        typeof t.text === "string" &&
        ["todo", "inprogress", "done"].includes(t.status)
    );
  } catch {
    return [];
  }
}

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState(loadTasks);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTasks = (texts, group = null) => {
    const now = Date.now();
    const newTasks = texts
      .map((text) => text.trim())
      .filter((text) => text.length > 0)
      .map((text, i) => ({
        id: crypto.randomUUID(),
        text,
        status: "todo",
        group,
        createdAt: now + i,
      }));
    setTasks((prev) => [...prev, ...newTasks]);
    return newTasks;
  };

  const updateTask = (id, patch) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const clearDone = () => {
    setTasks((prev) => prev.filter((t) => t.status !== "done"));
  };

  const value = { tasks, addTasks, updateTask, deleteTask, clearDone };

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used inside <TasksProvider>");
  return ctx;
}

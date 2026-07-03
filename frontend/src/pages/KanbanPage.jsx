import { useState } from "react";
import { useTasks } from "../store/TasksContext";
import ExportMenu from "../components/ExportMenu";

const COLUMNS = [
  { id: "todo", title: "To Do", accent: "#8B5CF6" },
  { id: "inprogress", title: "In Progress", accent: "#F59E0B" },
  { id: "done", title: "Done", accent: "#34D399" },
];

function KanbanCard({ task, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm cursor-grab active:cursor-grabbing hover:border-purple-300 transition-colors"
    >
      <p
        className={`text-sm leading-relaxed ${
          task.status === "done"
            ? "line-through text-slate-400"
            : "text-slate-800"
        }`}
      >
        {task.text}
      </p>
      {task.group && (
        <p className="text-xs text-slate-400 mt-1 truncate">{task.group}</p>
      )}
    </div>
  );
}

export default function KanbanPage({ onNavigate }) {
  const { tasks, updateTask } = useTasks();
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) updateTask(taskId, { status: columnId });
  };

  if (tasks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-4">
        <p className="text-slate-500 text-sm mb-3">
          Your board is empty. Break a task down or add to-dos to get started.
        </p>
        <button
          onClick={() => onNavigate("breakdown")}
          className="text-sm font-medium text-purple-600 hover:text-purple-800"
        >
          Go to Task Breakdown →
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col px-4 py-6">
      <div className="flex items-center justify-between mb-4 max-w-4xl w-full mx-auto">
        <h2 className="text-lg font-semibold text-slate-800">Kanban Board</h2>
        <ExportMenu tasks={tasks} />
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full mx-auto">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverColumn(col.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-2xl border bg-slate-100/60 p-3 min-h-40 transition-colors ${
                dragOverColumn === col.id
                  ? "border-purple-400 bg-purple-50"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: col.accent }}
                />
                <h3 className="text-sm font-semibold text-slate-700">
                  {col.title}
                </h3>
                <span className="ml-auto text-xs text-slate-400">
                  {colTasks.length}
                </span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto">
                {colTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onDragStart={handleDragStart}
                  />
                ))}
                {colTasks.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">
                    Drag tasks here
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

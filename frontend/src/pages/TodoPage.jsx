import { useState } from "react";
import { useTasks } from "../store/TasksContext";
import ExportMenu from "../components/ExportMenu";

export default function TodoPage({ onNavigate }) {
  const { tasks, addTasks, updateTask, deleteTask, clearDone } = useTasks();
  const [newTask, setNewTask] = useState("");

  const doneCount = tasks.filter((t) => t.status === "done").length;

  const handleAdd = (e) => {
    e.preventDefault();
    if (newTask.trim().length === 0) return;
    addTasks([newTask]);
    setNewTask("");
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-6">
      <div className="max-w-lg w-full mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              To-Do List
            </h2>
            <p className="text-sm text-slate-500">
              {doneCount} / {tasks.length} done
            </p>
          </div>
          <ExportMenu tasks={tasks} />
        </div>

        <div className="h-2 rounded-full bg-slate-200 mb-6 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0}%`,
              background: "linear-gradient(90deg, #8B5CF6, #34D399)",
            }}
          />
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a task..."
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={newTask.trim().length === 0}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #34D399)" }}
          >
            Add
          </button>
        </form>

        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm mb-3">
              No tasks yet. Add one above, or let the AI break a big task down
              for you.
            </p>
            <button
              onClick={() => onNavigate("breakdown")}
              className="text-sm font-medium text-purple-600 hover:text-purple-800"
            >
              Go to Task Breakdown →
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="group flex items-start gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm hover:border-purple-300 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={task.status === "done"}
                  onChange={() =>
                    updateTask(task.id, {
                      status: task.status === "done" ? "todo" : "done",
                    })
                  }
                  className="mt-0.5 h-4 w-4 accent-purple-600 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm leading-relaxed ${
                      task.status === "done"
                        ? "line-through text-slate-400"
                        : "text-slate-800"
                    }`}
                  >
                    {task.text}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.group && (
                      <span className="text-xs text-slate-400 truncate">
                        {task.group}
                      </span>
                    )}
                    {task.status === "inprogress" && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                        In progress
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  aria-label={`Delete "${task.text}"`}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity text-lg leading-none"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        {doneCount > 0 && (
          <button
            onClick={clearDone}
            className="mt-4 text-sm text-slate-500 hover:text-red-500 transition-colors"
          >
            Clear {doneCount} completed {doneCount === 1 ? "task" : "tasks"}
          </button>
        )}
      </div>
    </div>
  );
}

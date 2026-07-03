import { useEffect, useRef, useState } from "react";
import { useTasks } from "../store/TasksContext";

const FINALIZE_MARKER = "[CHECKLIST_FINALIZED]";

function parseChecklist(text) {
  return text
    .replace(FINALIZE_MARKER, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*•]\s+/.test(line))
    .map((line) => line.replace(/^[-*•]\s+/, "").trim())
    .filter((line) => line.length > 0);
}

function ChatMessage({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "text-white rounded-br-sm"
            : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm"
        }`}
        style={
          isUser
            ? { background: "linear-gradient(135deg, #8B5CF6, #34D399)" }
            : undefined
        }
      >
        {message.text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-purple-300 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function FinalizedSummary({ items, onReset, onGoToList }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-6">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-lg font-semibold text-slate-800">
          Checklist added to your tasks
        </h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          {items.length} {items.length === 1 ? "step" : "steps"} were added to
          your To-Do List and Kanban Board.
        </p>
        <ul className="text-left space-y-1.5 mb-6 max-h-56 overflow-y-auto">
          {items.map((item, i) => (
            <li
              key={i}
              className="text-sm text-slate-700 flex items-start gap-2"
            >
              <span className="text-purple-500 mt-0.5">•</span>
              {item}
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <button
            onClick={onGoToList}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #34D399)" }}
          >
            View To-Do List
          </button>
          <button
            onClick={onReset}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-purple-300 transition-colors"
          >
            Break Down Another Task
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BreakdownPage({ onNavigate }) {
  const { addTasks } = useTasks();
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [finalizedItems, setFinalizedItems] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      const reply = data.reply ?? "";

      if (reply.includes(FINALIZE_MARKER)) {
        const items = parseChecklist(reply);
        const group = messages.find((m) => m.role === "user")?.text ?? text;
        addTasks(items, group.slice(0, 60));
        setFinalizedItems(items);
      } else {
        setMessages((prev) => [...prev, { role: "model", text: reply }]);
      }
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong talking to the AI. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = () => {
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setInput("");
    setError(null);
    setFinalizedItems(null);
  };

  if (finalizedItems) {
    return (
      <FinalizedSummary
        items={finalizedItems}
        onReset={resetSession}
        onGoToList={() => onNavigate("todo")}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-12">
            <video
              src="/AuraList-video-logo.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-28 h-28 object-contain mb-4"
            />
            <p className="font-semibold text-slate-700 text-lg">
              What task would you like to break down?
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Describe it below and I'll help you turn it into a checklist.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="border-t border-slate-200 bg-white p-4 flex gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Plan a birthday party for 20 people..."
          disabled={isLoading}
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={isLoading || input.trim().length === 0}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #34D399)" }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

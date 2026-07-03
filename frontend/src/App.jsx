import { useEffect, useRef, useState } from "react";

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

function ChatView({ messages, input, setInput, onSend, isLoading, error }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend();
  };

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
        onSubmit={handleSubmit}
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

function ChecklistView({ items, onToggle, onReset }) {
  const doneCount = items.filter((item) => item.done).length;

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-6">
      <div className="max-w-lg w-full mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Your Checklist
          </h2>
          <span className="text-sm text-slate-500">
            {doneCount} / {items.length} done
          </span>
        </div>

        <div className="h-2 rounded-full bg-slate-200 mb-6 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${items.length > 0 ? (doneCount / items.length) * 100 : 0}%`,
              background: "linear-gradient(90deg, #8B5CF6, #34D399)",
            }}
          />
        </div>

        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i}>
              <label className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm cursor-pointer hover:border-purple-300 transition-colors">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => onToggle(i)}
                  className="mt-0.5 h-4 w-4 accent-purple-600 cursor-pointer"
                />
                <span
                  className={`text-sm leading-relaxed ${
                    item.done
                      ? "line-through text-slate-400"
                      : "text-slate-800"
                  }`}
                >
                  {item.text}
                </span>
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 flex items-start gap-3">
          <span className="text-lg">🔗</span>
          <p className="text-sm text-purple-800">
            Future iterations will connect to existing to-do apps like Google
            Calendar, Trello, etc.
          </p>
        </div>

        <button
          onClick={onReset}
          className="mt-6 w-full rounded-xl px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #34D399)" }}
        >
          Start New Task
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [checklistItems, setChecklistItems] = useState([]);

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
        setChecklistItems(items.map((item) => ({ text: item, done: false })));
        setIsFinalized(true);
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

  const toggleItem = (index) => {
    setChecklistItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, done: !item.done } : item
      )
    );
  };

  const resetSession = () => {
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setInput("");
    setError(null);
    setIsFinalized(false);
    setChecklistItems([]);
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
        <img
          src="/AuraList-logo.png"
          alt="AuraList"
          className="h-9"
        />
        <div className="ml-auto">
          <p className="text-xs text-slate-500">
            {isFinalized
              ? "Checklist ready — check items off as you go"
              : "Break your task into steps"}
          </p>
        </div>
      </header>

      <main className="flex-1 min-h-0 max-w-2xl w-full mx-auto">
        {isFinalized ? (
          <ChecklistView
            items={checklistItems}
            onToggle={toggleItem}
            onReset={resetSession}
          />
        ) : (
          <ChatView
            messages={messages}
            input={input}
            setInput={setInput}
            onSend={sendMessage}
            isLoading={isLoading}
            error={error}
          />
        )}
      </main>
    </div>
  );
}

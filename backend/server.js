import "dotenv/config";
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const PORT = 3000;

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!DEEPSEEK_API_KEY && !GEMINI_API_KEY) {
  console.error(
    "Missing API keys. Copy backend/.env.example to backend/.env and add DEEPSEEK_API_KEY (primary) and/or GEMINI_API_KEY (fallback)."
  );
  process.exit(1);
}

if (!DEEPSEEK_API_KEY) {
  console.warn(
    "DEEPSEEK_API_KEY is not set. Falling back to Gemini as the primary provider."
  );
}
if (!GEMINI_API_KEY) {
  console.warn(
    "GEMINI_API_KEY is not set. No fallback provider is configured."
  );
}

const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const SYSTEM_INSTRUCTION = `You are a task breakdown assistant. Your job is to help the user break a task they submit into a clear, actionable checklist.

Follow these rules strictly:
1. When the user submits a task, ask clarifying questions if anything important is ambiguous (scope, deadline, tools, skill level). Ask at most 1-2 questions per message.
2. Once you have enough information, propose a breakdown of the task as a bulleted list and ask the user if they are happy with it or want changes.
3. Iterate on the breakdown based on the user's feedback.
4. Only when the user explicitly confirms they are happy with the breakdown, output the FINAL checklist. The final message must contain:
   - A short one-line intro.
   - The checklist, with every item on its own line starting with "- ".
   - The exact string [CHECKLIST_FINALIZED] on its own line at the very end of the response.
5. Never output [CHECKLIST_FINALIZED] before the user has confirmed the breakdown.
6. Keep responses concise and friendly.`;

// In-memory chat sessions, keyed by the sessionId the frontend generates.
// Each session holds a provider-neutral message history so we can route it to
// DeepSeek (primary) or Gemini (fallback) interchangeably.
// Sessions live for the lifetime of this process only.
const sessions = new Map();

function getHistory(sessionId) {
  let history = sessions.get(sessionId);
  if (!history) {
    history = [];
    sessions.set(sessionId, history);
  }
  return history;
}

// Calls DeepSeek's OpenAI-compatible chat completions endpoint.
async function generateWithDeepSeek(history) {
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `DeepSeek request failed: ${response.status} ${response.statusText} ${detail}`
    );
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (typeof reply !== "string" || reply.length === 0) {
    throw new Error("DeepSeek returned an empty response.");
  }
  return reply;
}

// Calls Gemini using the provider-neutral history. The last entry must be the
// current user message; everything before it becomes the chat history.
async function generateWithGemini(history) {
  if (!genAI) {
    throw new Error("Gemini fallback is not configured (missing GEMINI_API_KEY).");
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const priorTurns = history.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const latest = history[history.length - 1];

  const chat = model.startChat({ history: priorTurns });
  const result = await chat.sendMessage(latest.content);
  return result.response.text();
}

const app = express();
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    const { sessionId, message } = req.body ?? {};

    if (typeof sessionId !== "string" || sessionId.length === 0) {
      return res.status(400).json({ error: "sessionId is required." });
    }
    if (typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "message is required." });
    }

    const history = getHistory(sessionId);
    history.push({ role: "user", content: message.trim() });

    let reply;
    try {
      if (DEEPSEEK_API_KEY) {
        try {
          reply = await generateWithDeepSeek(history);
        } catch (err) {
          console.error("DeepSeek failed, falling back to Gemini:", err);
          reply = await generateWithGemini(history);
        }
      } else {
        reply = await generateWithGemini(history);
      }
    } catch (err) {
      // Both providers failed: drop the unanswered user turn so the session's
      // history stays valid (alternating roles) for the next request.
      history.pop();
      throw err;
    }

    history.push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch (err) {
    console.error("Error in /api/chat:", err);
    res.status(500).json({
      error: "Failed to get a response from the AI. Please try again.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

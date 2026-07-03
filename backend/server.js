import "dotenv/config";
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const PORT = 3000;

if (!process.env.GEMINI_API_KEY) {
  console.error(
    "Missing GEMINI_API_KEY. Copy backend/.env.example to backend/.env and add your key."
  );
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
// Sessions live for the lifetime of this process only.
const sessions = new Map();

function getChatSession(sessionId) {
  let chat = sessions.get(sessionId);
  if (!chat) {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
    });
    chat = model.startChat({ history: [] });
    sessions.set(sessionId, chat);
  }
  return chat;
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

    const chat = getChatSession(sessionId);
    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text();

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

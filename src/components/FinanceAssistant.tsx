import { useEffect, useRef, useState } from "react";
import { aiAssistant } from "../services/api";
import AssistantActions from "./AssistantActions";

type ChatMsg = {
  role: "user" | "assistant" | "system";
  text: string;
  actions?: Array<{ type: string; label?: string; params?: any }>;
};

export default function FinanceAssistant() {
  const [open, setOpen] = useState(false);   // Start closed by default; user can open manually
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      role: "system",
      text:
        "Hi! I can help with expenses, budgets, and income. Try:\n" +
        "• “How much did I spend on groceries last month?”\n" +
        "• “What’s my top category this quarter?”\n" +
        "• “What’s my income vs expenses this month?”\n" +
        "• “Am I over budget on groceries this month?”",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Quick prompts that cover expenses, budgets, and income
  const quickPrompts = [
    { label: "This week spend", text: "How much did I spend this week?" },
    { label: "Groceries last month", text: "How much did I spend on groceries last month?" },
    { label: "Over budget?", text: "Am I over budget on groceries this month?" },
    { label: "Income vs expenses", text: "What is my income vs expenses this month?" },
    { label: "Top category Q", text: "What’s my top category this quarter?" },
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs, open]);

  async function sendMessageWith(content: string) {
    const msg = content.trim();
    if (!msg || busy) return;

    setMsgs((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setBusy(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setMsgs((m) => [
          ...m,
          { role: "assistant", text: "Please sign in to use the assistant." },
        ]);
        return;
      }

      const resp = await aiAssistant(token, msg);
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          text: resp?.reply || "I couldn’t find an answer.",
          actions: Array.isArray(resp?.actions) ? resp.actions : [],
        },
      ]);
    } catch (err) {
      console.error("assistant error", err);
      setMsgs((m) => [
        ...m,
        { role: "assistant", text: "Sorry—something went wrong. Please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function sendMessage() {
    void sendMessageWith(input);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="assistant-wrap">
      {!open ? (
        <button
          type="button"
          className="assistant-trigger"
          onClick={() => setOpen(true)}
          aria-label="Open Finance Assistant"
        >
          <span aria-hidden>💬</span>
          Finance Assistant
        </button>
      ) : (
        <div className="assistant-panel">
          <div className="assistant-header">
            <span className="assistant-header-title">Finance Assistant</span>
            <button
              type="button"
              className="assistant-header-close"
              onClick={() => setOpen(false)}
              disabled={busy}
              aria-label="Close assistant"
            >
              Close
            </button>
          </div>

          <div className="assistant-quick-bar">
            {quickPrompts.map((q, i) => (
              <button
                key={i}
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => void sendMessageWith(q.text)}
                disabled={busy}
                title={q.text}
              >
                {q.label}
              </button>
            ))}
          </div>

          <div className="assistant-body" ref={scrollRef}>
            <div className="assistant-messages">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`assistant-bubble assistant-bubble--${m.role}`}
                >
                  <div>{m.text}</div>
                  {m.actions && m.actions.length > 0 && (
                    <AssistantActions actions={m.actions} />
                  )}
                </div>
              ))}
              {busy && (
                <div className="assistant-bubble assistant-bubble--assistant">
                  Thinking…
                </div>
              )}
            </div>
          </div>

          <div className="assistant-input-bar">
            <input
              type="text"
              className="form-control"
              placeholder='e.g. "Am I over budget on dining this month?"'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy}
              aria-label="Message the assistant"
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={sendMessage}
              disabled={busy || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
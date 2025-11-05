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

  // Floating styles (unchanged)
const wrap: React.CSSProperties = {
  position: "fixed",
  right: 16,
  bottom: 16,
  zIndex: 3000,
  pointerEvents: "auto",
};

// Panel uses theme variables
const panel: React.CSSProperties = {
  width: 360,
  maxWidth: "92vw",
  height: "70vh",
  maxHeight: "85vh",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
  borderRadius: 12,
  overflow: "hidden",
  background: "var(--bs-body-bg)",
  color: "var(--bs-body-color)",
  border: "1px solid var(--bs-border-color)",
};

// Header uses primary color & contrast
const header: React.CSSProperties = {
  background: "var(--bs-primary)",
  color: "var(--bs-primary-contrast)",
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flex: "0 0 auto",
};

// Quick prompts bar uses subtle surface + border
const quickBar: React.CSSProperties = {
  background: "var(--bs-tertiary-bg)",
  borderBottom: "1px solid var(--bs-border-color)",
  padding: "8px 10px",
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  flex: "0 0 auto",
};

// Body uses body surface/colors
const body: React.CSSProperties = {
  background: "var(--bs-body-bg)",
  color: "var(--bs-body-color)",
  overflowY: "auto",
  padding: 12,
  flex: "1 1 auto",
};

// Input bar matches quickBar surface
const inputBar: React.CSSProperties = {
  background: "var(--bs-tertiary-bg)",
  padding: 10,
  display: "flex",
  gap: 8,
  alignItems: "center",
  borderTop: "1px solid var(--bs-border-color)",
  flex: "0 0 auto",
};

// Chat bubbles adapt by role, all variable-driven
const bubble = (role: ChatMsg["role"]): React.CSSProperties => {
  // Subtle backgrounds that flip with theme
  const bg =
    role === "user"
      ? "var(--bs-primary-bg-subtle)"
      : role === "system"
      ? "var(--bs-secondary-bg)"
      : "var(--bs-tertiary-bg)";

  return {
    whiteSpace: "pre-wrap",
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    background: bg,
    color: "var(--bs-body-color)",
    border: "1px solid var(--bs-border-color)",
    borderRadius: 10,
    padding: "8px 10px",
    maxWidth: "85%",
    marginBottom: 8,
  };
};

  return (
    <div style={wrap}>
      {!open ? (
        <button
          type="button"
          className="btn btn-primary rounded-pill shadow"
          onClick={() => setOpen(true)}
        >
          💬 Finance Assistant
        </button>
      ) : (
        <div style={panel}>
          <div style={header}>
            <strong>Finance Assistant</strong>
            <button
             type="button"
             className="btn btn-sm btn-outline-light"
             onClick={() => setOpen(false)}
             disabled={busy}
           >
             Close
            </button>
          </div>

          {/* Quick prompts for Expenses, Budgets, and Income */}
          <div style={quickBar}>
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

          <div style={body} ref={scrollRef}>
            <div className="d-flex flex-column">
              {msgs.map((m, i) => (
                <div key={i} style={bubble(m.role)}>
                  <div>{m.text}</div>
                  {m.actions && m.actions.length > 0 && (
                    <AssistantActions actions={m.actions} />
                  )}
                </div>
              ))}
              {busy && <div style={bubble("assistant")}>Thinking…</div>}
            </div>
          </div>

          <div style={inputBar}>
            <input
              type="text"
              className="form-control"
              placeholder='e.g. "Am I over budget on dining this month?"'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy}
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
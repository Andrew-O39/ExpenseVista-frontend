import { useEffect, useRef, useState } from "react";
import { aiAssistant } from "../services/api";
import AssistantActions from "./AssistantActions";

type ChatMsg = {
  role: "user" | "assistant" | "system";
  text: string;
  actions?: Array<{ type: string; label?: string; params?: any }>;
};

export default function FinanceAssistant() {
  const [open, setOpen] = useState(true); // set true if you want it open for testing
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      role: "system",
      text:
        "Hi! Ask me things like:\n" +
        "• How much did I spend on groceries last month?\n" +
        "• What’s my top category this quarter?\n" +
        "• Am I on track with my budgets?",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs, open]);

  async function sendMessage() {
    const content = input.trim();
    if (!content || busy) return;

    setMsgs((m) => [...m, { role: "user", text: content }]);
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

      const resp = await aiAssistant(token, content);
      // Expect: { reply: string, actions?: [...] }
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

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  // Always on top & clickable
  const wrap: React.CSSProperties = {
    position: "fixed",
    right: 16,
    bottom: 16,
    zIndex: 3000,
    pointerEvents: "auto",
  };
  const panel: React.CSSProperties = {
    width: 340,
    maxHeight: 520,
    boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
    borderRadius: 12,
    overflow: "hidden",
    background: "#fff",
  };
  const header: React.CSSProperties = {
    background: "#0d6efd",
    color: "#fff",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };
  const body: React.CSSProperties = {
    background: "#fff",
    height: 360,
    overflowY: "auto",
    padding: 12,
  };
  const inputBar: React.CSSProperties = {
    background: "#f8f9fa",
    padding: 10,
    display: "flex",
    gap: 8,
    alignItems: "center",
    borderTop: "1px solid #e9ecef",
  };
  const bubble = (role: ChatMsg["role"]): React.CSSProperties => ({
    whiteSpace: "pre-wrap",
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    background:
      role === "user" ? "#e7f1ff" : role === "system" ? "#f8f9fa" : "#f1f3f5",
    border: "1px solid #e3e6ea",
    borderRadius: 10,
    padding: "8px 10px",
    maxWidth: "85%",
    marginBottom: 8,
  });

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
              className="btn btn-sm btn-light"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Close
            </button>
          </div>

          <div style={body} ref={scrollRef}>
            <div className="d-flex flex-column">
              {msgs.map((m, i) => (
                <div key={i} style={bubble(m.role)}>
                  <div>{m.text}</div>
                  {/* Action buttons (if any) */}
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
              placeholder='e.g. "See my groceries this month"'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void sendMessage()}
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
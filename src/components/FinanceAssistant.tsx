import { useEffect, useRef, useState } from "react";
import { aiAssistant } from "../services/api";
import AssistantActions from "./AssistantActions";

type ChatMsg = {
  role: "user" | "assistant" | "system";
  text: string;
  actions?: Array<{ type: string; label?: string; params?: any }>;
};

export default function FinanceAssistant() {
  const [open, setOpen] = useState(false);
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
    // auto-scroll to bottom on new messages
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
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          text: resp?.reply || "I couldn’t find an answer.",
          actions: Array.isArray(resp?.actions) ? resp.actions : [],
        },
      ]);
    } catch (err) {
      setMsgs((m) => [
        ...m,
        { role: "assistant", text: "Sorry—something went wrong. Please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  // Floating container
  const floatingWrap: React.CSSProperties = {
    position: "fixed",
    right: 16,
    bottom: 16,
    zIndex: 3000,
    pointerEvents: "auto",
  };

  // Panel is a flex column so footer stays visible
  const panel: React.CSSProperties = {
    width: 380,
    maxWidth: "92vw",
    height: "70vh",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
    overflow: "hidden",
  };

  const header: React.CSSProperties = {
    background: "#0d6efd",
    color: "#fff",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flex: "0 0 auto",
  };

  const body: React.CSSProperties = {
    padding: 12,
    overflowY: "auto",
    flex: "1 1 auto",
    background: "#fff",
  };

  const inputBar: React.CSSProperties = {
    background: "#f8f9fa",
    borderTop: "1px solid #e9ecef",
    padding: 10,
    display: "flex",
    gap: 8,
    alignItems: "flex-end",
    flex: "0 0 auto",
  };

  const bubble = (role: ChatMsg["role"]): React.CSSProperties => ({
    whiteSpace: "pre-wrap",
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    background: role === "user" ? "#e7f1ff" : role === "system" ? "#f8f9fa" : "#f1f3f5",
    border: "1px solid #e3e6ea",
    borderRadius: 10,
    padding: "8px 10px",
    maxWidth: "85%",
    marginBottom: 8,
  });

  return (
    <div style={floatingWrap}>
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
                  {m.actions && m.actions.length > 0 && (
                    <AssistantActions actions={m.actions} />
                  )}
                </div>
              ))}
              {busy && <div style={bubble("assistant")}>Thinking…</div>}
            </div>
          </div>

          <div style={inputBar}>
            <textarea
              className="form-control"
              placeholder='e.g. "How much did I spend on groceries last month?"'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy}
              rows={2}
              style={{
                resize: "none",
                maxHeight: 120,
                minHeight: 44,
              }}
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
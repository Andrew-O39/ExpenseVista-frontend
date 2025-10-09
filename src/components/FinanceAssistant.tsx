import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { aiAssistant } from "../services/api";

type ChatMsg = {
  role: "user" | "assistant" | "system";
  text: string;
  actions?: Array<{ type: string; label?: string; params?: any }>;
};

// Build /expenses?start_date=...&end_date=...&category=...&search=...
function buildExpensesUrl(params: Record<string, any> = {}) {
  const usp = new URLSearchParams();
  if (params.category) usp.set("category", params.category);
  if (params.search)   usp.set("search", params.search);
  if (params.start)    usp.set("start_date", params.start); // ISO
  if (params.end)      usp.set("end_date", params.end);     // ISO
  if (params.limit)    usp.set("limit", String(params.limit));
  if (params.page)     usp.set("page", String(params.page));
  const qs = usp.toString();
  return qs ? `/expenses?${qs}` : `/expenses`;
}

function AssistantActions({ actions }: { actions?: ChatMsg["actions"] }) {
  const navigate = useNavigate();
  if (!actions || actions.length === 0) return null;

  const handle = (a: NonNullable<ChatMsg["actions"]>[number]) => {
    switch (a.type) {
      case "view_expenses":
      case "link": {
        navigate(buildExpensesUrl(a.params || {}));
        break;
      }
      case "show_breakdown": {
        navigate("/dashboard?focus=breakdown");
        break;
      }
      default:
        console.warn("Unknown assistant action:", a);
    }
  };

  return (
    <div className="d-flex flex-wrap gap-2 mt-2">
      {actions.map((a, i) => (
        <button
          key={i}
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => handle(a)}
          title={a.type}
        >
          {a.label || a.type}
        </button>
      ))}
    </div>
  );
}

export default function FinanceAssistant() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      role: "system",
      text:
        "Hi! I can answer questions like:\n• How much did I spend on groceries last month?\n" +
        "• What’s my top category this quarter?\n• Am I on track with my budgets?",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  async function sendMessage() {
    const content = input.trim();
    if (!content) return;

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
          actions: resp?.actions || [],
        },
      ]);
    } catch {
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
      if (!busy) void sendMessage();
    }
  }

  // minimal inline styles to avoid extra CSS files
  const floatingWrap: React.CSSProperties = {
    position: "fixed",
    right: 16,
    bottom: 16,
    zIndex: 1050,
  };

  const panel: React.CSSProperties = {
    width: 340,
    maxHeight: 520,
    boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
    borderRadius: 12,
    overflow: "hidden",
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
        <div className="bg-white" style={panel}>
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
                  {m.text}
                  <AssistantActions actions={m.actions} />
                </div>
              ))}
              {busy && <div style={bubble("assistant")}>Thinking…</div>}
            </div>
          </div>

          <div style={inputBar}>
            <input
              type="text"
              className="form-control"
              placeholder='e.g. "How much did I spend on groceries last month?"'
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
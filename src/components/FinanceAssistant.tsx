import { useState } from "react";
import { aiAssistant } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function FinanceAssistant() {
  const [messages, setMessages] = useState<{role: "user"|"assistant"; text: string}[]>([
    { role: "assistant", text: "Hi! Ask me things like: “How much did I spend on groceries last month?”" }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages(m => [...m, { role: "user", text }]);
    setInput("");
    const token = localStorage.getItem("access_token");
    if (!token) return setMessages(m => [...m, { role: "assistant", text: "Please sign in first." }]);

    try {
      setBusy(true);
      const res = await aiAssistant(token, text);
      setMessages(m => [...m, { role: "assistant", text: res.reply }]);
      // naive action handler: show buttons inline
      if (res.actions?.length) {
        res.actions.forEach(a => {
          if (a.type === "navigate" && a.params?.route) {
            // You can render dedicated buttons; for quick demo, just append hint:
            setMessages(m => [...m, { role: "assistant", text: `→ ${a.label || "Open"} (${a.params.route})` }]);
          }
        });
      }
    } catch (e: any) {
      setMessages(m => [...m, { role: "assistant", text: "Sorry, I couldn’t process that." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header">Ask ExpenseVista</div>
      <div className="card-body" style={{ maxHeight: 260, overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i} className={`mb-2 ${m.role === "user" ? "text-end" : ""}`}>
            <span className={`badge ${m.role === "user" ? "bg-primary" : "bg-secondary"}`}>{m.role}</span>
            <div className="mt-1">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="card-footer d-flex gap-2">
        <input
          className="form-control"
          placeholder="e.g., How much did I spend on groceries last month?"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !busy && send()}
          disabled={busy}
        />
        <button className="btn btn-primary" onClick={send} disabled={busy}>Send</button>
      </div>
    </div>
  );
}
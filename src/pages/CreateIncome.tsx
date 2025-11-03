import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createIncome } from "../services/api";
import { useCurrency } from "../hooks/useCurrency";

function normalizeText(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, " ").normalize();
}

// Centralized FastAPI error extractor (kept here for this page)
function extractFastAPIError(err: any): string {
  const data = err?.response?.data;

  if (typeof data?.detail === "string") return data.detail;

  if (Array.isArray(data?.detail)) {
    const first = data.detail[0];
    const msg = first?.msg || first?.detail || first?.type;
    const loc = Array.isArray(first?.loc) ? first.loc.join(".") : first?.loc;
    return [msg, loc].filter(Boolean).join(" — ");
  }

  if (data?.message) return data.message;
  if (err?.message) return err.message;

  return "Something went wrong.";
}

export default function CreateIncome() {
  const navigate = useNavigate();
  const location = useLocation();
  const { symbol } = useCurrency(); // <-- NEW

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState(""); // optional
  const [notes, setNotes] = useState("");
  const [receivedAt, setReceivedAt] = useState(""); // from <input type="datetime-local">

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Only allow safe internal return paths and when onboarding=1
  const getReturnPath = () => {
    const qs = new URLSearchParams(location.search);
    const back = qs.get("return") || "";
    const onboarding = qs.get("onboarding") === "1";
    const internal = back.startsWith("/"); // prevent open redirects
    return onboarding && internal ? back : "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("You must be logged in to create an income.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    if (!category.trim()) {
      setError("Category is required.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        amount: Number(amount),
        category: normalizeText(category),
      };

      if (source.trim()) payload.source = normalizeText(source);
      if (notes.trim()) payload.notes = notes.trim();

      // Convert datetime-local (e.g. "2025-10-31T12:34") to ISO for the backend
      if (receivedAt && receivedAt.trim()) {
        const dt = new Date(receivedAt);
        if (!isNaN(dt.getTime())) {
          payload.received_at = dt.toISOString();
        }
      }

      await createIncome(token, payload);

      setSuccess("Income recorded successfully!");

      const back = getReturnPath();
      setTimeout(() => navigate(back || "/incomes", { replace: true }), 500);

      // reset fields
      setAmount("");
      setCategory("");
      setSource("");
      setNotes("");
      setReceivedAt("");
    } catch (err: any) {
      console.error("Create income error payload:", err?.response?.data || err);
      setError(extractFastAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-start mt-5">
      <form
        onSubmit={handleSubmit}
        className="p-4 border rounded bg-white shadow"
        style={{ maxWidth: 420, width: "100%" }}
      >
        <h3 className="mb-4 text-center">Record Income</h3>

        <div className="mb-3">
          <label className="form-label">Amount ({symbol})</label> {/* <-- was (€) */}
          <input
            type="number"
            min="0.01"
            step="0.01"
            className="form-control"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Category (required)</label>
          <input
            className="form-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            placeholder="e.g., salary, freelance, interest"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Source (optional)</label>
          <input
            className="form-control"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g., company name, client, bank"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Received At (optional)</label>
          <input
            type="datetime-local"
            className="form-control"
            value={receivedAt}
            onChange={(e) => setReceivedAt(e.target.value)}
          />
          <div className="form-text">
            If empty, the server will use the created time.
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Notes (optional)</label>
          <textarea
            className="form-control"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra details…"
          />
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Creating..." : "Create Income"}
        </button>
      </form>
    </div>
  );
}
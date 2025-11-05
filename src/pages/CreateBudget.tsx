import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createBudget } from "../services/api";
import {
  getCurrencyCode,
  currencyFractionDigits,
} from "../utils/currency"; // <-- dynamic currency

type Period =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "half-yearly"
  | "yearly";

function normalizeCategory(cat: string): string {
  return cat.toLowerCase().trim().replace(/\s+/g, " ").normalize();
}

export default function CreateBudget() {
  const navigate = useNavigate();
  const location = useLocation();

  const [category, setCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [period, setPeriod] = useState<Period>("monthly");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // currency display + numeric step based on currency fraction digits
  const code = getCurrencyCode();
  const fraction = currencyFractionDigits(code);
  const step = fraction === 0 ? "1" : `0.${"0".repeat(fraction - 1)}1`; // e.g. 0.01, 0.001, or 1 for JPY

  // only allow safe internal return paths and when onboarding=1
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
      setError("You must be logged in to create a budget.");
      return;
    }

    if (!category.trim() || !limitAmount || Number(limitAmount) <= 0) {
      setError("Please enter a valid category and a positive amount.");
      return;
    }

    setLoading(true);
    try {
      await createBudget(token, {
        category: normalizeCategory(category),
        limit_amount: Number(limitAmount),
        period,
        notes: notes.trim() || undefined,
      });

      setSuccess("Budget created successfully!");

      const back = getReturnPath();
      setTimeout(() => navigate(back || "/budgets", { replace: true }), 500);
    } catch (err: any) {
      setError(err?.message || "Failed to create budget.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center mt-5">
      <form
        onSubmit={handleSubmit}
        className="p-4 border rounded bg-white shadow"
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <h3 className="mb-4 text-center">Create Budget</h3>

        <div className="mb-3">
          <label htmlFor="category" className="form-label">
            Category
          </label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-control"
            placeholder="e.g., groceries, transport"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="limitAmount" className="form-label">
            Limit Amount ({code})
          </label>
          <input
            id="limitAmount"
            type="number"
            min={step}
            step={step}
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="period" className="form-label">
            Period
          </label>
          <select
            id="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="form-select"
            required
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="half-yearly">Half-yearly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="notes" className="form-label">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-control"
            rows={3}
            placeholder="Any extra details…"
          />
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Creating..." : "Create Budget"}
        </button>
      </form>
    </div>
  );
}
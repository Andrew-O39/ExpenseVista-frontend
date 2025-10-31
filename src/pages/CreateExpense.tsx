// src/pages/CreateExpense.tsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createExpense, aiSuggestCategory, aiCategoryFeedback } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";

function normalizeCategory(cat: string) {
  return cat.toLowerCase().trim().replace(/\s+/g, " ").normalize();
}

export default function CreateExpense() {
  const location = useLocation();
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestInfo, setSuggestInfo] = useState<{ cat?: string; conf?: number; why?: string }>({});

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
      setError("You must be logged in to create an expense.");
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

    try {
      await createExpense(token, {
        amount: Number(amount),
        description: description.trim() || undefined,
        category: normalizeCategory(category),
        notes: notes.trim() || undefined,
      });

      // Optional: send feedback if we had a suggestion (accepted or overridden)
      try {
        if (suggestInfo.cat) {
          const chosen = normalizeCategory(category);
          const textForMapping = (description || category || "transaction").toLowerCase();
          await aiCategoryFeedback(token, textForMapping, chosen);
        }
      } catch {
        /* feedback shouldn't block UX */
      }

      setSuccess("Expense created successfully!");
      setDescription("");
      setAmount("");
      setCategory("");
      setNotes("");
      setSuggestInfo({});

      // Smart post-submit redirect
      const back = getReturnPath();
      setTimeout(() => navigate(back || "/expenses", { replace: true }), 500);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Failed to create expense.");
    }
  };

  const handleSuggest = async () => {
    setSuggestInfo({});
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Please sign in first.");
      return;
    }
    if (!description.trim() && !category.trim()) {
      alert("Add a description (or a rough category) first.");
      return;
    }

    try {
      setSuggesting(true);
      const resp = await aiSuggestCategory(token, {
        description: description || category || "transaction",
        amount: amount ? Number(amount) : undefined,
      });

      if (resp.suggested_category) {
        setCategory(resp.suggested_category);
        setSuggestInfo({
          cat: resp.suggested_category,
          conf: resp.confidence ?? 0,
          why: resp.rationale ?? undefined,
        });
        // Optional: immediate “accept” feedback when we auto-fill the suggestion
        try {
          const textForMapping = (description || category || "transaction").toLowerCase();
          await aiCategoryFeedback(token, textForMapping, resp.suggested_category);
        } catch {
          /* ignore feedback errors */
        }
      } else {
        alert("No suggestion available.");
      }
    } catch (e) {
      console.error(e);
      alert("Suggestion unavailable.");
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-start mt-5">
      <form
        onSubmit={handleSubmit}
        className="p-4 border rounded bg-white shadow"
        style={{ maxWidth: "480px", width: "100%" }}
      >
        <h3 className="mb-4 text-center">Create Expense</h3>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">
            Description (optional)
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-control"
            placeholder="e.g., Uber ride to airport"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="amount" className="form-label">
            Amount (€)
          </label>
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="mb-2">
          <label htmlFor="category" className="form-label">
            Category
          </label>
          <div className="input-group">
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-control"
              placeholder="e.g., transport, groceries"
              required
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleSuggest}
              disabled={suggesting}
              title="Suggest a category from description and history"
            >
              {suggesting ? "Suggesting…" : "Suggest"}
            </button>
          </div>
          <div className="form-text">Tip: enter a description first, then click “Suggest”.</div>

          <AnimatePresence>
            {suggestInfo.cat && (
              <motion.div
                key="suggest-banner"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="alert alert-light border mt-2 py-2 px-3 small d-flex justify-content-between align-items-center"
                style={{ borderColor: "#dee2e6" }}
              >
                <div>
                  💡 Suggested: <strong>{suggestInfo.cat}</strong>
                  {typeof suggestInfo.conf === "number" && (
                    <> ({Math.round(suggestInfo.conf * 100)}% confidence)</>
                  )}
                  {suggestInfo.why ? <> – {suggestInfo.why}</> : null}
                </div>

                <motion.button
                  type="button"
                  className="btn btn-sm btn-outline-primary ms-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    setCategory(suggestInfo.cat!);
                    // Optional: explicit acceptance feedback
                    try {
                      const token = localStorage.getItem("access_token");
                      if (token && suggestInfo.cat) {
                        const textForMapping = (description || category || "transaction").toLowerCase();
                        await aiCategoryFeedback(token, textForMapping, suggestInfo.cat);
                      }
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  Use suggestion
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
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
          />
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button type="submit" className="btn btn-primary w-100">
          Create Expense
        </button>
      </form>
    </div>
  );
}
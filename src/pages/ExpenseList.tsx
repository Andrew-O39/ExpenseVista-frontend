import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { getExpenses, deleteExpense } from "../services/api";
import { isTokenValid } from "../utils/auth";
import { useCurrency } from "../hooks/useCurrency";
import { formatCurrency } from "../utils/currency";

type Expense = {
  id: number;
  category: string;
  amount: number;
  description?: string;
  notes?: string;
  created_at: string;
};

type QuickRange = "all" | "week" | "month" | "quarter" | "half-year" | "custom";

export default function ExpenseList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // ---------- UI state ----------
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [hasMore, setHasMore]   = useState(true);

  // Controls (reflected in URL)
  const [page, setPage]         = useState(1);
  const [limit, setLimit]       = useState(10);
  const [search, setSearch]     = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [range, setRange]       = useState<QuickRange>("all");
  const [startDate, setStartDate] = useState(""); // yyyy-mm-dd (for custom picker)
  const [endDate, setEndDate]     = useState(""); // yyyy-mm-dd

  const token = (typeof window !== "undefined" ? localStorage.getItem("access_token") : null) as string | null;

  // NEW: access current currency (symbol, code if you need it later)
  useCurrency();

  // ---------- Helpers ----------
  const toISO = (d: Date) => d.toISOString();

  const computeRange = (r: QuickRange): { start?: string; end?: string } => {
    const now = new Date();

    if (r === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start: toISO(start), end: toISO(end) };
    }

    if (r === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start: toISO(start), end: toISO(end) };
    }

    if (r === "quarter") {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1);
      const end   = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
      return { start: toISO(start), end: toISO(end) };
    }

    if (r === "half-year") {
      const firstHalf = now.getMonth() < 6;
      const start = new Date(now.getFullYear(), firstHalf ? 0 : 6, 1);
      const end   = new Date(now.getFullYear(), firstHalf ? 6 : 12, 0, 23, 59, 59, 999);
      return { start: toISO(start), end: toISO(end) };
    }

    // 'all' and 'custom' handled outside this helper
    return {};
  };

  const fmt = (iso: string) => new Date(iso).toLocaleString();

  // ---------- URL sync (single source of truth) ----------
  const updateUrl = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    const setOrDel = (k: string, v?: string | number) => {
      if (v === undefined || v === "" || v === null) params.delete(k);
      else params.set(k, String(v));
    };

    // write current state first
    setOrDel("search", search);
    setOrDel("page", page);
    setOrDel("limit", limit);

    // if we’re in custom (or coming from assistant) keep explicit dates
    if (range === "custom") {
      setOrDel("start_date", startDate ? `${startDate}T00:00:00Z` : undefined);
      setOrDel("end_date",   endDate   ? `${endDate}T23:59:59Z` : undefined);
    } else {
      // when not custom, we only keep dates if overrides provide them
      // (e.g., assistant deep-link). Otherwise clear.
      if (!("start_date" in overrides)) params.delete("start_date");
      if (!("end_date" in overrides))   params.delete("end_date");
    }

    // apply overrides last (they win)
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined) params.delete(k);
      else params.set(k, String(v));
    });

    setSearchParams(params);
  };

  // ---------- Data fetcher (uses parsed values) ----------
  const fetchExpenses = async (opts: {
    page: number;
    limit: number;
    search?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    if (!token || !isTokenValid()) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data: Expense[] = await getExpenses(token, {
        search: opts.search,
        startDate: opts.start_date,
        endDate: opts.end_date,
        page: opts.page,
        limit: opts.limit,
      });

      // paging guard
      setHasMore(data.length >= opts.limit);

      if (opts.page === 1) setExpenses(data);
      else
        setExpenses((prev) => [
          ...prev,
          ...data.filter((d) => !prev.some((p) => p.id === d.id)),
        ]);
    } catch (err) {
      console.error("Failed to load expenses:", err);
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  // ---------- React to URL changes (assistant & local UI both land here) ----------
  useEffect(() => {
    // parse URL
    const qs = new URLSearchParams(location.search);
    const qpSearch   = qs.get("search") || "";
    const qpStartISO = qs.get("start_date") || "";
    const qpEndISO   = qs.get("end_date") || "";
    const qpPage     = Math.max(1, Number(qs.get("page") || "1"));
    const qpLimit    = Math.max(1, Number(qs.get("limit") || "10"));

    // sync to state
    setSearch(qpSearch);
    setSearchInput(qpSearch);
    setPage(qpPage);
    setLimit(qpLimit);

    if (qpStartISO || qpEndISO) {
      setRange("custom");
      setStartDate(qpStartISO ? qpStartISO.slice(0, 10) : "");
      setEndDate(qpEndISO ? qpEndISO.slice(0, 10) : "");
    } else {
      // if URL carries no dates, keep user’s current "range" unless it was "custom"
      setRange((prev) => (prev === "custom" ? "all" : prev));
      setStartDate("");
      setEndDate("");
    }

    // fetch with exactly what the URL says (single source of truth)
    setHasMore(true);
    fetchExpenses({
      page: qpPage,
      limit: qpLimit,
      search: qpSearch || undefined,
      start_date: qpStartISO || undefined,
      end_date: qpEndISO || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // ---------- Handlers (always update URL; effect above will fetch) ----------
  const handleSearchApply = () => {
    const val = searchInput.trim();
    setSearch(val);
    setPage(1);
    updateUrl({ search: val || undefined, page: 1 });
  };

  const handleRangeApply = () => {
    // If custom, validate and push those
    if (range === "custom") {
      if (startDate && endDate && startDate > endDate) {
        alert("Start date must be before end date.");
        return;
      }
      setPage(1);
      updateUrl({
        page: 1,
        start_date: startDate ? `${startDate}T00:00:00Z` : undefined,
        end_date: endDate ? `${endDate}T23:59:59Z` : undefined,
      });
      return;
    }

    // Non-custom ranges → compute locally, push exact dates to URL
    if (range !== "all") {
      const r = computeRange(range);
      const startISO = r.start ? r.start : undefined;
      const endISO   = r.end ? r.end : undefined;

      // reflect computed dates into the pickers (nice UX)
      setStartDate(startISO ? startISO.slice(0, 10) : "");
      setEndDate(endISO ? endISO.slice(0, 10) : "");

      setPage(1);
      updateUrl({
        page: 1,
        start_date: startISO,
        end_date: endISO,
      });
      return;
    }

    // 'all' → clear dates
    setStartDate("");
    setEndDate("");
    setPage(1);
    updateUrl({ page: 1, start_date: undefined, end_date: undefined });
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    updateUrl({ page: next });
  };

  const onLimitChange = (v: number) => {
    const newLimit = v > 0 ? v : 10;
    setLimit(newLimit);
    setPage(1);
    updateUrl({ page: 1, limit: newLimit });
  };

  const handleDelete = async (id: number) => {
    if (!token) {
      alert("You must be logged in to delete an expense.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
      await deleteExpense(token, id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      alert("Expense deleted successfully.");
    } catch (err: any) {
      console.error("Failed to delete expense:", err?.response?.data || err?.message);
      alert("Failed to delete expense. Please try again.");
    }
  };

  // Totals for current view
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses]
  );

  return (
    <div className="container p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">
          Your Expenses{" "}
          <span className="badge bg-light text-dark ms-2">
            {expenses.length} items · {formatCurrency(totalExpenses)}
          </span>
        </h2>
        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value) || 10)}
            style={{ width: 110 }}
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="row g-2 mb-3">
        <div className="col-md-5">
          <div className="input-group">
            <input
              className="form-control"
              placeholder="Search by category, description, notes..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleSearchApply} disabled={loading}>
              Search
            </button>
          </div>
        </div>

        <div className="col-md-3">
          <select
            className="form-select"
            value={range}
            onChange={(e) => setRange(e.target.value as QuickRange)}
          >
            <option value="all">All time</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="quarter">This quarter</option>
            <option value="half-year">This half-year</option>
            <option value="custom">Custom range</option>
          </select>
        </div>

        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            disabled={range !== "custom"}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            disabled={range !== "custom"}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="col-12 col-md-auto">
          <button
            className="btn btn-outline-primary w-100"
            onClick={handleRangeApply}
            disabled={loading}
          >
            Apply Range
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Table */}
      <table className="table table-striped mt-3">
        <thead>
          <tr>
            <th>Category</th>
            <th>Amount</th> {/* was: Amount (€) */}
            <th>Description</th>
            <th>Notes</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center text-muted py-4">
                No expenses found.
              </td>
            </tr>
          ) : (
            expenses.map((e) => (
              <tr key={e.id}>
                <td>{e.category}</td>
                <td>{formatCurrency(e.amount)}</td>
                <td>{e.description || "-"}</td>
                <td>{e.notes || "-"}</td>
                <td>{fmt(e.created_at)}</td>
                <td>
                  <div className="dropdown">
                    <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                      Actions
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <button className="dropdown-item" onClick={() => navigate(`/edit-expense/${e.id}`)}>
                          Edit
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item text-danger" onClick={() => handleDelete(e.id)}>
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Totals & Load more */}
      <div className="mt-3 alert alert-info">
        <strong>Total Expenses:</strong> {formatCurrency(totalExpenses)}
      </div>

      {hasMore && (
        <button className="btn btn-primary mt-3" disabled={loading || !hasMore} onClick={loadMore}>
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
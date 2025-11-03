// src/pages/IncomeList.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { getIncomes, deleteIncome } from "../services/api";
import { isTokenValid } from "../utils/auth";
import { formatMoney, getCurrencyCode } from "../utils/currency";

type Income = {
  id: number;
  amount: number;
  source: string;
  category?: string | null;
  notes?: string | null;
  received_at: string; // display this
};

type QuickRange = "all" | "week" | "month" | "quarter" | "half-year" | "custom";

export default function IncomeList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [range, setRange] = useState<QuickRange>("all");
  const [startDate, setStartDate] = useState(""); // yyyy-mm-dd
  const [endDate, setEndDate] = useState(""); // yyyy-mm-dd

  // prevents double fetch (URL-driven fetch first, then skip the state-driven effect once)
  const bootFromUrl = useRef(false);

  const token =
    (typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null) as string | null;

  const toISO = (d: Date) => d.toISOString();
  const currencyCode = getCurrencyCode();

  // Used only for manual quick-range filtering; assistant passes explicit start/end via URL
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
      const end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      return { start: toISO(start), end: toISO(end) };
    }
    if (r === "quarter") {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1);
      const end = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
      return { start: toISO(start), end: toISO(end) };
    }
    if (r === "half-year") {
      const firstHalf = now.getMonth() < 6;
      const start = new Date(now.getFullYear(), firstHalf ? 0 : 6, 1);
      const end = new Date(now.getFullYear(), firstHalf ? 6 : 12, 0, 23, 59, 59, 999);
      return { start: toISO(start), end: toISO(end) };
    }
    return {};
  };

  /** Sync URL helper (used from user actions; assistant sets URL directly) */
  const updateUrl = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    const apply = (k: string, v?: string | number | null) => {
      if (v === undefined || v === "" || v === null) params.delete(k);
      else params.set(k, String(v));
    };

    apply("search", search);
    apply("page", page);
    apply("limit", limit);

    if (range === "custom") {
      apply("start_date", startDate ? `${startDate}T00:00:00.000Z` : undefined);
      apply("end_date", endDate ? `${endDate}T23:59:59.999Z` : undefined);
    } else {
      params.delete("start_date");
      params.delete("end_date");
    }

    Object.entries(overrides).forEach(([k, v]) => apply(k, v as any));
    setSearchParams(params);
  };

  /**
   * Fetch incomes (can accept URL overrides to avoid depending on state).
   */
  const fetchIncomes = async (
    pageToLoad = 1,
    limitToUse = limit,
    overrides?: { startISO?: string; endISO?: string; search?: string }
  ) => {
    if (!token || !isTokenValid()) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let startISO: string | undefined = overrides?.startISO;
      let endISO: string | undefined = overrides?.endISO;
      const searchTerm = overrides?.search ?? search;

      if (!overrides) {
        // Use local filters
        if (range === "custom") {
          if (startDate) startISO = new Date(`${startDate}T00:00:00Z`).toISOString();
          if (endDate) endISO = new Date(`${endDate}T23:59:59Z`).toISOString();
        } else if (range !== "all") {
          const r = computeRange(range);
          startISO = r.start;
          endISO = r.end;
        }
      }

      const data: Income[] = await getIncomes(token, {
        search: searchTerm,
        startDate: startISO,
        endDate: endISO,
        page: pageToLoad,
        limit: limitToUse,
      });

      if (data.length < limitToUse) setHasMore(false);

      setIncomes((prev) =>
        pageToLoad === 1
          ? data
          : [...prev, ...data.filter((d) => !prev.some((p) => p.id === d.id))]
      );
    } catch (err) {
      console.error("Failed to load incomes:", err);
      setError("Failed to load incomes");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 1) Respond to URL changes (arriving from Assistant or manual edits).
   *    Immediately fetch with those URL params (no "Apply Range" needed).
   */
  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const qpSearch = qs.get("search") || "";
    const qpStartISO = qs.get("start_date") || "";
    const qpEndISO = qs.get("end_date") || "";
    const qpPage = Number(qs.get("page") || "1");
    const qpLimit = Number(qs.get("limit") || "10");

    // reflect URL → UI state (but we won't rely on it for this initial fetch)
    setSearch(qpSearch);
    setSearchInput(qpSearch);

    if (qpStartISO || qpEndISO) {
      setRange("custom");
      setStartDate(qpStartISO ? qpStartISO.slice(0, 10) : "");
      setEndDate(qpEndISO ? qpEndISO.slice(0, 10) : "");
    } else {
      setRange((prev) => (prev === "custom" ? "all" : prev));
      setStartDate("");
      setEndDate("");
    }

    const p = !Number.isNaN(qpPage) && qpPage > 0 ? qpPage : 1;
    const l = !Number.isNaN(qpLimit) && qpLimit > 0 ? qpLimit : 10;
    setPage(p);
    setLimit(l);

    setHasMore(true);

    // Mark that we’re fetching based on URL and skip the next state-driven effect once
    bootFromUrl.current = true;

    // Fetch *directly* with URL values (overrides), so no need to click "Apply Range"
    fetchIncomes(p, l, {
      startISO: qpStartISO || undefined,
      endISO: qpEndISO || undefined,
      search: qpSearch || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  /**
   * 2) Regular in-page changes (search/range/page/limit).
   *    Skip once right after a URL-driven fetch to avoid double fetch.
   */
  useEffect(() => {
    if (bootFromUrl.current) {
      bootFromUrl.current = false;
      return;
    }
    setHasMore(true);
    fetchIncomes(page, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, search, range, page, limit]);

  const handleDelete = async (id: number) => {
    if (!token) {
      alert("You must be logged in to delete an income.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this income?")) return;
    try {
      await deleteIncome(token, id);
      setIncomes((prev) => prev.filter((e) => e.id !== id));
      alert("Income deleted successfully.");
    } catch (err: any) {
      console.error("Failed to delete income:", err.response?.data || err.message);
      alert("Failed to delete income. Please try again.");
    }
  };

  const handleSearchApply = () => {
    setPage(1);
    const val = searchInput.trim();
    setSearch(val);
    updateUrl({ page: 1, search: val || undefined });
  };

  const handleRangeApply = () => {
    if (range === "custom" && startDate && endDate && startDate > endDate) {
      alert("Start date must be before end date.");
      return;
    }
    setPage(1);
    updateUrl({ page: 1 });
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    updateUrl({ page: next });
  };

  const onLimitChange = (v: number) => {
    setLimit(v);
    setPage(1);
    updateUrl({ page: 1, limit: v });
  };

  const fmt = (iso: string) => new Date(iso).toLocaleString();

  const totalIncomes = useMemo(
    () => incomes.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [incomes]
  );

  return (
    <div className="container p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">
          Your Incomes{" "}
          <span className="badge bg-light text-dark ms-2">
            {incomes.length} items · {formatMoney(totalIncomes)}
          </span>
        </h2>
        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value) || 10)}
            style={{ width: 120 }}
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate("/dashboard")}
          >
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
              placeholder="Search by source, category, notes..."
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

        {range === "custom" && (
          <div className="col-12 col-md-auto">
            <button
              className="btn btn-outline-primary w-100"
              onClick={handleRangeApply}
              disabled={loading}
            >
              Apply Range
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <table className="table table-striped mt-3">
        <thead>
          <tr>
            <th>Source</th>
            <th>Category</th>
            <th>Amount ({currencyCode})</th>
            <th>Notes</th>
            <th>Received At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {incomes.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center text-muted py-4">
                No incomes found.
              </td>
            </tr>
          ) : (
            incomes.map((e) => (
              <tr key={e.id}>
                <td>{e.source}</td>
                <td>{e.category || "-"}</td>
                <td>{formatMoney(e.amount)}</td>
                <td>{e.notes || "-"}</td>
                <td>{fmt(e.received_at)}</td>
                <td>
                  <div className="dropdown">
                    <button
                      className="btn btn-sm btn-outline-secondary dropdown-toggle"
                      data-bs-toggle="dropdown"
                    >
                      Actions
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => navigate(`/edit-income/${e.id}`)}
                        >
                          Edit
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item text-danger"
                          onClick={() => handleDelete(e.id)}
                        >
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

      {/* Totals */}
      <div className="mt-3 alert alert-info">
        <strong>Total Incomes:</strong> {formatMoney(totalIncomes)}
      </div>

      {hasMore && (
        <button
          className="btn btn-primary mt-3"
          disabled={loading || !hasMore}
          onClick={loadMore}
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
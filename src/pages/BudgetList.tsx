import { useEffect, useMemo, useState } from 'react';
import { getBudgets, deleteBudget } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { isTokenValid } from '../utils/auth';
import { useCurrency } from "../hooks/useCurrency";
import { formatCurrency } from "../utils/currency";

type Budget = {
  id: number;
  category: string;
  limit_amount: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
  notes?: string;
  created_at: string;
};

type PeriodFilter =
  | 'all'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'half-yearly'
  | 'yearly';

type QuickRange = 'all' | 'week' | 'month' | 'quarter' | 'half-year' | 'custom';

export default function BudgetList() {
  const navigate = useNavigate();
  const { symbol } = useCurrency(); // ⬅️ NEW

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [period, setPeriod] = useState<PeriodFilter>('all');

  const [range, setRange] = useState<QuickRange>('all');
  const [startDate, setStartDate] = useState(''); // yyyy-mm-dd
  const [endDate, setEndDate] = useState('');     // yyyy-mm-dd

  const token = localStorage.getItem('access_token');

  // Helpers
  const toISO = (d: Date) => d.toISOString();
  const fmt = (iso: string) => new Date(iso).toLocaleString();

  const computeRange = (r: QuickRange): { start?: string; end?: string } => {
    const now = new Date();

    if (r === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start: toISO(start), end: toISO(end) };
    }

    if (r === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start: toISO(start), end: toISO(end) };
    }

    if (r === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1);
      const end = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
      return { start: toISO(start), end: toISO(end) };
    }

    if (r === 'half-year') {
      const firstHalf = now.getMonth() < 6;
      const start = new Date(now.getFullYear(), firstHalf ? 0 : 6, 1);
      const end = new Date(
        now.getFullYear(),
        firstHalf ? 6 : 12,
        0,
        23,
        59,
        59,
        999
      );
      return { start: toISO(start), end: toISO(end) };
    }

    // 'all' or 'custom' (handled separately)
    return {};
  };

  const fetchBudgets = async (pageToLoad = 1) => {
    if (!token || !isTokenValid()) {
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    try {
      let startISO: string | undefined;
      let endISO: string | undefined;

      if (range === 'custom') {
        if (startDate) startISO = new Date(`${startDate}T00:00:00`).toISOString();
        if (endDate) endISO = new Date(`${endDate}T23:59:59`).toISOString();
      } else if (range !== 'all') {
        const r = computeRange(range);
        startISO = r.start;
        endISO = r.end;
      }

      const data: Budget[] = await getBudgets(token, {
        period: period !== 'all' ? period : undefined,
        search,
        startDate: startISO,
        endDate: endISO,
        page: pageToLoad,
        limit: 10,
      });

      if (data.length < 10) setHasMore(false);

      setBudgets(prev =>
        pageToLoad === 1
          ? data
          : [...prev, ...data.filter(d => !prev.some(p => p.id === d.id))]
      );
    } catch (err) {
      console.error('Failed to load budgets:', err);
      setError('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  // Refetch on filter changes (except changing custom dates until Apply is clicked)
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchBudgets(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, search, period, range]);

  const handleDelete = async (id: number) => {
    if (!token) {
      alert('You must be logged in to delete a budget.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this budget?')) return;

    try {
      await deleteBudget(token, id);
      setBudgets(prev => prev.filter(b => b.id !== id));
      alert('Budget deleted successfully.');
    } catch (err: any) {
      console.error('Failed to delete budget:', err.response?.data || err.message);
      alert('Failed to delete budget. Please try again.');
    }
  };

  const handleSearchApply = () => {
    setPage(1);
    setHasMore(true);
    setSearch(searchInput);
  };

  const handleRangeApply = () => {
    setPage(1);
    setHasMore(true);
    fetchBudgets(1);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchBudgets(next);
  };

  // Totals for what's currently in the table
  const totalBudgetLimit = useMemo(
    () => budgets.reduce((sum, b) => sum + (Number(b.limit_amount) || 0), 0),
    [budgets]
  );

  return (
    <div className="container p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">
          Your Budgets{' '}
          <span className="badge bg-light text-dark ms-2">
            {budgets.length} items · {formatCurrency(totalBudgetLimit)} {/* ⬅️ was euro() */}
          </span>
        </h2>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Filters */}
      <div className="row g-2 mb-3">
        {/* Search */}
        <div className="col-md-5">
          <div className="input-group">
            <input
              className="form-control"
              placeholder="Search by category or notes..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleSearchApply}>
              Search
            </button>
          </div>
        </div>

        {/* Period (server-side field) */}
        <div className="col-md-2">
          <select
            name="period"
            className="form-select"
            value={period}
            onChange={e =>
              setPeriod(
                e.target.value as PeriodFilter
              )
            }
          >
            <option value="all">All periods</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="half-yearly">Half-yearly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Quick date range (created_at filtering) */}
        <div className="col-md-3">
          <select
            className="form-select"
            value={range}
            onChange={e => setRange(e.target.value as QuickRange)}
          >
            <option value="all">All time</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="quarter">This quarter</option>
            <option value="half-year">This half-year</option>
            <option value="custom">Custom range</option>
          </select>
        </div>

        {/* Custom range pickers */}
        <div className="col-md-1">
          <input
            type="date"
            className="form-control"
            disabled={range !== 'custom'}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-1">
          <input
            type="date"
            className="form-control"
            disabled={range !== 'custom'}
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>

        {range === 'custom' && (
          <div className="col-12 col-md-auto">
            <button
              className="btn btn-outline-primary w-100"
              onClick={handleRangeApply}
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
            <th>Category</th>
            <th>Period</th>
            <th>Limit ({symbol})</th> {/* ⬅️ was “Limit (€)” */}
            <th>Notes</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map(b => (
            <tr key={b.id}>
              <td>{b.category}</td>
              <td>{b.period}</td>
              <td>{formatCurrency(b.limit_amount)}</td> {/* ⬅️ was €...toFixed(2) */}
              <td>{b.notes || '-'}</td>
              <td>{fmt(b.created_at)}</td>
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
                        onClick={() => navigate(`/edit-budget/${b.id}`)}
                      >
                        Edit
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={() => handleDelete(b.id)}
                      >
                        Delete
                      </button>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals row */}
      <div className="mt-3 alert alert-info">
        <strong>Total Budgeted:</strong> {formatCurrency(totalBudgetLimit)} {/* ⬅️ was euro() */}
      </div>

      {hasMore && (
        <button
          className="btn btn-primary mt-3"
          disabled={loading}
          onClick={loadMore}
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
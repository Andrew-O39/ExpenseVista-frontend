import { useEffect, useMemo, useState } from 'react';
import { getExpenses, deleteExpense } from '../services/api';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { isTokenValid } from '../utils/auth';

type Expense = {
  id: number;
  category: string;
  amount: number;
  description?: string;
  notes?: string;
  created_at: string;
};

type QuickRange = 'all' | 'week' | 'month' | 'quarter' | 'half-year' | 'custom';

export default function ExpenseList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<QuickRange>('all');
  const [startDate, setStartDate] = useState(''); // yyyy-mm-dd
  const [endDate, setEndDate] = useState('');     // yyyy-mm-dd

  const token = (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null) as string | null;

  const euro = (n: number) => `€${Number(n || 0).toFixed(2)}`;
  const toISO = (d: Date) => d.toISOString();

  const computeRange = (r: QuickRange): { start?: string; end?: string } => {
    const now = new Date();
    if (r === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0,0,0,0);
      const end = new Date(now);
      end.setHours(23,59,59,999);
      return { start: toISO(start), end: toISO(end) };
    }
    if (r === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end   = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999);
      return { start: toISO(start), end: toISO(end) };
    }
    if (r === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q*3, 1);
      const end   = new Date(now.getFullYear(), q*3+3, 0, 23,59,59,999);
      return { start: toISO(start), end: toISO(end) };
    }
    if (r === 'half-year') {
      const firstHalf = now.getMonth() < 6;
      const start = new Date(now.getFullYear(), firstHalf ? 0 : 6, 1);
      const end   = new Date(now.getFullYear(), firstHalf ? 6 : 12, 0, 23,59,59,999);
      return { start: toISO(start), end: toISO(end) };
    }
    return {};
  };

  /** Single source of truth: whenever the URL changes, we:
   *  - set the UI state to mirror the URL
   *  - fetch immediately using the URL values (no need to click "Apply")
   */
  useEffect(() => {
    const qs = new URLSearchParams(location.search);

    const qpSearch   = qs.get('search') || '';
    const qpCategory = qs.get('category') || ''; // treated as search
    const qpStartISO = qs.get('start_date') || '';
    const qpEndISO   = qs.get('end_date') || '';
    const qpPage     = Number(qs.get('page') || '1');
    const qpLimit    = Number(qs.get('limit') || '10');

    const effectiveSearch = qpSearch || qpCategory || '';
    setSearchInput(effectiveSearch);
    setSearch(effectiveSearch);

    if (qpStartISO || qpEndISO) {
      setRange('custom');
      setStartDate(qpStartISO ? qpStartISO.slice(0, 10) : '');
      setEndDate(qpEndISO ? qpEndISO.slice(0, 10) : '');
    } else {
      setRange('all');
      setStartDate('');
      setEndDate('');
    }

    setPage(!Number.isNaN(qpPage) && qpPage > 0 ? qpPage : 1);
    setLimit(!Number.isNaN(qpLimit) && qpLimit > 0 ? qpLimit : 10);

    // ---- Immediate fetch using the URL values (not the state we just set) ----
    if (!token || !isTokenValid()) {
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    setError(null);
    getExpenses(token, {
      search: effectiveSearch || undefined,
      startDate: qpStartISO || undefined,
      endDate: qpEndISO || undefined,
      page: (!Number.isNaN(qpPage) && qpPage > 0 ? qpPage : 1),
      limit: (!Number.isNaN(qpLimit) && qpLimit > 0 ? qpLimit : 10),
    })
      .then((data: Expense[]) => {
        setExpenses(data);
        setHasMore(data.length >= (!Number.isNaN(qpLimit) && qpLimit > 0 ? qpLimit : 10));
      })
      .catch((err) => {
        console.error('Failed to load expenses:', err);
        setError('Failed to load expenses');
      })
      .finally(() => setLoading(false));
  }, [location.search, navigate, token]);

  // ——— User actions update the URL; the effect above will fetch ———

  const updateUrl = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    const apply = (k: string, v?: string | number | null) => {
      if (v === undefined || v === '' || v === null) params.delete(k);
      else params.set(k, String(v));
    };

    apply('search', search);
    apply('page', page);
    apply('limit', limit);

    if (range === 'custom') {
      apply('start_date', startDate ? `${startDate}T00:00:00Z` : undefined);
      apply('end_date',   endDate   ? `${endDate}T23:59:59Z` : undefined);
    } else {
      params.delete('start_date');
      params.delete('end_date');
    }

    Object.entries(overrides).forEach(([k, v]) => apply(k, v as any));
    setSearchParams(params);
  };

  const handleSearchApply = () => {
    const val = searchInput.trim();
    setSearch(val);
    setPage(1);
    updateUrl({ page: 1, search: val || undefined });
  };

  const handleRangeApply = () => {
    if (range === 'custom' && startDate && endDate && startDate > endDate) {
      alert('Start date must be before end date.');
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

  const handleDelete = async (id: number) => {
    if (!token) {
      alert('You must be logged in to delete an expense.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteExpense(token, id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      alert('Expense deleted successfully.');
    } catch (err: any) {
      console.error('Failed to delete expense:', err.response?.data || err.message);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const fmt = (iso: string) => new Date(iso).toLocaleString();
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses]
  );

  return (
    <div className="container p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">
          Your Expenses{' '}
          <span className="badge bg-light text-dark ms-2">
            {expenses.length} items · {euro(totalExpenses)}
          </span>
        </h2>
        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            value={limit}
            onChange={e => onLimitChange(Number(e.target.value) || 10)}
            style={{ width: 100 }}
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
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
              onChange={e => setSearchInput(e.target.value)}
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

        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            disabled={range !== 'custom'}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-2">
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
            <button className="btn btn-outline-primary w-100" onClick={handleRangeApply} disabled={loading}>
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
            <th>Amount (€)</th>
            <th>Description</th>
            <th>Notes</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center text-muted py-4">No expenses found.</td>
            </tr>
          ) : (
            expenses.map(e => (
              <tr key={e.id}>
                <td>{e.category}</td>
                <td>€{e.amount.toFixed(2)}</td>
                <td>{e.description || '-'}</td>
                <td>{e.notes || '-'}</td>
                <td>{fmt(e.created_at)}</td>
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
                          onClick={() => navigate(`/edit-expense/${e.id}`)}
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

      {/* Totals row */}
      <div className="mt-3 alert alert-info">
        <strong>Total Expenses:</strong> {euro(totalExpenses)}
      </div>

      {hasMore && (
        <button
          className="btn btn-primary mt-3"
          disabled={loading || !hasMore}
          onClick={loadMore}
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
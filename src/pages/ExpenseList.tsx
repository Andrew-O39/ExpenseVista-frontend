import { useEffect, useMemo, useState } from 'react';
import { getExpenses, deleteExpense } from '../services/api';
import { useNavigate } from 'react-router-dom';
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [range, setRange] = useState<QuickRange>('all');
  const [startDate, setStartDate] = useState(''); // yyyy-mm-dd
  const [endDate, setEndDate] = useState('');     // yyyy-mm-dd

  const token = (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null) as string | null;

  // helper (fixed)
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
    // 'all' or 'custom' handled elsewhere
    return {};
  };

  const fetchExpenses = async (pageToLoad = 1) => {
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
        if (endDate)   endISO   = new Date(`${endDate}T23:59:59`).toISOString();
      } else if (range !== 'all') {
        const r = computeRange(range);
        startISO = r.start;
        endISO = r.end;
      }

      const data: Expense[] = await getExpenses(token, {
        search,
        startDate: startISO,
        endDate: endISO,
        page: pageToLoad,
        limit: 10,
      });

      if (data.length < 10) setHasMore(false);

      setExpenses(prev =>
        pageToLoad === 1
          ? data
          : [...prev, ...data.filter(d => !prev.some(p => p.id === d.id))]
      );
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchExpenses(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, search, range]);

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

  const handleSearchApply = () => {
    setPage(1);
    setHasMore(true);
    setSearch(searchInput.trim());
  };

  const handleRangeApply = () => {
  if (range === 'custom' && startDate && endDate && startDate > endDate) {
    alert('Start date must be before end date.');
    return;
  }
  setPage(1);
  setHasMore(true);
  fetchExpenses(1);
};

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchExpenses(next);
  };

  const fmt = (iso: string) => new Date(iso).toLocaleString();

  // Totals for what’s currently displayed
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
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
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
                          onClick={() => navigate(`/edit-expense/${e.id}`)} // fixed backticks
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
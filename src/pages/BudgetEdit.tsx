import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBudgetById, updateBudget } from '../services/api';
import { isTokenValid } from '../utils/auth';

type BudgetForm = {
  category: string;
  limit_amount: string; // keep as string for the input
  period: 'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
  notes: string;
};

export default function BudgetEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<BudgetForm>({
    category: '',
    limit_amount: '', // empty so you can type freely
    period: 'monthly',
    notes: '',
  });

  const token = localStorage.getItem('access_token');

  useEffect(() => {
    // auth guard
    if (!token || !isTokenValid()) {
      navigate('/login', { replace: true });
      return;
    }
    if (!id) {
      navigate('/budgets', { replace: true });
      return;
    }

    (async () => {
      try {
        const data = await getBudgetById(token, parseInt(id, 10));
        setBudget({
          category: data.category || '',
          // normalize to string; empty if missing
          limit_amount:
            data.limit_amount === null || data.limit_amount === undefined
              ? ''
              : String(data.limit_amount),
          period: (data.period as BudgetForm['period']) || 'monthly',
          notes: data.notes || '',
        });
      } catch {
        setError('Failed to load budget');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBudget(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;

    try {
      await updateBudget(token, parseInt(id, 10), {
        category: budget.category.trim(),
        limit_amount: Number(budget.limit_amount) || 0, // convert at the edge
        period: budget.period,
        notes: budget.notes.trim(),
      });
      navigate('/budgets');
    } catch {
      setError('Failed to update budget');
    }
  };

  if (loading) return <div className="container p-4">Loading...</div>;

  return (
    <div className="container p-4">
      <h2>Edit Budget</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Category</label>
          <input
            type="text"
            name="category"
            className="form-control"
            value={budget.category}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Limit (€)</label>
          <input
            type="number"
            name="limit_amount"
            className="form-control"
            value={budget.limit_amount}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Period</label>
          <select
            name="period"
            className="form-select"
            value={budget.period}
            onChange={handleChange}
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
          <label className="form-label">Notes</label>
          <textarea
            name="notes"
            className="form-control"
            value={budget.notes}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn btn-primary me-2">
          Save Changes
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/budgets')}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
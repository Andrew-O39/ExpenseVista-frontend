import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getExpenseById, updateExpense } from '../services/api';
import { isTokenValid } from '../utils/auth';
import { useCurrency } from "../hooks/useCurrency";
import { formatCurrency } from "../utils/currency";

type ExpenseForm = {
  category: string;
  amount: number;
  description: string;
  notes: string;
};

export default function ExpenseEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { symbol } = useCurrency(); // <-- NEW

  const [expense, setExpense] = useState<ExpenseForm>({
    category: '',
    amount: 0,
    description: '',
    notes: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('access_token');

  useEffect(() => {
    if (!token || !isTokenValid()) {
      navigate('/login', { replace: true });
      return;
    }

    if (!id) {
      navigate('/expenses');
      return;
    }

    const fetchExpense = async () => {
      try {
        setLoading(true);
        const data = await getExpenseById(token, parseInt(id));
        setExpense({
          category: data.category || '',
          amount: Number(data.amount) || 0,
          description: data.description || '',
          notes: data.notes || ''
        });
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load expense');
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [id, navigate, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExpense(prev => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;

    try {
      setSaving(true);
      setError(null);
      await updateExpense(token, parseInt(id), expense);
      navigate('/expenses');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update expense');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container p-4">Loading expense...</div>;

  return (
    <div className="container p-4">
      <h2>Edit Expense</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Category</label>
          <input
            name="category"
            className="form-control"
            value={expense.category}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Amount ({symbol})</label>{/* <-- was (€) */}
          <input
            type="number"
            name="amount"
            className="form-control"
            value={expense.amount}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Description</label>
          <input
            name="description"
            className="form-control"
            value={expense.description}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Notes</label>
          <textarea
            name="notes"
            className="form-control"
            value={expense.notes}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn btn-primary me-2" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/expenses')} disabled={saving}>
          Cancel
        </button>
      </form>
    </div>
  );
}
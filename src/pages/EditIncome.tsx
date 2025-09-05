import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getIncomeById, updateIncome } from '../services/api';
import { isTokenValid } from '../utils/auth';

type IncomeForm = {
  amount: number;
  source: string;
  category: string;
  notes: string;
  received_at: string; // ISO string
};

// --- helpers for datetime-local input ---
function isoToLocalDatetimeValue(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  // datetime-local expects "YYYY-MM-DDTHH:mm"
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function localDatetimeValueToIso(localValue?: string): string | undefined {
  if (!localValue) return undefined;
  // localValue like "YYYY-MM-DDTHH:mm"
  const dt = new Date(localValue);
  if (isNaN(dt.getTime())) return undefined;
  return dt.toISOString();
}

// --- simple normalization like your frontend pattern ---
function normalizeText(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ').normalize();
}

export default function EditIncome() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [income, setIncome] = useState<IncomeForm>({
    amount: 0,
    source: '',
    category: '',
    notes: '',
    received_at: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('access_token');

  useEffect(() => {
    // auth guard
    if (!token || !isTokenValid()) {
      navigate('/login', { replace: true });
      return;
    }
    if (!id) {
      navigate('/incomes');
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getIncomeById(token, Number(id));
        setIncome({
          amount: Number(data.amount) || 0,
          source: data.source ?? '',
          category: data.category ?? '',
          notes: data.notes ?? '',
          received_at: data.received_at ?? data.created_at ?? '',
        });
      } catch (e: any) {
        setError('Failed to load income');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, navigate, token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      setIncome(prev => ({ ...prev, amount: Number(value) }));
      return;
    }
    if (name === 'received_at') {
      // keep local datetime value in state as local string (we’ll convert on submit)
      setIncome(prev => ({ ...prev, received_at: value }));
      return;
    }

    setIncome(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;

    // basic validation
    if (!income.amount || income.amount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (!income.source.trim()) {
      setError('Source is required.');
      return;
    }
    if (!income.category.trim()) {
      setError('Category is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateIncome(token, Number(id), {
        amount: Number(income.amount),
        source: normalizeText(income.source),
        category: normalizeText(income.category),
        notes: income.notes?.trim() || undefined,
        received_at: localDatetimeValueToIso(income.received_at) || undefined,
      });
      navigate('/incomes'); // redirect to income list
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to update income');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container p-4">Loading...</div>;

  return (
    <div className="container p-4">
      <h2>Edit Income</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
        <div className="mb-3">
          <label className="form-label">Amount (€)</label>
          <input
            type="number"
            name="amount"
            min="0"
            step="0.01"
            className="form-control"
            value={income.amount}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Source</label>
          <input
            name="source"
            className="form-control"
            placeholder="e.g., salary, freelance, refund"
            value={income.source}
            onChange={handleChange}
            required
          />
          <div className="form-text">Will be normalized (lowercase, trimmed).</div>
        </div>

        <div className="mb-3">
          <label className="form-label">Category</label>
          <input
            name="category"
            className="form-control"
            placeholder="e.g., job, side hustle"
            value={income.category}
            onChange={handleChange}
            required
          />
          <div className="form-text">Will be normalized (lowercase, trimmed).</div>
        </div>

        <div className="mb-3">
          <label className="form-label">Received at</label>
          <input
            type="datetime-local"
            name="received_at"
            className="form-control"
            value={isoToLocalDatetimeValue(income.received_at)}
            onChange={handleChange}
          />
          <div className="form-text">Optional. Leave empty to keep existing server timestamp.</div>
        </div>

        <div className="mb-3">
          <label className="form-label">Notes</label>
          <textarea
            name="notes"
            className="form-control"
            rows={3}
            value={income.notes}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn btn-primary me-2" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/incomes')} disabled={saving}>
          Cancel
        </button>
      </form>
    </div>
  );
}
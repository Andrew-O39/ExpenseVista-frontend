import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIncome } from '../services/api';

function normalizeText(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, ' ').normalize();
}

// Put this near the top of CreateIncome.tsx
function extractFastAPIError(err: any): string {
  const data = err?.response?.data;

  if (typeof data?.detail === 'string') return data.detail;

  if (Array.isArray(data?.detail)) {
    // FastAPI validation errors -> pick the first useful message
    const first = data.detail[0];
    const msg = first?.msg || first?.detail || first?.type;
    const loc = Array.isArray(first?.loc) ? first.loc.join('.') : first?.loc;
    return [msg, loc].filter(Boolean).join(' — ');
  }

  if (data?.message) return data.message;
  if (err?.message) return err.message;

  return 'Something went wrong.';
}

export default function CreateIncome() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [receivedAt, setReceivedAt] = useState(''); // optional ISO date-time
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('You must be logged in to create an income.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (!category.trim()) {
      setError('Category is required.');
      return;
    }

    try {
  const payload: any = {
    amount: Number(amount),
    category: normalizeText(category),
  };

  if (source.trim()) payload.source = normalizeText(source);
  if (notes.trim()) payload.notes = notes.trim();
  if (receivedAt && receivedAt.trim()) payload.received_at = receivedAt.trim(); // ISO string from <input type="datetime-local"> or date

  if (!payload.amount || payload.amount <= 0) {
    setError('Amount must be greater than zero.');
    return;
  }
  if (!payload.category) {
    setError('Category is required.');
    return;
  }

  await createIncome(token, payload);

  setSuccess('Income recorded successfully!');
  setTimeout(() => navigate('/incomes'), 700);

  setAmount('');
  setCategory('');
  setSource('');
  setNotes('');
  setReceivedAt('');
} catch (err: any) {
  console.error('Create income error payload:', err?.response?.data || err);
  setError(extractFastAPIError(err));
}
  };

  return (
    <div className="d-flex justify-content-center align-items-start mt-5">
      <form onSubmit={handleSubmit} className="p-4 border rounded bg-white shadow" style={{ maxWidth: 420, width: '100%' }}>
        <h3 className="mb-4 text-center">Record Income</h3>

        <div className="mb-3">
          <label className="form-label">Amount (€)</label>
          <input type="number" min="0" step="0.01" className="form-control"
            value={amount} onChange={e => setAmount(e.target.value)} required />
        </div>

        <div className="mb-3">
          <label className="form-label">Category (Required)</label>
          <input className="form-control" value={category} onChange={e => setCategory(e.target.value)} required />
          <div className="form-text">e.g. salary, freelance, interest</div>
        </div>

        <div className="mb-3">
          <label className="form-label">Source (Required)</label>
          <input className="form-control" value={source} onChange={e => setSource(e.target.value)} />
          <div className="form-text">e.g. company name, client, bank</div>
        </div>

        <div className="mb-3">
          <label className="form-label">Received At (optional)</label>
          <input type="datetime-local" className="form-control"
            value={receivedAt} onChange={e => setReceivedAt(e.target.value)} />
        </div>

        <div className="mb-3">
          <label className="form-label">Notes (optional)</label>
          <textarea className="form-control" rows={3}
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button type="submit" className="btn btn-primary w-100">Create Income</button>
      </form>
    </div>
  );
}
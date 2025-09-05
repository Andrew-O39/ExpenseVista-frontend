import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBudget } from '../services/api';

function normalizeCategory(cat: string): string {
  return cat.toLowerCase().trim().replace(/\s+/g, ' ').normalize();
}

export default function CreateBudget() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly'>('monthly');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('You must be logged in to create a budget.');
      return;
    }

    if (!category.trim() || !limitAmount || Number(limitAmount) <= 0) {
      setError('Please enter a valid category and positive amount.');
      return;
    }

    setLoading(true);
    try {
      await createBudget(token, {
        category: normalizeCategory(category),
        limit_amount: Number(limitAmount),
        period,
        notes: notes.trim() || undefined,
      });
      setSuccess('Budget created successfully!');
      // Optionally redirect back to dashboard after short delay
      setTimeout(() => navigate('/budgets'), 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to create budget.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center mt-5">
      <form
        onSubmit={handleSubmit}
        className="p-4 border rounded bg-white shadow"
        style={{ maxWidth: '400px', width: '100%' }}
      >
        <h3 className="mb-4 text-center">Create Budget</h3>

        <div className="mb-3">
          <label htmlFor="category" className="form-label">Category</label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="limitAmount" className="form-label">Limit Amount (€)</label>
          <input
            id="limitAmount"
            type="number"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            className="form-control"
            min="0.01"
            step="0.01"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="period" className="form-label">Period</label>
          <select
            id="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'weekly' | 'monthly' | 'yearly')}
            className="form-select"
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
          <label htmlFor="notes" className="form-label">Notes (optional)</label>
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

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'Creating...' : 'Create Budget'}
        </button>
      </form>
    </div>
  );
}
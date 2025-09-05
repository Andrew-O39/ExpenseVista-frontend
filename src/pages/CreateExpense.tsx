import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExpense } from '../services/api';

// Utility to normalize category input on frontend
function normalizeCategory(cat: string): string {
  return cat.toLowerCase().trim().replace(/\s+/g, ' ').normalize();
}

export default function CreateExpense() {
  const navigate = useNavigate(); // initialize navigate

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('You must be logged in to create an expense.');
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
      await createExpense(token, {
        amount: Number(amount),
        description: description.trim() || undefined,
        category: category.toLowerCase().trim().replace(/\s+/g, ' ').normalize(),
        notes: notes.trim() || undefined,
      });

      setSuccess('Expense created successfully!');

      // Navigate after a short delay (optional)
      setTimeout(() => {
        navigate('/expenses');
      }, 800);
      setAmount('');
      setCategory('');
      setDescription('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to create expense.');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-start mt-5">
      <form
        onSubmit={handleSubmit}
        className="p-4 border rounded bg-white shadow"
        style={{ maxWidth: '400px', width: '100%' }}
      >
        <h3 className="mb-4 text-center">Create Expense</h3>

        <div className="mb-3">
          <label htmlFor="amount" className="form-label">
            Amount (€)
          </label>
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="category" className="form-label">
            Category
          </label>
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
          <label htmlFor="description" className="form-label">
            Description (optional)
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="notes" className="form-label">
            Notes (optional)
          </label>
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

        <button type="submit" className="btn btn-primary w-100">
          Create Expense
        </button>
      </form>
    </div>
  );
}
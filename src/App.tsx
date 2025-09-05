import React, { useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

function Page({ title, children }: { title: string; children: React.ReactNode }) {
  useEffect(() => {
    document.title = title ? `${title} – ExpenseTracker` : 'ExpenseTracker';
  }, [title]);
  return <>{children}</>;
}

function Welcome() {
  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-primary text-white text-center p-4">
      <h1 className="display-3 fw-bold mb-3">Welcome to ExpenseTracker</h1>
      <p className="lead mb-4">Track your expenses, manage budgets, and take control of your finances.</p>
      <div className="d-flex gap-3 flex-wrap justify-content-center">
        <Link to="/login" className="btn btn-light btn-lg shadow-sm">Login</Link>
        <Link to="/register" className="btn btn-outline-light btn-lg shadow-sm">Register</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Page title="Welcome"><Welcome /></Page>} />
      <Route path="/login" element={<Page title="Login"><Login /></Page>} />
      <Route path="/register" element={<Page title="Register"><Register /></Page>} />
      <Route path="/dashboard" element={<Page title="Dashboard"><Dashboard /></Page>} />
    </Routes>
  );
}
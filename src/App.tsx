import { useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

import CreateExpense from './pages/CreateExpense';
import CreateBudget from './pages/CreateBudget';
import ExpenseList from './pages/ExpenseList';
import BudgetList from './pages/BudgetList';
import ExpenseEdit from './pages/ExpenseEdit';
import BudgetEdit from './pages/BudgetEdit';
import CreateIncome from './pages/CreateIncome';
import IncomeList from './pages/IncomeList';
import EditIncome from './pages/EditIncome';
import SessionWatcher from './components/SessionWatcher';

function Page({ title, children }: { title: string; children: React.ReactNode }) {
  useEffect(() => {
    document.title = title ? `${title} – ExpenseVista` : 'ExpenseVista';
  }, [title]);
  return <>{children}</>;
}

function Welcome() {
  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-primary text-white text-center p-4">
      <h1 className="display-3 fw-bold mb-3">Welcome to ExpenseVista</h1>
      <p className="lead mb-4">Track expenses, manage budgets, and take control of your finances.</p>
      <div className="d-flex gap-3 flex-wrap justify-content-center">
        <Link to="/login" className="btn btn-light btn-lg shadow-sm">Login</Link>
        <Link to="/register" className="btn btn-outline-light btn-lg shadow-sm">Register</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      {/* Session refresh/countdown handler shown globally */}
      <SessionWatcher />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Page title="Welcome"><Welcome /></Page>} />
        <Route path="/login" element={<Page title="Login"><Login /></Page>} />
        <Route path="/register" element={<Page title="Register"><Register /></Page>} />

        {/* App */}
        <Route path="/dashboard" element={<Page title="Dashboard"><Dashboard /></Page>} />

        {/* CRUD pages */}
        <Route path="/create-expense" element={<Page title="Create Expense"><CreateExpense /></Page>} />
        <Route path="/create-budget"  element={<Page title="Create Budget"><CreateBudget /></Page>} />
        <Route path="/create-income"  element={<Page title="Create Income"><CreateIncome /></Page>} />

        <Route path="/expenses" element={<Page title="Expenses"><ExpenseList /></Page>} />
        <Route path="/budgets"  element={<Page title="Budgets"><BudgetList /></Page>} />
        <Route path="/incomes"  element={<Page title="Incomes"><IncomeList /></Page>} />

        <Route path="/edit-expense/:id" element={<Page title="Edit Expense"><ExpenseEdit /></Page>} />
        <Route path="/edit-budget/:id"  element={<Page title="Edit Budget"><BudgetEdit /></Page>} />
        <Route path="/edit-income/:id"  element={<Page title="Edit Income"><EditIncome /></Page>} />
      </Routes>
    </>
  );
}
import './App.css';
import { useEffect } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { WELCOME_KEY } from "./constants/onboarding";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import WelcomePage from "./pages/Welcome"; //  Onboarding/verification page

import CreateExpense from "./pages/CreateExpense";
import CreateBudget from "./pages/CreateBudget";
import ExpenseList from "./pages/ExpenseList";
import BudgetList from "./pages/BudgetList";
import ExpenseEdit from "./pages/ExpenseEdit";
import BudgetEdit from "./pages/BudgetEdit";
import CreateIncome from "./pages/CreateIncome";
import IncomeList from "./pages/IncomeList";
import EditIncome from "./pages/EditIncome";

import SessionWatcher from "./components/SessionWatcher";
import FinanceAssistant from "./components/FinanceAssistant";
import ResendVerification from "./components/ResendVerification";

import { isTokenValid } from "./utils/auth";

/* ---------- Page wrapper sets <title> ---------- */
function Page({ title, children }: { title: string; children: React.ReactNode }) {
  useEffect(() => {
    document.title = title ? `${title} – ExpenseVista` : "ExpenseVista";
  }, [title]);
  return <>{children}</>;
}

/* ---------- Public splash (no auth / no API calls) ---------- */
function WelcomeHero() {
  return (
    <div className="hero-welcome min-vh-100 d-flex flex-column align-items-center justify-content-center text-center p-4">
      <h1 className="display-3 fw-bold mb-3 text-primary">Welcome to ExpenseVista</h1>
      <p className="lead mb-4 text-muted">
        Track expenses, manage budgets, and take control of your finances.
      </p>

      <div className="d-flex gap-3 flex-wrap justify-content-center">
        <Link to="/login" className="btn btn-primary btn-lg shadow-sm">
          Login
        </Link>
        <Link to="/register" className="btn btn-outline-primary btn-lg shadow-sm">
          Register
        </Link>
      </div>
    </div>
  );
}

/* ---------- Home router element: choose Hero or full Welcome page ---------- */
function Home() {
  const token = localStorage.getItem("access_token");
  const loggedIn = !!token && isTokenValid();
  const hasSeenWelcome = !!localStorage.getItem(WELCOME_KEY);

  if (!loggedIn) return <WelcomeHero />;
  return hasSeenWelcome ? <Navigate to="/dashboard" replace /> : <WelcomePage />;
}

// Replace `export default function App() { ... }` with:
function App() {
  return (
    <>
      {/* Session refresh/countdown handler shown globally */}
      <SessionWatcher />

      <Routes>
        {/* Public */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Page title="Welcome"><Home /></Page>} />
        <Route path="/welcome" element={<Page title="Welcome"><WelcomePage /></Page>} />
        <Route path="/login" element={<Page title="Login"><Login /></Page>} />
        <Route path="/register" element={<Page title="Register"><Register /></Page>} />
        <Route path="/forgot-password" element={<Page title="Forgot Password"><ForgotPassword /></Page>} />
        <Route path="/verify-email" element={<Page title="Verify Email"><VerifyEmail /></Page>} />
        <Route path="/reset-password" element={<Page title="Reset Password"><ResetPassword /></Page>} />
        <Route path="/resend-verification" element={<Page title="Resend Verification"><ResendVerification /></Page>} />

        {/* App */}
        <Route path="/dashboard" element={<Page title="Dashboard"><Dashboard /></Page>} />

        {/* CRUD */}
        <Route path="/create-expense" element={<Page title="Create Expense"><CreateExpense /></Page>} />
        <Route path="/create-budget" element={<Page title="Create Budget"><CreateBudget /></Page>} />
        <Route path="/create-income" element={<Page title="Create Income"><CreateIncome /></Page>} />
        <Route path="/expenses" element={<Page title="Expenses"><ExpenseList /></Page>} />
        <Route path="/budgets" element={<Page title="Budgets"><BudgetList /></Page>} />
        <Route path="/incomes" element={<Page title="Incomes"><IncomeList /></Page>} />
        <Route path="/edit-expense/:id" element={<Page title="Edit Expense"><ExpenseEdit /></Page>} />
        <Route path="/edit-budget/:id" element={<Page title="Edit Budget"><BudgetEdit /></Page>} />
        <Route path="/edit-income/:id" element={<Page title="Edit Income"><EditIncome /></Page>} />
      </Routes>

      {/* Floating assistant shows on every page */}
      <FinanceAssistant />
    </>
  );
}

export default App;   // default export
export { App };      // named export (helps TS resolver in some setups)
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../services/api";
import { isTokenValid } from "../utils/auth";
import WelcomeInsights from "../components/WelcomeInsights"; //

type CurrentUser = {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
};

export default function Welcome() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !isTokenValid()) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const me = await getCurrentUser(token);
        setUser(me);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token_expiry");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center text-muted">Loading…</div>
      </div>
    );
  }

  const isLoggedIn = !!user;

  return (
    <div className="container py-5">
      <div className="mb-4">
        <h1 className="h3 mb-2">
          Welcome{isLoggedIn && user?.username ? `, ${user.username}` : ""}! 👋
        </h1>
        <p className="text-muted">
          Track expenses, manage budgets, and keep an eye on your income — all in one place.
        </p>
      </div>

      {/* CTA cards */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Add an Expense</h5>
              <p className="card-text text-muted">
                Log a new expense to keep your spending up to date.
              </p>
              {isLoggedIn ? (
                <Link to="/create-expense?return=/welcome&onboarding=1" className="btn btn-primary">
                  Add Expense
                </Link>
              ) : (
                <Link to="/login?redirect=/create-expense" className="btn btn-primary">Login to continue</Link>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Create a Budget</h5>
              <p className="card-text text-muted">
                Set limits by category (monthly, weekly, yearly, etc.).
              </p>
              {isLoggedIn ? (
                <Link to="/create-budget?return=/welcome&onboarding=1" className="btn btn-primary">
                  Create Budget
                </Link>
              ) : (
                <Link to="/login?redirect=/create-budget" className="btn btn-primary">Login to continue</Link>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Add Income</h5>
              <p className="card-text text-muted">
                Record an income entry (salary, freelance, etc.).
              </p>
              {isLoggedIn ? (
                <Link to="/create-income?return=/welcome&onboarding=1" className="btn btn-outline-primary btn-sm">
                  Add income
                </Link>
              ) : (
                <Link to="/login?redirect=/create-income" className="btn btn-primary">Login to continue</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 👇 New tips & preview charts section */}
      <WelcomeInsights />

      {/* (Optional) Keep your “Continue to Dashboard” button */}
      <button
        className="btn btn-primary mt-3"
        onClick={() => {
          // keep your existing “seen” flag logic if desired
          const id = user?.id ? `:${user.id}` : "";
          localStorage.setItem(`has_seen_welcome${id}`, "1");
          window.location.href = "/dashboard";
        }}
      >
        Continue to Dashboard
      </button>
    </div>
  );
}
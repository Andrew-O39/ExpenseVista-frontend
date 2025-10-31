import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../services/api";
import { isTokenValid } from "../utils/auth";

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
          Welcome{isLoggedIn ? `, ${user!.username}` : ""}! 👋
        </h1>
        <p className="text-muted">
          Track expenses, manage budgets, and keep an eye on your income all in one place.
        </p>
      </div>

      {/* CTA cards (no duplicate “resend verification” UI) */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Add an Expense</h5>
              <p className="card-text text-muted">
                Log a new expense to keep your spending up to date.
              </p>
              {isLoggedIn ? (
                <Link to="/create-expense" className="btn btn-primary">Add Expense</Link>
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
                <Link to="/create-budget" className="btn btn-primary">Create Budget</Link>
              ) : (
                <Link to="/login?redirect=/create-budget" className="btn btn-primary">Login to continue</Link>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Record Income</h5>
              <p className="card-text text-muted">
                Track salary, freelance, interest and more.
              </p>
              {isLoggedIn ? (
                <Link to="/create-income" className="btn btn-primary">Add Income</Link>
              ) : (
                <Link to="/login?redirect=/create-income" className="btn btn-primary">Login to continue</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Optional secondary link for brand-new visitors */}
      {!isLoggedIn && (
        <div className="mt-4">
          <span className="text-muted me-2">New here?</span>
          <Link to="/register">Create an account</Link>
          <span className="text-muted ms-3 me-2">Forgot password?</span>
          <Link to="/forgot-password">Reset it</Link>
        </div>
      )}
    </div>
  );
}
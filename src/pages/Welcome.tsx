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
      <div className="container container-app py-5">
        <div className="text-center text-muted">Loading…</div>
      </div>
    );
  }

  const isLoggedIn = !!user;

  return (
    <div className="welcome-page container container-app">
      <header className="welcome-intro">
        <h1 className="welcome-intro-title">
          Welcome{isLoggedIn && user?.username ? `, ${user.username}` : ""}! 👋
        </h1>
        <p className="welcome-intro-subtitle">
          Track expenses, manage budgets, and keep an eye on your income — all in one place.
        </p>
      </header>

      <section className="welcome-cards row g-4" aria-label="Get started">
        <div className="col-12 col-md-4">
          <div className="welcome-card">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h2 className="welcome-card-title">Add an Expense</h2>
                <p className="welcome-card-text">
                  Log a new expense to keep your spending up to date.
                </p>
                <div className="welcome-card-action">
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
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="welcome-card">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h2 className="welcome-card-title">Create a Budget</h2>
                <p className="welcome-card-text">
                  Set limits by category (monthly, weekly, yearly, etc.).
                </p>
                <div className="welcome-card-action">
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
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="welcome-card">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h2 className="welcome-card-title">Add Income</h2>
                <p className="welcome-card-text">
                  Record an income entry (salary, freelance, etc.).
                </p>
                <div className="welcome-card-action">
                  {isLoggedIn ? (
                    <Link to="/create-income?return=/welcome&onboarding=1" className="btn btn-outline-primary">
                      Add income
                    </Link>
                  ) : (
                    <Link to="/login?redirect=/create-income" className="btn btn-primary">Login to continue</Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="welcome-insights-section" aria-label="Tips and preview">
        <h2 className="welcome-section-title">See what you can do</h2>
        <WelcomeInsights />
      </section>

      <div className="welcome-continue">
        <button
          className="btn btn-primary"
          onClick={() => {
            const id = user?.id ? `:${user.id}` : "";
            localStorage.setItem(`has_seen_welcome${id}`, "1");
            window.location.href = "/dashboard";
          }}
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
}

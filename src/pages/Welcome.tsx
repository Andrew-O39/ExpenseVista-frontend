import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser, resendVerificationEmail } from "../services/api";
import { isTokenValid } from "../utils/auth";
import OnboardingChecklist from "../components/OnboardingChecklist";

type CurrentUser = {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
};

export default function Welcome() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resendErr, setResendErr] = useState<string | null>(null);

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
        // token might be invalid/expired
        localStorage.removeItem("access_token");
        localStorage.removeItem("token_expiry");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg(null);
    setResendErr(null);
    try {
      const res = await resendVerificationEmail();
      setResendMsg(res?.msg || "Verification email sent.");
    } catch (e: any) {
      setResendErr(e?.message || "Failed to resend verification email.");
    } finally {
      setResendLoading(false);
    }
  };

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
          Track expenses, manage budgets, and keep an eye on your income all in one place.
        </p>
      </div>

      {/* Email verification banner */}
      {isLoggedIn && user && !user.is_verified && (
        <div className="alert alert-warning d-flex align-items-center" role="alert">
          <div>
            <strong>Verify your email</strong> to unlock your account. Didn’t get it?
            <button
              className="btn btn-sm btn-outline-secondary ms-2"
              onClick={handleResend}
              disabled={resendLoading}
            >
              {resendLoading ? "Sending…" : "Resend verification"}
            </button>
            {resendMsg && <span className="ms-2 text-success">{resendMsg}</span>}
            {resendErr && <span className="ms-2 text-danger">{resendErr}</span>}
          </div>
        </div>
      )}

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

        <button
          className="btn btn-primary"
          onClick={() => {
            localStorage.setItem("has_seen_welcome", "1");
            window.location.href = "/dashboard";
         }}
       >
         Continue to Dashboard
      </button>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Add Income</h5>
              <p className="card-text text-muted">
                Record an income entry (salary, freelance, etc.).
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

      {/* Onboarding checklist (optional) */}
      {isLoggedIn && (
        <OnboardingChecklist
          initialUser={{
            is_verified: !!user?.is_verified,
            username: user?.username ?? "",
            email: user?.email ?? "",
          }}
        />
      )}

      {/* Auth helpers */}
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
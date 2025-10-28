import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  resendVerificationEmail,
} from "@/services/api";
import { isTokenValid } from "@/utils/auth";

type CurrentUser = {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
};

export default function Welcome() {
  const navigate = useNavigate();
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
      // Authenticated flow uses /resend-verification/me under the hood via our api helper
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
        <h1 className="h3 mb-2">Welcome{isLoggedIn ? `, ${user!.username}` : ""}! 👋</h1>
        <p className="text-muted">
          Track expenses, manage budgets, and keep an eye on your income all in one place.
        </p>
      </div>

      {/* Email verification banner */}
      {isLoggedIn && !user!.is_verified && (
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
                <Link to="/expenses/new" className="btn btn-primary">Add Expense</Link>
              ) : (
                <Link to="/login?redirect=/expenses/new" className="btn btn-primary">Login to continue</Link>
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
                <Link to="/budgets/new" className="btn btn-primary">Create Budget</Link>
              ) : (
                <Link to="/login?redirect=/budgets/new" className="btn btn-primary">Login to continue</Link>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">View Dashboard</h5>
              <p className="card-text text-muted">
                See your income vs. expenses, top categories, and trends.
              </p>
              {isLoggedIn ? (
                <Link to="/dashboard" className="btn btn-primary">Open Dashboard</Link>
              ) : (
                <Link to="/login?redirect=/dashboard" className="btn btn-primary">Login to continue</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auth helpers */}
      {!isLoggedIn && (
          <OnboardingChecklist
    initialUser={{ is_verified: user!.is_verified, username: user!.username, email: user!.email }}
  />
  )}
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
import { useState } from "react";
import { forgotPassword } from "../services/api";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!email.trim()) {
      setErr("Please enter your email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await forgotPassword(email.trim());
      setMsg(res?.msg ?? "If this email is registered, you will receive a reset link shortly.");
    } catch (e: any) {
      setErr(e?.message || "Failed to start password reset.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card-title">Forgot Password</h1>
        <p className="auth-card-subtitle">
          Enter the email you used to register. If an account exists, we'll email a reset link.
        </p>

        <div className="auth-alerts">
          {msg && <div className="alert alert-success">{msg}</div>}
          {err && <div className="alert alert-danger">{err}</div>}
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="mb-3">
            <label htmlFor="forgot-email" className="form-label">Email</label>
            <input
              id="forgot-email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="auth-cta">
            <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
              {submitting ? "Sending…" : "Send Reset Link"}
            </button>
          </div>
        </form>

        <div className="auth-links">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

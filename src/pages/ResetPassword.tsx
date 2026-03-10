import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = params.get("token") || "";
    setToken(t);
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!token) {
      setErr("Missing reset token. Please use the link from your email.");
      return;
    }
    if (password.length < 8) {
      setErr("New password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPassword(token, password);
      setMsg(res?.msg ?? "Password reset successful. Redirecting to login…");
      // Small delay then go to login
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (e: any) {
      setErr(e?.message || "Failed to reset password. Your link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card-title">Reset Password</h1>

        <div className="auth-alerts">
          {!token && (
            <div className="alert alert-warning">
              No token found. Open the link from your email, or{" "}
              <Link to="/forgot-password">request a new reset link</Link>.
            </div>
          )}
          {msg && <div className="alert alert-success">{msg}</div>}
          {err && <div className="alert alert-danger">{err}</div>}
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="mb-3">
            <label htmlFor="reset-password" className="form-label">New Password</label>
            <input
              id="reset-password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
              minLength={8}
            />
            <div className="form-text">At least 8 characters.</div>
          </div>

          <div className="mb-3">
            <label htmlFor="reset-confirm" className="form-label">Confirm New Password</label>
            <input
              id="reset-confirm"
              type="password"
              className="form-control"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="auth-cta">
            <button type="submit" className="btn btn-primary w-100" disabled={submitting || !token}>
              {submitting ? "Resetting…" : "Reset Password"}
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
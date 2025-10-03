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
    <div className="container p-4" style={{ maxWidth: 420 }}>
      <h2 className="mb-3">Forgot Password</h2>
      <p className="text-muted">
        Enter the email you used to register. If an account exists, we’ll email a reset link.
      </p>

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-danger">{err}</div>}

      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
          {submitting ? "Sending…" : "Send Reset Link"}
        </button>
      </form>

      <div className="mt-3">
        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
}
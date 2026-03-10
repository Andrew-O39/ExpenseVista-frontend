import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { resendVerificationEmail } from "../services/api";

export default function ResendVerification() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"sending"|"done"|"error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setStatus("sending");
      resendVerificationEmail()
        .then((res) => {
          setMsg(res?.msg || "If your email is registered, a verification email has been sent.");
          setStatus("done");
        })
        .catch((e) => {
          setMsg(e?.message || "Failed to send verification email.");
          setStatus("error");
        });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setMsg("");
    try {
      const res = await resendVerificationEmail(email.trim());
      setMsg(res?.msg || "If your email is registered, a verification email has been sent.");
      setStatus("done");
    } catch (e: any) {
      setMsg(e?.message || "Failed to send verification email.");
      setStatus("error");
    }
  };

  const isAuthed = Boolean(localStorage.getItem("access_token"));

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card-title">Resend Verification</h1>
        <p className="auth-card-subtitle">
          Enter your email to receive a new verification link.
        </p>

        {!isAuthed ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="mb-3">
              <label htmlFor="resend-email" className="form-label">Email</label>
              <input
                id="resend-email"
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="auth-alerts">
              {msg && (
                <div className={`alert ${status === "error" ? "alert-danger" : "alert-info"}`}>
                  {msg}
                </div>
              )}
            </div>
            <div className="auth-cta">
              <button type="submit" className="btn btn-primary w-100" disabled={status === "sending"}>
                {status === "sending" ? "Sending..." : "Send verification email"}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="auth-alerts">
              {msg && (
                <div className={`alert ${status === "error" ? "alert-danger" : "alert-info"}`}>
                  {msg}
                </div>
              )}
            </div>
            {status === "sending" && <p className="text-muted mb-0">Sending verification email…</p>}
          </div>
        )}

        <div className="auth-links">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
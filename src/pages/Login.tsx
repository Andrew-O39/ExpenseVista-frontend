import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { login, resendVerificationEmail, getCurrentUser } from "../services/api";
import { isTokenValid } from "../utils/auth";
import { WELCOME_KEY } from "../constants/onboarding";

// utilities
function getJwtExpiryMs(jwt: string): number | null {
  try {
    const [, payloadB64] = jwt.split(".");
    const json = JSON.parse(
      atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
    );
    // exp is in seconds since epoch
    if (json && typeof json.exp === "number") {
      return json.exp * 1000;
    }
    return null;
  } catch {
    return null;
  }
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse query params (?redirect=/dashboard&msg=session_expired&verified=1)
  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect") || "/dashboard";
  const msg = params.get("msg");
  const verifiedFlag = params.get("verified"); // "1" if just verified via email link

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(""); // Info banner
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    document.title = "Login – ExpenseVista";
  }, []);

  // If already signed in with a valid token, redirect immediately
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token && isTokenValid()) {
      navigate(redirect, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, redirect]);

  // If user just verified their email, show success message
  useEffect(() => {
    if (verifiedFlag === "1") {
      setInfo("Your email has been verified. You can now sign in.");
    }
  }, [verifiedFlag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    try {
      const data = await login(username, password);

      localStorage.setItem("access_token", data.access_token);

      // Prefer JWT exp; fallback to 60 minutes if not present
      const expMs = getJwtExpiryMs(data.access_token);
      const expiryTime = expMs ?? (Date.now() + 60 * 60 * 1000);
      localStorage.setItem("token_expiry", String(expiryTime));

      // Decide if there was an explicit redirect param in the URL
      const hasExplicitRedirect =
        new URLSearchParams(location.search).has("redirect");

      // Fetch the user so we can scope the “seen welcome” flag per-user
      await getCurrentUser(data.access_token);

      // If no explicit redirect and user hasn't seen welcome yet -> go to /welcome
      if (!hasExplicitRedirect && !localStorage.getItem(WELCOME_KEY)) {
        localStorage.setItem(WELCOME_KEY, "1");
        navigate("/welcome", { replace: true });
        return;
      }

      // Otherwise honor redirect (or default to /dashboard)
      navigate(redirect, { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Invalid username or password";
      setError(String(msg));
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setError("");
    setInfo("");
    try {
      const resp = await resendVerificationEmail();
      setInfo(resp?.msg || "Verification email sent. Check your inbox.");
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Could not resend verification email.";
      setError(String(msg));
    } finally {
      setResendLoading(false);
    }
  };

  const maybeResendHint = () => {
    const lowered = (error || "").toLowerCase();
    const looksUnverified =
      lowered.includes("not verified") ||
      lowered.includes("verify your email") ||
      lowered.includes("email verification");

    if (!looksUnverified) return null;

    return (
      <div className="alert alert-warning mt-3 w-100" style={{ maxWidth: 360 }}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <strong>Email not verified.</strong> Some features are limited until
            you verify your address.
          </div>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={handleResendVerification}
            disabled={resendLoading}
          >
            {resendLoading ? "Sending…" : "Resend verification link"}
          </button>
        </div>
        <div className="small text-muted mt-2">
          Tip: Check spam/junk if you don’t see the email.
        </div>
      </div>
    );
  };

  return (
  <div className="login-page d-flex flex-column justify-content-center align-items-center vh-100 bg-body">
    <h2 className="mb-4">Login</h2>

      {/* Optional alert if session expired */}
      {msg === "session_expired" && (
        <div className="alert alert-warning w-100" style={{ maxWidth: 360 }}>
          Your session expired. Please sign in again to continue.
        </div>
      )}

      {/* Info banner (e.g., verified success or resend success) */}
      {info && (
        <div className="alert alert-success w-100" style={{ maxWidth: 360 }}>
          {info}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="p-4 rounded shadow border"
        style={{
          width: 320,
          background: "var(--bs-body-bg)",
          color: "var(--bs-body-color)",
          borderColor: "var(--bs-border-color)",
        }}
      >
        <div className="mb-3">
          <input
            type="text"
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3 position-relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="btn btn-outline-secondary position-absolute top-50 end-0 translate-middle-y me-2"
            style={{ zIndex: 2 }}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div className="mt-3 text-center">
          <Link to="/forgot-password">Forgot your password?</Link>
        </div>

        <div className="mt-2 text-center">
          <Link to="/resend-verification">Resend verification email</Link>
        </div>

        {error && <p className="text-danger small mb-3">{error}</p>}

        <button type="submit" className="btn btn-primary w-100">
          Login
        </button>

        {maybeResendHint()}
      </form>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "@/services/api";

type Status = "idle" | "loading" | "success" | "error";

export default function VerifyEmail() {
  const [search] = useSearchParams();
  const token = search.get("token") || "";
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Verify Email – ExpenseVista";
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setStatus("error");
        setError("Missing verification token. Please use the link from your email.");
        return;
      }

      setStatus("loading");
      try {
        const resp = await verifyEmail(token);
        if (cancelled) return;
        setStatus("success");
        setMessage(resp?.msg || "Email verified successfully.");
        setTimeout(() => navigate("/login"), 2000);
      } catch (e: any) {
        if (cancelled) return;
        setStatus("error");
        setError(e.message || "Verification failed. Please try again.");
      }
    }

    run();
    return () => { cancelled = true; };
  }, [token, navigate]);

  return (
    <div className="d-flex justify-content-center align-items-start mt-5">
      <div className="p-4 border rounded bg-white shadow" style={{ maxWidth: 520, width: "100%" }}>
        <h3 className="mb-3">Verify your email</h3>

        {status === "loading" && (
          <div className="d-flex align-items-center">
            <div className="spinner-border me-3" role="status" aria-hidden="true" />
            <div>
              <div className="fw-semibold">Verifying…</div>
              <div className="text-muted small">Hang tight while we confirm your address.</div>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="alert alert-success">
            <div className="fw-semibold mb-1">Success</div>
            <div>{message}</div>
            <div className="mt-3">
              <Link to="/login" className="btn btn-primary">Go to Login</Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="alert alert-danger">
            <div className="fw-semibold mb-1">Verification failed</div>
            <div>{error}</div>
            <div className="mt-3 d-flex gap-2">
              <Link to="/login" className="btn btn-outline-secondary">Back to Login</Link>
            </div>
            <div className="text-muted small mt-3">
              Tip: If the link expired, log in and click “Resend verification link.”
            </div>
          </div>
        )}

        {status === "idle" && <div className="text-muted">Waiting to start verification…</div>}
      </div>
    </div>
  );
}
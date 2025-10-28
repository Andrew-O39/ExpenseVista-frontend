import { useState } from "react";
import { resendVerificationEmail } from "../services/api";

export default function ResendVerification({ email }: { email?: string }) {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string>("");
  const [err, setErr] = useState<string>("");

  const onClick = async () => {
    setLoading(true);
    setOk("");
    setErr("");
    try {
      const resp = await resendVerificationEmail();
      setOk(resp?.msg || "Verification email sent. Check your inbox.");
    } catch (e: any) {
      setErr(e.message || "Could not resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        className="btn btn-outline-primary btn-sm"
        onClick={onClick}
        disabled={loading}
        title={email ? `Send to ${email}` : "Send verification email"}
      >
        {loading ? "Sending…" : "Resend verification link"}
      </button>

      {ok && <div className="alert alert-success mt-2 py-2">{ok}</div>}
      {err && <div className="alert alert-danger mt-2 py-2">{err}</div>}
    </div>
  );
}
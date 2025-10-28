import { useState } from "react";
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
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
      <h2 className="mb-3">Resend Verification</h2>

      {!isAuthed ? (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow" style={{ width: 360 }}>
          <div className="mb-3">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              required
            />
          </div>
          {msg && (
            <div className={`alert ${status === "error" ? "alert-danger" : "alert-info"}`}>
              {msg}
            </div>
          )}
          <button type="submit" className="btn btn-primary w-100" disabled={status === "sending"}>
            {status === "sending" ? "Sending..." : "Send verification email"}
          </button>
        </form>
      ) : (
        <div className="bg-white p-4 rounded shadow" style={{ width: 360 }}>
          {msg && (
            <div className={`alert ${status === "error" ? "alert-danger" : "alert-info"}`}>
              {msg}
            </div>
          )}
          {status === "sending" && <p>Sending verification email…</p>}
        </div>
      )}
    </div>
  );
}
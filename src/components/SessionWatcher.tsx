import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function SessionWatcher({
  warnAtMs = 2 * 60 * 1000,  // show modal 2 minutes before expiry
  checkEveryMs = 1000,        // smooth countdown
}: {
  warnAtMs?: number;
  checkEveryMs?: number;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [msLeft, setMsLeft] = useState<number | null>(null);
  const [showWarn, setShowWarn] = useState(false);

  const hhmmss = useMemo(() => {
    if (msLeft == null || msLeft < 0) return "0:00";
    const totalSeconds = Math.floor(msLeft / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [msLeft]);

  useEffect(() => {
    const id = setInterval(() => {
      const expStr = localStorage.getItem("token_expiry");
      if (!expStr) {
        setMsLeft(null);
        setShowWarn(false);
        return;
      }
      const exp = Number(expStr);
      const left = exp - Date.now();
      setMsLeft(left);

      if (left <= 0) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token_expiry");
        navigate(`/login?msg=session_expired&redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
      } else if (left <= warnAtMs) {
        setShowWarn(true);
      } else {
        setShowWarn(false);
      }
    }, checkEveryMs);

    return () => clearInterval(id);
  }, [navigate, location.pathname, warnAtMs, checkEveryMs]);

  const goLogin = () => {
    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
  };

  if (!showWarn) return null;

  return (
    <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.3)" }}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Session almost over</h5>
          </div>
          <div className="modal-body">
            <p>Your session will expire in <strong>{hhmmss}</strong>.</p>
            <p>Click “Stay signed in” to re-authenticate and continue where you left off.</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={() => setShowWarn(false)}>
              Remind me later
            </button>
            <button className="btn btn-primary" onClick={goLogin}>
              Stay signed in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
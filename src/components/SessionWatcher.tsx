import { useEffect, useMemo, useState } from "react";
import { isTokenValid } from "../utils/auth";

const THRESHOLD_MS = 2 * 60 * 1000;      // show prompt when < 2 min left
const CHECK_EVERY_MS = 1000;             // check every second
const SNOOZE_MS = 5 * 60 * 1000;         // “remind me later” snooze
const EXTEND_MS = 30 * 60 * 1000;        // extend by 30 minutes

export default function SessionWatcher() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [snoozeUntil, setSnoozeUntil] = useState<number>(0);
  const [visible, setVisible] = useState(false);

  // keep timeLeft updated
  useEffect(() => {
    const tick = () => {
      const token = localStorage.getItem("access_token");
      const expiryStr = localStorage.getItem("token_expiry");
      if (!token || !expiryStr || !isTokenValid()) {
        setTimeLeft(null);
        setVisible(false);
        return;
      }
      const left = Number(expiryStr) - Date.now();
      setTimeLeft(left > 0 ? left : 0);
    };

    tick();
    const id = setInterval(tick, CHECK_EVERY_MS);
    return () => clearInterval(id);
  }, []);

  // show/hide prompt based on timeLeft & snooze
  useEffect(() => {
    if (timeLeft === null) {
      setVisible(false);
      return;
    }
    const now = Date.now();
    const shouldShow = timeLeft <= THRESHOLD_MS && now >= snoozeUntil;
    setVisible(shouldShow);
  }, [timeLeft, snoozeUntil]);

  // sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token_expiry" || e.key === "access_token") {
        // let the “tick” effect recalc on next interval;
        // also re-evaluate visibility immediately
        const expiryStr = localStorage.getItem("token_expiry");
        if (!expiryStr) return;
        const left = Number(expiryStr) - Date.now();
        setTimeLeft(left > 0 ? left : 0);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const mmss = useMemo(() => {
    if (timeLeft == null) return "";
    const total = Math.max(0, Math.floor(timeLeft / 1000));
    const m = Math.floor(total / 60).toString().padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [timeLeft]);

  const staySignedIn = () => {
    // frontend-only “extend”: push expiry forward
    const newExpiry = Date.now() + EXTEND_MS;
    localStorage.setItem("token_expiry", String(newExpiry));
    setVisible(false);
    // small snooze so it doesn’t immediately reappear if close to threshold
    setSnoozeUntil(Date.now() + 30 * 1000);
  };

  const remindLater = () => {
    setSnoozeUntil(Date.now() + SNOOZE_MS);
    setVisible(false);
  };

  if (!visible) return null;

  // simple, click-through-safe toast (no backdrop that can block clicks)
  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 9999,
        maxWidth: 380,
      }}
    >
      <div className="card shadow-lg border-warning" style={{ borderWidth: 2 }}>
        <div className="card-body">
          <div className="d-flex align-items-start">
            <div className="me-2">
              <span className="badge text-bg-warning">Session</span>
            </div>
            <div className="flex-grow-1">
              <div className="fw-semibold mb-1">Your session is about to expire</div>
              <div className="small text-muted mb-2">
                Time remaining: <strong>{mmss}</strong>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={staySignedIn}
                  className="btn btn-sm btn-primary"
                >
                  Stay signed in
                </button>
                <button
                  type="button"
                  onClick={remindLater}
                  className="btn btn-sm btn-outline-secondary"
                >
                  Remind me later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
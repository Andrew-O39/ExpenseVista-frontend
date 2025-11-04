// src/components/SessionWatcher.tsx
import { useEffect, useMemo, useState } from "react";
import { isTokenValid } from "../utils/auth";

/**
 * Config — tweak if you want:
 * - THRESHOLD_MS: show the prompt when remaining time is below this
 * - CHECK_EVERY_MS: check frequency
 * - SNOOZE_MS: how long "Remind me later" hides the prompt
 * - AUTO_REDIRECT_ON_EXPIRE: send user to /login when time is up
 */
const THRESHOLD_MS = 5 * 60 * 1000;  // 5 minutes before expiry
const CHECK_EVERY_MS = 1000;         // 1 second
const SNOOZE_MS = 5 * 60 * 1000;     // snooze 5 minutes
const AUTO_REDIRECT_ON_EXPIRE = true;

export default function SessionWatcher() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [snoozeUntil, setSnoozeUntil] = useState<number>(0);
  const [visible, setVisible] = useState(false);

  // Keep timeLeft updated from the real expiry timestamp in localStorage.
  useEffect(() => {
    const tick = () => {
      const token = localStorage.getItem("access_token");
      const expiryStr = localStorage.getItem("token_expiry");

      // If not logged in or token already invalid, hide UI & optionally redirect.
      if (!token || !expiryStr || !isTokenValid()) {
        setTimeLeft(null);
        setVisible(false);

        if (AUTO_REDIRECT_ON_EXPIRE) {
          // Avoid redirect loop: only redirect if token key exists but is invalid/expired
          if (token && expiryStr && window.location.pathname !== "/login") {
            // Let your app's auth guard handle clearing state; we just nudge navigation.
            try {
              window.history.replaceState(null, "", "/login");
              window.dispatchEvent(new PopStateEvent("popstate"));
            } catch {
              window.location.href = "/login";
            }
          }
        }
        return;
      }

      const left = Number(expiryStr) - Date.now();
      setTimeLeft(left > 0 ? left : 0);
    };

    tick();
    const id = setInterval(tick, CHECK_EVERY_MS);
    return () => clearInterval(id);
  }, []);

  // Show/hide prompt based on remaining time and snooze window.
  useEffect(() => {
    if (timeLeft === null) {
      setVisible(false);
      return;
    }
    const now = Date.now();

    // If time’s up, hide the toast; auth guards will handle the rest.
    if (timeLeft <= 0) {
      setVisible(false);
      return;
    }

    const shouldShow = timeLeft <= THRESHOLD_MS && now >= snoozeUntil;
    setVisible(shouldShow);
  }, [timeLeft, snoozeUntil]);

  // Cross-tab sync: if another tab refreshes the token or logs out, reflect here.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token_expiry" || e.key === "access_token") {
        const expiryStr = localStorage.getItem("token_expiry");
        if (!expiryStr) {
          setTimeLeft(null);
          setVisible(false);
          return;
        }
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

  const remindLater = () => {
    setSnoozeUntil(Date.now() + SNOOZE_MS);
    setVisible(false);
  };

  if (!visible) return null;

  // Non-blocking toast (no backdrop), stays clickable-through
  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 9999,
        maxWidth: 380,
        pointerEvents: "none", // container ignores clicks…
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className="card shadow-lg border-warning"
        style={{ borderWidth: 2, pointerEvents: "auto" }} // …but the card accepts clicks
      >
        <div className="card-body">
          <div className="d-flex align-items-start">
            <div className="me-2">
              <span className="badge text-bg-warning">Session</span>
            </div>
            <div className="flex-grow-1">
              <div className="fw-semibold mb-1">Your session will expire soon</div>
              <div className="small text-muted mb-2">
                Time remaining: <strong>{mmss}</strong>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={remindLater}
                  className="btn btn-sm btn-outline-secondary"
                >
                  Remind me later
                </button>
                {/* No “Stay signed in” button by design */}
              </div>
              <div className="small text-muted mt-2">
                You’ll be asked to sign in again when the timer reaches 00:00.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
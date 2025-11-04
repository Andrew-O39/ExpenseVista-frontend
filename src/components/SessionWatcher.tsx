import { useEffect, useMemo, useState } from "react";
import { isTokenValid } from "../utils/auth";
import { getCurrentUser } from "../services/api";

const THRESHOLD_MS = 2 * 60 * 1000;   // show prompt when < 2 min left
const CHECK_EVERY_MS = 1000;          // check every second
const SNOOZE_MS = 5 * 60 * 1000;      // “remind me later” snooze
const EXTEND_MS = 30 * 60 * 1000;     // fallback local extend by 30 minutes

/**
 * Try common refresh endpoints. Works if your backend sets/reads a refresh cookie
 * or returns a new access token + expiry.
 *
 * Supports a few common shapes:
 * - { access_token, expires_in_ms }
 * - { access_token, expires_at_ms }
 * - { access_token, token_expiry }  // absolute ms
 * - Or no body but 200 OK (cookie-based session) → just ping me() afterwards
 */
async function tryBackendRefresh(): Promise<boolean> {
  const base =
    (import.meta as any)?.env?.VITE_API_BASE_URL?.replace(/\/+$/, "") || "";
  const candidates = [
    "/auth/refresh",
    "/auth/token/refresh",
    "/auth/session/refresh",
  ];

  for (const path of candidates) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        credentials: "include", // allow cookie-based refresh
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) continue;

      // try to parse json; some endpoints return empty body
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      // if a new access token is returned, store it
      if (data?.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }

      // normalize expiry
      if (typeof data?.expires_in_ms === "number") {
        localStorage.setItem(
          "token_expiry",
          String(Date.now() + Number(data.expires_in_ms))
        );
      } else if (typeof data?.expires_at_ms === "number") {
        localStorage.setItem("token_expiry", String(Number(data.expires_at_ms)));
      } else if (typeof data?.token_expiry === "number") {
        // assume absolute ms
        localStorage.setItem("token_expiry", String(Number(data.token_expiry)));
      } else if (!data && res.ok) {
        // empty body but 200 → cookie-based session likely extended
        // we'll verify with a ping below in staySignedIn()
      }

      return true;
    } catch {
      // ignore and try next candidate
    }
  }

  return false;
}

export default function SessionWatcher() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [snoozeUntil, setSnoozeUntil] = useState<number>(0);
  const [visible, setVisible] = useState(false);
  const [working, setWorking] = useState(false); // button spinner / disable

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
        const expiryStr = localStorage.getItem("token_expiry");
        if (!expiryStr) {
          setTimeLeft(null);
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

  const forceLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_expiry");
    // if you keep per-user flags, clear them here too
    window.location.href = "/login?reason=expired";
  };

  const softExtendLocally = () => {
    const newExpiry = Date.now() + EXTEND_MS;
    localStorage.setItem("token_expiry", String(newExpiry));
  };

  const staySignedIn = async () => {
    if (working) return;
    setWorking(true);
    try {
      const token = localStorage.getItem("access_token");

      // If already invalid, bail to login right away
      if (!token || !isTokenValid()) {
        forceLogout();
        return;
      }

      // 1) Try a real backend refresh (cookie or token-based)
      const refreshed = await tryBackendRefresh();

      if (refreshed) {
        // Verify session is alive (and refresh might have set a new cookie)
        try {
          const t = localStorage.getItem("access_token");
          if (t) await getCurrentUser(t);
        } catch {
          // backend says no → force logout to avoid blank pages
          forceLogout();
          return;
        }

        // Hide banner + snooze a bit
        setVisible(false);
        setSnoozeUntil(Date.now() + 30 * 1000);

        // Safety: reload app so every view picks up fresh token/expiry
        window.location.reload();
        return;
      }

      // 2) Fallback: soft-extend locally and ping backend.
      // This only works if your backend session is cookie-based or not strictly exp-bound.
      softExtendLocally();

      try {
        const t = localStorage.getItem("access_token");
        if (!t) throw new Error("No token");
        await getCurrentUser(t);
      } catch {
        // Ping failed → server thinks we're expired. Log out cleanly.
        forceLogout();
        return;
      }

      // Success path: hide + snooze + light reload
      setVisible(false);
      setSnoozeUntil(Date.now() + 30 * 1000);
      // A light reload ensures any components that cached the old expiry stop being confused
      window.location.reload();
    } finally {
      setWorking(false);
    }
  };

  const remindLater = () => {
    setSnoozeUntil(Date.now() + SNOOZE_MS);
    setVisible(false);
  };

  if (!visible) return null;

  // simple, click-through-safe toast (no backdrop)
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
                  disabled={working}
                >
                  {working ? "Extending…" : "Stay signed in"}
                </button>
                <button
                  type="button"
                  onClick={remindLater}
                  className="btn btn-sm btn-outline-secondary"
                  disabled={working}
                >
                  Remind me later
                </button>
              </div>
              <div className="small text-muted mt-2">
                If extension fails, you’ll be redirected to sign in again to avoid a frozen screen.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
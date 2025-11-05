import { useEffect, useMemo, useState } from "react";

/** Live-reads localStorage token_expiry and returns remaining ms + helpers */
export default function useSessionTimeLeft() {
  const [expiryMs, setExpiryMs] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  // read once on mount
  useEffect(() => {
    const read = () => {
      const expStr = localStorage.getItem("token_expiry");
      setExpiryMs(expStr ? Number(expStr) : null);
      setNow(Date.now());
    };
    read();

    // tick each second
    const t = setInterval(() => setNow(Date.now()), 1000);

    // keep in sync across tabs / when login updates expiry
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token_expiry" || e.key === "access_token") read();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      clearInterval(t);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const timeLeftMs = useMemo(() => {
    if (expiryMs == null) return null;
    return Math.max(0, expiryMs - now);
  }, [expiryMs, now]);

  const expired = useMemo(() => timeLeftMs !== null && timeLeftMs <= 0, [timeLeftMs]);

  const mmss = useMemo(() => {
    if (timeLeftMs == null) return "";
    const total = Math.floor(timeLeftMs / 1000);
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [timeLeftMs]);

  const expiresAt = useMemo(() => {
    if (expiryMs == null) return "";
    return new Date(expiryMs).toLocaleString();
  }, [expiryMs]);

  // percentage (useful for a subtle progress bar)
  const pct = useMemo(() => {
    // If you always issue 60min tokens, we can compute against 60min window.
    // Otherwise omit/adjust. Here we try to infer 60min as default.
    const TOTAL_MS = 60 * 60 * 1000;
    if (expiryMs == null) return 0;
    const issuedAt = expiryMs - TOTAL_MS;
    const spent = now - issuedAt;
    return Math.min(100, Math.max(0, (spent / TOTAL_MS) * 100));
  }, [expiryMs, now]);

  return { timeLeftMs, mmss, expiresAt, expired, pct };
}
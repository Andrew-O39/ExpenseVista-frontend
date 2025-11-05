export type CurrencyCode = string; // ISO 4217, e.g., "USD", "EUR", "GHS"

const CURRENCY_KEY = "currency_code";
const LOCALE_KEY = "currency_locale";

// ---- Safe storage helpers (SSR/test friendly) ----
function getLS(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function setLS(key: string, val: string) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, val);
  } catch {
    /* ignore */
  }
}

// ---- Public getters/setters ----
/** Get current currency code (default: EUR) */
export function getCurrencyCode(): CurrencyCode {
  return (getLS(CURRENCY_KEY) || "EUR").toUpperCase();
}

/** Set currency code (e.g., "USD", "GHS") */
export function setCurrencyCode(code: CurrencyCode) {
  setLS(CURRENCY_KEY, code.toUpperCase());
}

/** Get current locale for formatting (default: browser locale) */
export function getLocale(): string {
  // navigator.language may throw under some environments, so guard it.
  let browser = "en-US";
  try {
    browser = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";
  } catch {
    // keep default
  }
  return getLS(LOCALE_KEY) || browser;
}

/** Set locale (e.g., "en-US", "de-DE", "fr-FR") */
export function setLocale(locale: string) {
  setLS(LOCALE_KEY, locale);
}

// ---- Formatter cache (perf) ----
const fmtCache = new Map<string, Intl.NumberFormat>();
function cacheKey(code: string, locale: string, compact?: boolean) {
  return `${locale}|${code}|${compact ? "compact" : "normal"}`;
}

/** Safely create an Intl formatter; falls back to plain number on invalid code */
function makeFormatter(code: CurrencyCode, locale: string, compact = false) {
  const key = cacheKey(code, locale, compact);
  const hit = fmtCache.get(key);
  if (hit) return hit;

  try {
    const nf = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      ...(compact ? { notation: "compact", compactDisplay: "short" as const } : {}),
    });
    fmtCache.set(key, nf);
    return nf;
  } catch {
    const nf = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...(compact ? { notation: "compact", compactDisplay: "short" as const } : {}),
    });
    fmtCache.set(key, nf);
    return nf;
  }
}

/** Detect if an Intl.NumberFormat is actually using currency style */
function usesCurrencyStyle(nf: Intl.NumberFormat): boolean {
  try {
    const r = nf.resolvedOptions?.();
    return r?.style === "currency";
  } catch {
    return false;
  }
}

// ---- Public formatting ----
/** Format any number using current currency + locale */
export function formatMoney(
  amount: number | string | null | undefined,
  opts?: { currency?: CurrencyCode; locale?: string }
): string {
  const n = Number(amount ?? 0);
  const code = (opts?.currency || getCurrencyCode()).toUpperCase();
  const locale = opts?.locale || getLocale();
  const nf = makeFormatter(code, locale, false);

  const base = nf.format(n);
  return usesCurrencyStyle(nf) ? base : `${code} ${base}`;
}

/** Compact formatting for charts/badges: 12345 → $12.3K */
export function formatMoneyCompact(
  amount: number | string | null | undefined,
  opts?: { currency?: CurrencyCode; locale?: string }
): string {
  const n = Number(amount ?? 0);
  const code = (opts?.currency || getCurrencyCode()).toUpperCase();
  const locale = opts?.locale || getLocale();
  const nf = makeFormatter(code, locale, true);

  const base = nf.format(n);
  return usesCurrencyStyle(nf) ? base : `${code} ${base}`;
}

/** Expose fraction digits for UI (some currencies have 0, e.g., JPY) */
export function currencyFractionDigits(code = getCurrencyCode(), locale = getLocale()): number {
  try {
    const r = new Intl.NumberFormat(locale, { style: "currency", currency: code }).resolvedOptions();
    return r.minimumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/** Extract the currency symbol for current code/locale */
export function getCurrencySymbol(code = getCurrencyCode(), locale = getLocale()): string {
  try {
    const parts = new Intl.NumberFormat(locale, { style: "currency", currency: code })
      .formatToParts(1);
    const sym = parts.find(p => p.type === "currency")?.value;
    return sym || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

/** Convenience getter for UI components */
export function getCurrency() {
  const code = getCurrencyCode();
  const locale = getLocale();
  return {
    code,
    symbol: getCurrencySymbol(code, locale),
    locale,
    fractionDigits: currencyFractionDigits(code, locale),
  };
}

/** Friendly alias for components */
export const formatCurrency = formatMoney;
import { useEffect, useState } from "react";
import { getCurrencyCode, setCurrencyCode, getLocale, setLocale, formatMoney } from "@/utils/currency";

const COMMON = [
  "USD","EUR","GBP","JPY","AUD","CAD","CHF","CNY","SEK","NZD",
  "GHS","NGN","ZAR","KES","MAD","EGP","INR","AED","SAR","QAR","BRL","MXN",
];

export default function CurrencySelector() {
  const [code, setCode] = useState(getCurrencyCode());
  const [locale, setLoc] = useState(getLocale());
  const [amount] = useState(1234.56);

  useEffect(() => {
    // keep state in sync if other tabs change it
    const onStorage = (e: StorageEvent) => {
      if (e.key === "currency_code") setCode(getCurrencyCode());
      if (e.key === "currency_locale") setLoc(getLocale());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const apply = () => {
    setCurrencyCode(code);
    setLocale(locale);
    // simplest: refresh so all pages pick up new formatters
    window.location.reload();
  };

  return (
    <div className="d-flex gap-2 align-items-end">
      <div>
        <label className="form-label mb-1">Currency code (ISO 4217)</label>
        <div className="input-group">
          <select
            className="form-select"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            style={{ maxWidth: 160 }}
          >
            {COMMON.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            className="form-control"
            placeholder="Or type e.g. GHS"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>
        <div className="form-text">Supports any valid ISO-4217 code.</div>
      </div>

      <div>
        <label className="form-label mb-1">Locale</label>
        <input
          className="form-control"
          style={{ maxWidth: 140 }}
          value={locale}
          onChange={(e) => setLoc(e.target.value)}
          placeholder="en-US / de-DE"
        />
        <div className="form-text">Affects separators & symbol position.</div>
      </div>

      <button className="btn btn-primary" onClick={apply}>Apply</button>

      <div className="ms-3 small text-muted">
        Preview: <strong>{formatMoney(amount, { currency: code, locale })}</strong>
      </div>
    </div>
  );
}
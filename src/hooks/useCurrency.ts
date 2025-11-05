import { useSyncExternalStore } from "react";
import { getCurrency, setCurrencyCode, setLocale } from "../utils/currency";

/**
 * Lightweight React hook for accessing and updating the active currency.
 * Currently reads from localStorage; can be expanded to notify components when changed.
 */
export function useCurrency() {
  // This ensures React re-renders if we later add subscriptions.
  const currency = useSyncExternalStore(
    // No-op subscriber for now
    () => () => {},
    () => getCurrency()
  );

  return {
    ...currency,
    /** Change the active currency code (e.g., "USD", "GHS", "EUR") */
    setCurrency: setCurrencyCode,
    /** Change locale for number formatting (e.g., "en-US", "fr-FR") */
    setLocale,
  };
}
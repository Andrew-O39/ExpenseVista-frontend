import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type Variant = "income" | "expenses" | "net";

type Props = {
  label: ReactNode;
  value: string;
  subtitle?: string;
  valueClassName?: string;
  variant?: Variant;
  /** When provided with formatValue, the value animates from 0 to this number on mount. */
  numericValue?: number;
  /** Formatter used for count-up animation (e.g. formatMoney). Ignored if numericValue is not set. */
  formatValue?: (n: number) => string;
};

const COUNT_UP_DURATION_MS = 1000;
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Presentational KPI card for the dashboard overview (income, expenses, net).
 */
export default function DashboardKpiCard({
  label,
  value,
  subtitle,
  valueClassName,
  variant,
  numericValue,
  formatValue,
}: Props) {
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (typeof numericValue === "number" && typeof formatValue === "function") {
      return formatValue(0);
    }
    return value;
  });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (
      typeof numericValue !== "number" ||
      typeof formatValue !== "function" ||
      hasAnimated.current
    ) {
      return;
    }
    hasAnimated.current = true;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / COUNT_UP_DURATION_MS, 1);
      const eased = easeOutExpo(t);
      const current = numericValue * eased;
      setDisplayValue(formatValue(current));
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [numericValue, formatValue]);

  const cardClass = [
    "card",
    "shadow-sm",
    "h-100",
    "dashboard-kpi-card",
    variant ? `dashboard-kpi-card--${variant}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const showValue =
    typeof numericValue === "number" && typeof formatValue === "function"
      ? displayValue
      : value;

  return (
    <div className={cardClass}>
      <div className="card-body">
        <div className="dashboard-kpi-label">{label}</div>
        <div className={`dashboard-kpi-value ${valueClassName ?? ""}`.trim()}>
          {showValue}
        </div>
        {subtitle && <div className="small text-muted">{subtitle}</div>}
      </div>
    </div>
  );
}

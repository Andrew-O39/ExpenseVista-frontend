import type { ReactNode } from "react";

type Variant = "income" | "expenses" | "net";

type Props = {
  label: ReactNode;
  value: string;
  subtitle?: string;
  valueClassName?: string;
  variant?: Variant;
};

/**
 * Presentational KPI card for the dashboard overview (income, expenses, net).
 */
export default function DashboardKpiCard({
  label,
  value,
  subtitle,
  valueClassName,
  variant,
}: Props) {
  const cardClass = [
    "card",
    "shadow-sm",
    "h-100",
    "dashboard-kpi-card",
    variant ? `dashboard-kpi-card--${variant}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      <div className="card-body">
        <div className="dashboard-kpi-label">{label}</div>
        <div className={`dashboard-kpi-value ${valueClassName ?? ""}`.trim()}>
          {value}
        </div>
        {subtitle && <div className="small text-muted">{subtitle}</div>}
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

type Props = {
  label: ReactNode;
  value: string;
  subtitle?: string;
  valueClassName?: string;
};

/**
 * Presentational KPI card for the dashboard overview (income, expenses, net).
 */
export default function DashboardKpiCard({
  label,
  value,
  subtitle,
  valueClassName,
}: Props) {
  return (
    <div className="card shadow-sm h-100 dashboard-kpi-card">
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

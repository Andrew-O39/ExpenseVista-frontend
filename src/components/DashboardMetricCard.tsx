type Variant = "income" | "expenses" | "net";

type Props = {
  label: string;
  value: string;
  color: string;
  legendText: string;
  /** Optional variant for accent border (matches Income vs Expenses semantics). */
  variant?: Variant;
};

/**
 * Presentational metric card for grouped chart totals (income, expenses, net).
 */
export default function DashboardMetricCard({
  label,
  value,
  color,
  legendText,
  variant,
}: Props) {
  const cardClass = [
    "card",
    "shadow-sm",
    "h-100",
    "dashboard-metric-card",
    variant ? `dashboard-metric-card--${variant}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      <div className="card-body">
        <div className="text-muted small">{label}</div>
        <div className="fs-4 fw-bold dashboard-metric-value" style={{ color }}>
          {value}
        </div>
        <div className="small mt-1">
          <span
            className="dashboard-chart-legend-dot"
            style={{ background: color }}
            aria-hidden
          />
          {legendText}
        </div>
      </div>
    </div>
  );
}

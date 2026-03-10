type Props = {
  label: string;
  value: string;
  color: string;
  legendText: string;
};

/**
 * Presentational metric card for grouped chart totals (income, expenses, net).
 */
export default function DashboardMetricCard({
  label,
  value,
  color,
  legendText,
}: Props) {
  return (
    <div className="card shadow-sm h-100">
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

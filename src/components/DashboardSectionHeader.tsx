import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: ReactNode;
};

/**
 * Presentational section header for dashboard sections (title + optional subtitle).
 */
export default function DashboardSectionHeader({ title, subtitle }: Props) {
  return (
    <div className="dashboard-section-header">
      <div>
        <h2 className="dashboard-section-title mb-1">{title}</h2>
        {subtitle != null && (
          <p className="dashboard-section-subtitle mb-0 text-muted">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

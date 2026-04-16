import { useId, useState, type ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: ReactNode;
  /** When false, section is always expanded and has no toggle. */
  collapsible?: boolean;
  /** Initial expanded state when `collapsible` is true. */
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Collapsible dashboard section with shared header styling.
 * Use `collapsible={false}` for KPI-style blocks that stay open.
 */
export default function DashboardSection({
  title,
  subtitle,
  collapsible = true,
  defaultExpanded = true,
  children,
  className = "",
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const id = useId();
  const panelId = `${id}-panel`;

  if (!collapsible) {
    return (
      <section className={`dashboard-section ${className}`.trim()}>
        <div className="dashboard-section-header dashboard-section-header--static">
          <div>
            <h5 className="dashboard-section-title mb-1">{title}</h5>
            {subtitle != null && (
              <p className="dashboard-section-subtitle mb-0 text-muted small">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {children}
      </section>
    );
  }

  return (
    <section className={`dashboard-section ${className}`.trim()}>
      <button
        type="button"
        className="dashboard-section-toggle"
        aria-expanded={expanded}
        aria-controls={panelId}
        id={`${id}-heading`}
        onClick={() => setExpanded((e) => !e)}
      >
        <span
          className="dashboard-section-toggle-chevron"
          aria-hidden
        />
        <div className="dashboard-section-toggle-label text-start">
          <h5 className="dashboard-section-title mb-1">{title}</h5>
          {subtitle != null && (
            <p className="dashboard-section-subtitle mb-0 text-muted small">
              {subtitle}
            </p>
          )}
        </div>
      </button>
      <div
        className="dashboard-section-collapsible"
        data-expanded={expanded}
        id={panelId}
        role="region"
        aria-labelledby={`${id}-heading`}
      >
        <div
          className="dashboard-section-collapsible-inner"
          inert={!expanded ? true : undefined}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

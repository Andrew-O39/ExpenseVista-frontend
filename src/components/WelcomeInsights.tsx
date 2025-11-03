// src/components/WelcomeInsights.tsx
import { Link } from "react-router-dom";

type Bar = { label: string; value: number };
type PairBar = { label: string; a: number; b: number };

function BarRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-2">
      <div className="d-flex justify-content-between small">
        <span className="text-muted">{label}</span>
        <span className="text-muted">{value.toLocaleString(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}</span>
      </div>
      <div className="progress" style={{ height: 8 }}>
        <div className="progress-bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TinyGroupedBars({
  items,
  max,
  aLabel,
  bLabel,
}: {
  items: PairBar[];
  max: number;
  aLabel: string;
  bLabel: string;
}) {
  // simple stacked layout: two thin bars per label
  return (
    <div>
      <div className="d-flex gap-3 small text-muted mb-2">
        <div><span className="badge bg-primary me-1">&nbsp;</span>{aLabel}</div>
        <div><span className="badge bg-secondary me-1">&nbsp;</span>{bLabel}</div>
      </div>
      {items.map((it) => {
        const aPct = max > 0 ? Math.round((it.a / max) * 100) : 0;
        const bPct = max > 0 ? Math.round((it.b / max) * 100) : 0;
        return (
          <div key={it.label} className="mb-2">
            <div className="d-flex justify-content-between small">
              <span className="text-muted">{it.label}</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <div className="progress flex-fill" style={{ height: 6 }}>
                <div className="progress-bar bg-primary" style={{ width: `${aPct}%` }} />
              </div>
              <div className="progress flex-fill" style={{ height: 6 }}>
                <div className="progress-bar bg-secondary" style={{ width: `${bPct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function WelcomeInsights() {
  // --- Demo data (purely illustrative) ---
  const incomeVsExpense: Bar[] = [
    { label: "Income (Oct)", value: 3200 },
    { label: "Expenses (Oct)", value: 2450 },
  ];
  const maxIE = Math.max(...incomeVsExpense.map((b) => b.value), 1);

  const budgetVsActual: PairBar[] = [
    { label: "Groceries", a: 300, b: 260 },  // a = Budget, b = Spent
    { label: "Transport", a: 120, b: 90 },
    { label: "Utilities", a: 200, b: 210 },  // over budget example
  ];
  const maxBA = Math.max(...budgetVsActual.flatMap((x) => [x.a, x.b]), 1);

  return (
    <div className="row g-3 mt-1">
      {/* Income vs. Expenses */}
      <div className="col-12 col-lg-6">
        <div className="card shadow-sm h-100">
          <div className="card-body">
            <h5 className="card-title mb-3">Income vs. Expenses (preview)</h5>
            {incomeVsExpense.map((b) => (
              <BarRow key={b.label} label={b.label} value={b.value} max={maxIE} />
            ))}
            <p className="small text-muted mt-3 mb-0">
              Your dashboard shows trends over time, top categories, and your net balance at a glance.
              <br />
              <Link to="/dashboard">Open the full dashboard →</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Budget vs. Actual */}
      <div className="col-12 col-lg-6">
        <div className="card shadow-sm h-100">
          <div className="card-body">
            <h5 className="card-title mb-3">Budget vs. Actual (preview)</h5>
            <TinyGroupedBars
              items={budgetVsActual}
              max={maxBA}
              aLabel="Budget"
              bLabel="Spent"
            />
            <p className="small text-muted mt-3 mb-0">
              See which categories are under or over budget, and adjust as needed.
              <br />
              <Link to="/budgets">Review your budgets →</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Lists & filtering */}
      <div className="col-12">
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-2">Find anything fast (lists & filters)</h5>
            <p className="text-muted mb-2">
              Every list page supports quick filtering, search, and pagination:
            </p>
            <ul className="mb-2">
              <li>
                <strong>Expenses list:</strong> filter by dates, search descriptions, or narrow by category.{" "}
                <Link to="/expenses">Open expenses →</Link>
              </li>
              <li>
                <strong>Budgets list:</strong> filter by period (weekly, monthly, yearly…) or category.{" "}
                <Link to="/budgets">Open budgets →</Link>
              </li>
              <li>
                <strong>Incomes list:</strong> filter by date range, source, or category.{" "}
                <Link to="/incomes">Open incomes →</Link>
              </li>
            </ul>
            <p className="small text-muted mb-0">
              Tip: you can always start from the dashboard and jump straight into the right list or category.
              Moreover you can always revisit this Welcome page from your dashboard's Action Dropdown.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
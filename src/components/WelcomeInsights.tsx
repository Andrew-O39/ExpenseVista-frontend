import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { formatMoney, getCurrencyCode } from "../utils/currency";

type PairBar = { label: string; a: number; b: number };

export default function WelcomeInsights() {
  // --- Demo data (purely illustrative) ---
  const incomeVsExpense = [
    { name: "Income (Oct)", value: 3200 },
    { name: "Expenses (Oct)", value: 2450 },
  ];

  const budgetVsActual: PairBar[] = [
    { label: "Groceries", a: 300, b: 260 },  // a = Budget, b = Spent
    { label: "Transport", a: 120, b: 90 },
    { label: "Utilities", a: 200, b: 210 },  // over budget example
  ];

  const stacked = budgetVsActual.map((x) => ({
    name: x.label,
    Budget: x.a,
    Spent: x.b,
  }));

  const currencyCode = getCurrencyCode();

  return (
    <div className="row g-3 mt-1">
      {/* Income vs. Expenses */}
      <div className="col-12 col-lg-6">
        <div className="card shadow-sm h-100">
          <div className="card-body">
            <h5 className="card-title mb-3">Income vs. Expenses (preview)</h5>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeVsExpense} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => formatMoney(v)} />
                  <Tooltip
                    formatter={(v: any) => formatMoney(Number(v))}
                    labelFormatter={(l) => String(l)}
                  />
                  <Bar dataKey="value" name={`Amount (${currencyCode})`} fill="#3498db" radius={[4,4,0,0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>

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
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stacked} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => formatMoney(v)} />
                  <Tooltip
                    formatter={(v: any) => formatMoney(Number(v))}
                    labelFormatter={(l) => String(l)}
                  />
                  <Legend />
                  <Bar dataKey="Budget" fill="#9b59b6" radius={[4,4,0,0]} />
                  <Bar dataKey="Spent"  fill="#e74c3c" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

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
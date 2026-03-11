import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

import { getSummary, getBudgets, getOverview } from '../services/api';
import { isTokenValid } from '../utils/auth';

import BudgetVsExpensesChart from '../components/BudgetVsExpensesChart';
import DashboardKpiCard from '../components/DashboardKpiCard';
import DashboardSectionHeader from '../components/DashboardSectionHeader';
import DashboardMetricCard from '../components/DashboardMetricCard';
import { formatMoney } from "../utils/currency";
import type { CurrentPeriod } from '../types/period';


/* =========================
   Types
========================= */
type NormalizedSummary = {
  period: string;
  summary: Record<string, number>;
};

type BudgetItem = {
  category: string;
  amount: number;
  period: string;
  created_at?: string;
};

type Overview = {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  start?: string | null;
  end?: string | null;
  category?: string | null;
};

type OverviewPoint = { label: string; income: number; expenses: number; net: number };


/* =========================
   Helpers
========================= */
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#FF6384'];

function cleanCategory(cat: string): string {
  return cat.toLowerCase().trim().replace(/\s+/g, ' ').normalize();
}

function prettyPeriod(p?: string) {
  switch (p) {
    case 'weekly':      return 'this week';
    case 'monthly':     return 'this month';
    case 'quarterly':   return 'this quarter';
    case 'half-yearly': return 'this half-year';
    case 'yearly':      return 'this year';
    default:            return p || '';
  }
}

function formatRange(start?: string | null, end?: string | null) {
  if (!start || !end) return '';
  const s = new Date(start).toLocaleDateString();
  const e = new Date(end).toLocaleDateString();
  return `${s} – ${e}`;
}

function rangeFor(period: CurrentPeriod) {
  const now = new Date();

  if (period === 'weekly') {
    // ISO week: Mon–Sun
    const day = now.getDay(); // 0..6 (Sun..Sat)
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    const start = new Date(now); start.setDate(now.getDate() + diffToMonday); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
    return { start, end };
  }

  if (period === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23,59,59,999);
    return { start, end };
  }

  if (period === 'quarterly') {
    const q = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), q * 3, 1);
    const end   = new Date(now.getFullYear(), q * 3 + 3, 0, 23,59,59,999);
    return { start, end };
  }

  if (period === 'half-yearly') {
    const firstHalf = now.getMonth() < 6;
    const start = new Date(now.getFullYear(), firstHalf ? 0 : 6, 1);
    const end   = new Date(now.getFullYear(), firstHalf ? 6 : 12, 0, 23,59,59,999);
    return { start, end };
  }

  // yearly
  const start = new Date(now.getFullYear(), 0, 1);
  const end   = new Date(now.getFullYear(), 11, 31, 23,59,59,999);
  return { start, end };
}

const toIso = (d: Date) => d.toISOString();

// Human label for the fixed grouped window (we use 'yearly' today)
const prettyGroupedWindow = (w: 'weekly' | 'monthly' | 'yearly') => {
  switch (w) {
    case 'weekly':  return 'this week';
    case 'monthly': return 'this month';
    case 'yearly':  return 'this year';
  }
};

// Format date as DD.MM.YYYY
function fmtDDMMYYYY(d: Date) {
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

// Turn a label into a start/end span (supports monthly, quarterly, half-yearly)
const spanFromLabel = (label: string) => {
  // YYYY-MM
  const m = label.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const year = Number(m[1]);
    const monthIndex = Number(m[2]) - 1; // 0-based
    const start = new Date(Date.UTC(year, monthIndex, 1));
    const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
    return { start, end };
  }

  // YYYY-QN
  const q = label.match(/^(\d{4})-Q([1-4])$/i);
  if (q) {
    const year = Number(q[1]);
    const quarter = Number(q[2]);
    const startMonth = (quarter - 1) * 3;
    const start = new Date(Date.UTC(year, startMonth, 1));
    const end = new Date(Date.UTC(year, startMonth + 3, 0, 23, 59, 59, 999));
    return { start, end };
  }

  // YYYY-HN
  const h = label.match(/^(\d{4})-H([12])$/i);
  if (h) {
    const year = Number(h[1]);
    const half = Number(h[2]);
    const startMonth = half === 1 ? 0 : 6;
    const start = new Date(Date.UTC(year, startMonth, 1));
    const end = new Date(Date.UTC(year, startMonth + 6, 0, 23, 59, 59, 999));
    return { start, end };
  }

  return null;
};

/* =========================
   Component
========================= */
export default function Dashboard() {
  const navigate = useNavigate();

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Top filters (do NOT affect grouped chart)
  const [appliedPeriod, setAppliedPeriod] = useState<CurrentPeriod>('monthly');
  const [appliedCategory, setAppliedCategory] = useState<string>('');
  const [pendingPeriod, setPendingPeriod] = useState<CurrentPeriod>('monthly');
  const [pendingCategory, setPendingCategory] = useState(appliedCategory);

  // Data state
  const [summary, setSummary] = useState<NormalizedSummary>({ period: appliedPeriod, summary: {} });
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);

  // Overview cards (top)
  const [overview, setOverview] = useState<Overview | null>(null);
  const [overviewCat, setOverviewCat] = useState<{ total_expenses: number; start?: string | null; end?: string | null } | null>(null);
  const [computedNet, setComputedNet] = useState<number | null>(null);

  // Grouped chart (independent of top filters)
  const [groupBy, setGroupBy] = useState<'weekly' | 'monthly' | 'quarterly' | 'half-yearly'>('monthly');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [overviewSeries, setOverviewSeries] = useState<OverviewPoint[]>([]);
  const [overviewTotals, setOverviewTotals] = useState<{ income: number; expenses: number; net: number } | null>(null);

  /* =========================
     Data fetch for TOP section
     (depends on period/category; grouped chart is independent)
  ========================= */
  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('access_token');

    if (!token || !isTokenValid()) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_expiry');
      navigate('/login', { replace: true });
      return;
    }
    const t = token as string;

    async function fetchTop() {
      setLoading(true);
      setError(null);

      try {
        // Spending summary
        const rawSummary = await getSummary(t, appliedPeriod as any, appliedCategory || undefined);
        if (!mounted) return;

        let normSummary: NormalizedSummary = { period: appliedPeriod, summary: {} };
        if (rawSummary && typeof rawSummary === 'object') {
          if ('total_spent' in rawSummary && typeof (rawSummary as any).total_spent === 'number') {
            const cat = cleanCategory((rawSummary as any).category ?? 'category');
            normSummary = {
              period: (rawSummary as any).period ?? appliedPeriod,
              summary: { [cat]: Number((rawSummary as any).total_spent) || 0 },
            };
          } else if ('summary' in rawSummary && typeof (rawSummary as any).summary === 'object') {
            const map: Record<string, number> = {};
            Object.entries((rawSummary as any).summary).forEach(([k, v]) => {
              if (typeof k === 'string') {
                const cleanedCat = cleanCategory(k);
                map[cleanedCat] = Number(v) || 0;
              }
            });
            normSummary = {
              period: (rawSummary as any).period ?? appliedPeriod,
              summary: map,
            };
          }
        }
        setSummary(normSummary);

        // --- Budgets for the *current* appliedPeriod window ---
        const { start, end } = rangeFor(appliedPeriod);
        const rawBudgets = await getBudgets(t, {
           period: appliedPeriod as any,
           startDate: toIso(start),
           endDate: toIso(end),
           // category: appliedCategory || undefined,
           page: 1,
           limit: 100,
        });

        const mappedBudgets: BudgetItem[] = (rawBudgets ?? []).map((b: any) => ({
          category: cleanCategory(b.category ?? ''),
          amount: Number(b.limit_amount) || 0,
          period: String(b.period ?? ''),
        }));
        setBudgets(mappedBudgets);

        // Overview (global income for period; expenses optionally filtered by category)
        const ov = await getOverview(t, {
          period: appliedPeriod as any,
          ...(appliedCategory ? { category: appliedCategory } : {}),
        });
        if (!mounted) return;

        setOverview({
          total_income: Number(ov?.total_income) || 0,
          total_expenses: Number(ov?.total_expenses) || 0,
          net_balance: Number(ov?.net_balance) || 0,
          start: ov?.start ?? null,
          end: ov?.end ?? null,
          category: (ov?.category as string | undefined) ?? (appliedCategory || null),
        });

        // If a category is selected, fetch category-specific expenses + compute net (income always global)
        if (appliedCategory) {
          const ovCat = await getOverview(t, {
            period: appliedPeriod as any,
            category: appliedCategory,
        });
          if (!mounted) return;

          const catExp = Number(ovCat?.total_expenses) || 0;
          setOverviewCat({
            total_expenses: catExp,
            start: ovCat?.start ?? null,
            end: ovCat?.end ?? null,
          });

          const allIncome = Number(ov?.total_income) || 0;
          setComputedNet(allIncome - catExp);
        } else {
          setOverviewCat(null);
          setComputedNet(null);
        }
      } catch (err: any) {
        setError(err?.response?.data ?? 'Failed to fetch data.');
        setSummary({ period: appliedPeriod, summary: {} });
        setBudgets([]);
        setOverview(null);
        setOverviewCat(null);
        setComputedNet(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchTop();
    return () => { mounted = false; };
  }, [appliedPeriod, appliedCategory, navigate]);

  /* =========================
     Data fetch for GROUPED chart
     (independent; uses only groupBy)
  ========================= */
  const GROUPED_WINDOW: 'weekly' | 'monthly' | 'yearly' = 'yearly';

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('access_token');
    if (!token || !isTokenValid()) return;
    const t = token as string;

    async function fetchGrouped() {
      try {
        const ov = await getOverview(t, {
          period: GROUPED_WINDOW,     // independent window
          group_by: groupBy,          // weekly | monthly | quarterly | half-yearly
        });
        if (!mounted) return;

        const raw = Array.isArray(ov?.results) ? ov.results : [];
        const series: OverviewPoint[] = raw
          .map((r: any): OverviewPoint => ({
            label: String(r.period ?? r.label ?? r.bucket ?? ''),
            income: Number(r.total_income ?? r.income ?? r.sum_income ?? 0),
            expenses: Number(r.total_expenses ?? r.expenses ?? r.sum_expenses ?? 0),
            net: Number(r.net_balance ?? r.net ?? (
              Number(r.total_income ?? r.income ?? 0) - Number(r.total_expenses ?? r.expenses ?? 0)
            )),
          }))
          .filter((d: { label?: string }) => Boolean(d.label));

        setOverviewSeries(series);

        // Totals always derived from what's plotted
        const totalIncome = series.reduce((a, s) => a + (s.income || 0), 0);
        const totalExpenses = series.reduce((a, s) => a + (s.expenses || 0), 0);
        const net = totalIncome - totalExpenses;

        setOverviewTotals({ income: totalIncome, expenses: totalExpenses, net });
      } catch (e) {
        console.error('Grouped overview fetch failed:', e);
        setOverviewSeries([]);
        setOverviewTotals({ income: 0, expenses: 0, net: 0 });
      }
    }

    fetchGrouped();
    return () => { mounted = false; };
  }, [groupBy]);

  /* =========================
     Derived data for table & chart
  ========================= */
  const budgetMap: Record<string, number> = {};
  budgets.forEach(b => { budgetMap[b.category] = b.amount; });

  const allCategoriesSet = new Set<string>([
    ...Object.keys(summary.summary),
    ...budgets.map(b => b.category),
  ]);

  const combinedData = Array.from(allCategoriesSet).map(cat => {
    const spent = summary.summary[cat] ?? 0;
    const budget = budgetMap[cat] ?? 0;
    return { category: cat, spent, budget };
  });

  const filteredCombinedData = appliedCategory
    ? combinedData.filter(({ category }) => category === cleanCategory(appliedCategory))
    : combinedData;

  const chartData = combinedData.map(({ category, spent, budget }) => {
    const isOverspentNoBudget = budget === 0 && spent > 0;
    return { name: category, value: spent, budget, isOverspentNoBudget };
  });

  /* =========================
     Handlers
  ========================= */
  const handleApply = () => {
    setAppliedPeriod(pendingPeriod);
    setAppliedCategory(pendingCategory.trim());
  };

  const handleReset = () => {
    setPendingPeriod('yearly');
    setPendingCategory('');
    setAppliedPeriod('yearly');
    setAppliedCategory('');
  };

  /* =========================
     Render
  ========================= */
  const renderGroupedTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ dataKey?: string; value?: number }>;
    label?: string | number;
  }) => {
    if (!active || !payload?.length) return null;
    const inc = payload.find((p) => p.dataKey === "income")?.value ?? 0;
    const exp = payload.find((p) => p.dataKey === "expenses")?.value ?? 0;
    const net = payload.find((p) => p.dataKey === "net")?.value ?? 0;
    const labelStr = typeof label === "string" ? label : String(label ?? "");
    const span = labelStr ? spanFromLabel(labelStr) : null;
    return (
      <div className="card shadow-sm p-2" style={{ minWidth: 220 }}>
        <div className="fw-semibold mb-1">{labelStr}</div>
        {span && (
          <div className="text-muted small mb-2">
            {fmtDDMMYYYY(span.start)} — {fmtDDMMYYYY(span.end)}
          </div>
        )}
        <div className="small">
          <div>
            <span className="dashboard-chart-legend-dot" style={{ background: "#2ecc71" }} aria-hidden />
            Income: {formatMoney(inc)}
          </div>
          <div>
            <span className="dashboard-chart-legend-dot" style={{ background: "#e74c3c" }} aria-hidden />
            Expenses: {formatMoney(exp)}
          </div>
          <div>
            <span className="dashboard-chart-legend-dot" style={{ background: "#3498db" }} aria-hidden />
            Net: {formatMoney(net)}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="container container-app mt-5">Loading your dashboard...</div>;
  if (error)   return <div className="container container-app mt-5 text-danger">{String(error)}</div>;

  return (
    <div className="container container-app p-4 dashboard-page">
      <h1 className="app-shell-page-title mb-4">Overview</h1>
      {/* Overview cards */}
      {overview && (
        <section className="dashboard-section">
          <div className="row g-3 dashboard-kpi-row">
            <div className="col-md-4">
              <DashboardKpiCard
                variant="income"
                label={`Total Income · ${prettyPeriod(summary.period)}`}
                value={formatMoney(overview.total_income || 0)}
                numericValue={overview.total_income ?? 0}
                formatValue={formatMoney}
                subtitle={
                  overview.start && overview.end
                    ? formatRange(overview.start, overview.end)
                    : undefined
                }
              />
            </div>
            <div className="col-md-4">
              <DashboardKpiCard
                variant="expenses"
                label={
                  appliedCategory ? (
                    <>Expenses · {prettyPeriod(summary.period)} · <strong>{appliedCategory}</strong></>
                  ) : (
                    <>Total Expenses · {prettyPeriod(summary.period)}</>
                  )
                }
                value={formatMoney(
                  appliedCategory
                    ? overviewCat?.total_expenses ?? 0
                    : overview.total_expenses ?? 0
                )}
                numericValue={
                  appliedCategory
                    ? overviewCat?.total_expenses ?? 0
                    : overview.total_expenses ?? 0
                }
                formatValue={formatMoney}
                subtitle={
                  (appliedCategory ? overviewCat?.start : overview.start) &&
                  (appliedCategory ? overviewCat?.end : overview.end)
                    ? formatRange(
                        appliedCategory ? overviewCat!.start! : overview.start!,
                        appliedCategory ? overviewCat!.end! : overview.end!
                      )
                    : undefined
                }
              />
            </div>
            <div className="col-md-4">
              <DashboardKpiCard
                variant="net"
                label={
                  appliedCategory ? (
                    <>Net after <strong>{appliedCategory}</strong> · {prettyPeriod(summary.period)}</>
                  ) : (
                    <>Net Balance · {prettyPeriod(summary.period)}</>
                  )
                }
                value={formatMoney(
                  appliedCategory ? computedNet ?? 0 : overview.net_balance ?? 0
                )}
                numericValue={
                  appliedCategory ? computedNet ?? 0 : overview.net_balance ?? 0
                }
                formatValue={formatMoney}
                valueClassName={
                  Number(
                    appliedCategory ? computedNet ?? 0 : overview.net_balance ?? 0
                  ) >= 0
                    ? "text-success"
                    : "text-danger"
                }
              />
            </div>
          </div>
        </section>
      )}

      {/* Filters (top) */}
      <section className="dashboard-section">
        <div className="card shadow-sm dashboard-filters-card">
          <div className="card-body">
            <form
              className="d-flex gap-3 flex-wrap align-items-end mb-0"
              onSubmit={(e) => {
                e.preventDefault();
                handleApply();
              }}
            >
              <div className="form-group">
                <label htmlFor="period" className="form-label">Select Period</label>
                <select
                  id="period"
                  className="form-select"
                  value={pendingPeriod}
                  onChange={(e) => setPendingPeriod(e.target.value as CurrentPeriod)}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half-yearly">Half-yearly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="form-group" style={{ minWidth: 220 }}>
                <label htmlFor="category" className="form-label">Filter by Category</label>
                <input
                  id="category"
                  type="text"
                  className="form-control"
                  placeholder="Optional category"
                  value={pendingCategory}
                  onChange={(e) => setPendingCategory(e.target.value)}
                />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">Apply</button>
                <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Spending summary + budgets + advanced reporting */}
      <section className="dashboard-section">
        <DashboardSectionHeader
          title="Spending by category"
          subtitle={
            <>
              For {prettyPeriod(summary.period)}
              {appliedCategory ? <> · focusing on <strong>{appliedCategory}</strong></> : null}
            </>
          }
        />

        {chartData.length === 0 ? (
          <p className="text-muted">No results found for this filter.</p>
        ) : (
          <div className="card shadow-sm dashboard-chart-and-table-card dashboard-chart-card">
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-6" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.isOverspentNoBudget
                                ? '#DC3545'
                                : COLORS[index % COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => formatMoney(val)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 small text-muted">
                    <span style={{ color: '#DC3545', fontWeight: 'bold' }}>■</span>{' '}
                    No budget set, but spending occurred
                  </div>
                </div>
              </div>

              <div className="table-responsive mb-4">
                <table className="table table-striped table-bordered mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Category</th>
                      <th>Budgeted Amount</th>
                      <th>Amount Spent</th>
                      <th>Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCombinedData.map(({ category, spent, budget }, index) => {
                      let remaining = 0;
                      let isOverBudget = false;

                      if (budget > 0) {
                        remaining = budget - spent;
                        isOverBudget = remaining < 0;
                      } else if (spent > 0) {
                        remaining = -spent; // negative remaining when no budget but spend exists
                        isOverBudget = true;
                      }

                      return (
                        <tr
                          key={index}
                          style={{ borderLeft: `5px solid ${COLORS[index % COLORS.length]}` }}
                        >
                          <td><strong>{category}</strong></td>
                          <td>{budget > 0 ? formatMoney(budget) : 'No Budget'}</td>
                          <td>{formatMoney(spent)}</td>
                          <td style={{ color: isOverBudget ? 'red' : 'green' }}>
                            {remaining < 0 ? '-' : ''}
                            {formatMoney(Math.abs(remaining))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Budget vs Expenses overview */}
              <div className="mt-4">
                <h3 className="h6 mb-2">Budgets vs actual spending</h3>
                <p className="text-muted small mb-3">
                  Compare how your configured budgets track against real spending over time.
                </p>
                <BudgetVsExpensesChart
                  windowPeriod="yearly"
                  initialGroupBy="monthly"
                  // category={appliedCategory || undefined}
                />
              </div>

              {/* Income vs Expenses (grouped, independent) */}
              <div className="mt-5">
                <div className="dashboard-section-header mb-3">
                  <div>
                    <h3 className="dashboard-section-title mb-1">
                      Income vs expenses over time
                    </h3>
                    <p className="dashboard-section-subtitle mb-0 text-muted">
                      Aggregated yearly window, grouped by your selected interval.
                    </p>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <label className="form-label mb-0">Group by</label>
                    <select
                      className="form-select form-select-sm w-auto"
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value as any)}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="half-yearly">Half-yearly</option>
                    </select>
                  </div>
                </div>

                {/* Totals for grouped chart (independent) */}
                <div className="row g-3 mb-3 dashboard-secondary-metrics">
                  <div className="col-md-4">
                    <DashboardMetricCard
                      variant="income"
                      label={`Total Income for ${prettyGroupedWindow("yearly")}`}
                      value={formatMoney(overviewTotals?.income ?? 0)}
                      color="#2ecc71"
                      legendText="Income series color in chart"
                    />
                  </div>
                  <div className="col-md-4">
                    <DashboardMetricCard
                      variant="expenses"
                      label={`Total Expenses for ${prettyGroupedWindow("yearly")}`}
                      value={formatMoney(overviewTotals?.expenses ?? 0)}
                      color="#e74c3c"
                      legendText="Expenses series color in chart"
                    />
                  </div>
                  <div className="col-md-4">
                    <DashboardMetricCard
                      variant="net"
                      label={`Net Balance for ${prettyGroupedWindow("yearly")}`}
                      value={formatMoney(overviewTotals?.net ?? 0)}
                      color="#3498db"
                      legendText="Net series color in chart"
                    />
                  </div>
                </div>

                {/* Chart type toggle */}
                <div className="dashboard-chart-toggle mb-2">
                  <div className="btn-group btn-group-sm" role="group" aria-label="Chart type">
                    <button
                      type="button"
                      className={`btn ${chartType === 'bar' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setChartType('bar')}
                    >
                      Bar
                    </button>
                    <button
                      type="button"
                      className={`btn ${chartType === 'line' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setChartType('line')}
                    >
                      Line
                    </button>
                  </div>
                </div>

                {/* Grouped chart */}
                <div className="card shadow-sm dashboard-chart-card">
                  <div className="card-body">
                    {overviewSeries.length === 0 ? (
                      <p className="text-muted mb-0">
                        No grouped series returned for these filters. Totals are shown above.
                      </p>
                    ) : (
                      <div style={{ height: 360 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'bar' ? (
                            <BarChart
                              data={overviewSeries}
                              margin={{ top: 16, right: 24, left: 0, bottom: 8 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="label" />
                              <YAxis />
                              <Tooltip content={renderGroupedTooltip} />
                              <Legend />
                              <Bar dataKey="income" name="Income" fill="#2ecc71" />
                              <Bar
                                dataKey="expenses"
                                name="Expenses"
                                fill="#e74c3c"
                              />
                              <Bar
                                dataKey="net"
                                name="Net Balance"
                                fill="#3498db"
                              />
                            </BarChart>
                          ) : (
                            <LineChart
                              data={overviewSeries}
                              margin={{ top: 16, right: 24, left: 0, bottom: 8 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="label" />
                              <YAxis />
                              <Tooltip content={renderGroupedTooltip} />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="income"
                                name="Income"
                                stroke="#2ecc71"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="expenses"
                                name="Expenses"
                                stroke="#e74c3c"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="net"
                                name="Net Balance"
                                stroke="#3498db"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5 }}
                              />
                            </LineChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </div>{/* /grouped section */}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
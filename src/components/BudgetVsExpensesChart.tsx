import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { getBudgets, getOverview } from '../services/api';
import { isTokenValid } from '../utils/auth';

const COLOR_BUDGET = '#9b59b6';   // purple
const COLOR_EXP    = '#e74c3c';   // red
const COLOR_REM    = '#3498db';   // blue

type GroupBy = 'weekly' | 'monthly' | 'quarterly' | 'half-yearly';
type WindowPeriod = 'weekly' | 'monthly' | 'yearly';
type SeriesPoint = { label: string; budget: number; expenses: number; remaining: number };

const euro = (n: number) => `€${Number(n || 0).toFixed(2)}`;

function fmtDDMMYYYY(d: Date) {
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function keyFromDate(d: Date, groupBy: GroupBy): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  if (groupBy === 'monthly') return `${y}-${String(m + 1).padStart(2, '0')}`;
  if (groupBy === 'quarterly') {
    const q = Math.floor(m / 3) + 1;
    return `${y}-Q${q}`;
  }
  if (groupBy === 'half-yearly') return `${y}-H${m < 6 ? 1 : 2}`;
  // weekly (ISO-ish)
  const tmp = new Date(Date.UTC(y, m, d.getUTCDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function labelToSpan(label: string, groupBy: GroupBy): string | null {
  if (!label) return null;

  if (groupBy === 'monthly') {
    const m = label.match(/(\d{4})[-/\. ]?(\d{1,2})/);
    if (m) {
      const y = Number(m[1]);
      const month = Number(m[2]) - 1;
      const start = new Date(Date.UTC(y, month, 1));
      const end   = new Date(Date.UTC(y, month + 1, 0, 23, 59, 59, 999));
      return `${fmtDDMMYYYY(start)} – ${fmtDDMMYYYY(end)}`;
    }
    return null;
  }

  if (groupBy === 'quarterly') {
    const m = label.match(/(?:(\d{4})[- ]?Q([1-4])|Q([1-4])[- ]?(\d{4}))/i);
    if (m) {
      const q = Number(m[2] || m[3]);
      const y = Number(m[1] || m[4]);
      const startMonth = (q - 1) * 3;
      const start = new Date(Date.UTC(y, startMonth, 1));
      const end   = new Date(Date.UTC(y, startMonth + 3, 0, 23, 59, 59, 999));
      return `${fmtDDMMYYYY(start)} – ${fmtDDMMYYYY(end)}`;
    }
    return null;
  }

  if (groupBy === 'half-yearly') {
    const m = label.match(/(?:(\d{4})[- ]?H([12])|H([12])[- ]?(\d{4}))/i);
    if (m) {
      const half = Number(m[2] || m[3]);
      const y = Number(m[1] || m[4]);
      const startMonth = half === 1 ? 0 : 6;
      const start = new Date(Date.UTC(y, startMonth, 1));
      const end   = new Date(Date.UTC(y, startMonth + 6, 0, 23, 59, 59, 999));
      return `${fmtDDMMYYYY(start)} – ${fmtDDMMYYYY(end)}`;
    }
    return null;
  }

  // weekly: omit (needs exact week range)
  return null;
}

/** Paginate budgets within a window (backend enforces limit ≤ 100). */
async function fetchBudgetsInWindow(
  token: string,
  opts: { startDate?: string; endDate?: string; category?: string }
) {
  const pageSize = 100;
  let page = 1;
  const all: any[] = [];

  for (let i = 0; i < 50; i++) {
    const batch = await getBudgets(token, {
      startDate: opts.startDate,
      endDate: opts.endDate,
      category: opts.category,
      page,
      limit: pageSize,
      // period not passed; window defines scope
    });
    all.push(...batch);
    if (!Array.isArray(batch) || batch.length < pageSize) break;
    page += 1;
  }
  return all;
}

export default function BudgetVsExpensesChart({
  windowPeriod = 'yearly',
  initialGroupBy = 'monthly',
  category, // initial/default category (optional)
}: {
  windowPeriod?: WindowPeriod;
  initialGroupBy?: GroupBy;
  category?: string;
}) {
  const [groupBy, setGroupBy] = useState<GroupBy>(initialGroupBy);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [totals, setTotals] = useState<{ budget: number; expenses: number; remaining: number }>({
    budget: 0, expenses: 0, remaining: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  // Local category filter controls
  const [catInput, setCatInput] = useState<string>(category ?? '');
  const [catApplied, setCatApplied] = useState<string>(category ?? '');

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  useEffect(() => {
    if (!token || !isTokenValid()) return;
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // re-assert token as a string within this scope to satisfy TS
        const tk = token as string;

        // 1) EXPENSES from overview
        const ov = await getOverview(tk, {
          period: windowPeriod,
          group_by: groupBy,
          ...(catApplied ? { category: catApplied } : {}),
        });

        const raw = Array.isArray(ov?.results) ? ov.results : [];
        const expSeries: Record<string, number> = {};
        raw.forEach((r: any) => {
          const label = String(r.period ?? r.label ?? r.bucket ?? '');
          const expenses = Number(r.total_expenses ?? r.expenses ?? r.sum_expenses ?? 0);
          if (label) expSeries[label] = (expSeries[label] || 0) + expenses;
        });

        // 2) Window dates
        let startISO: string | undefined;
        let endISO: string | undefined;
        if (ov?.start && ov?.end) {
          startISO = ov.start;
          endISO = ov.end;
        } else {
          const now = new Date();
          if (windowPeriod === 'yearly') {
            const s = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
            const e = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
            startISO = s.toISOString();
            endISO = e.toISOString();
          } else if (windowPeriod === 'monthly') {
            const s = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            const e = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()+1, 0, 23,59,59,999));
            startISO = s.toISOString();
            endISO = e.toISOString();
          } else { // weekly
            const s = new Date(now); s.setUTCHours(0,0,0,0);
            const e = new Date(now); e.setUTCHours(23,59,59,999);
            startISO = s.toISOString();
            endISO = e.toISOString();
          }
        }

        // 3) BUDGETS in the same window (paginated), filtered by category if any
        const budgets = await fetchBudgetsInWindow(tk, {
          startDate: startISO,
          endDate: endISO,
          category: catApplied || undefined,
        });

        // 4) Aggregate budgets by label
        const budSeries: Record<string, number> = {};
        (budgets || []).forEach((b: any) => {
          const created = new Date(b.created_at);
          const key = keyFromDate(created, groupBy);
          const amt = Number(b.limit_amount) || 0;
          budSeries[key] = (budSeries[key] || 0) + amt;
        });

        // 5) Merge
        const allLabels = Array.from(new Set([...Object.keys(expSeries), ...Object.keys(budSeries)])).sort();
        const merged: SeriesPoint[] = allLabels.map(label => {
          const budget = budSeries[label] || 0;
          const expenses = expSeries[label] || 0;
          return { label, budget, expenses, remaining: budget - expenses };
        });

        if (!mounted) return;
        setSeries(merged);

        const tBudget = merged.reduce((a, s) => a + s.budget, 0);
        const tExp    = merged.reduce((a, s) => a + s.expenses, 0);
        setTotals({ budget: tBudget, expenses: tExp, remaining: tBudget - tExp });
      } catch (e: any) {
        console.error('Budget vs Expenses (front-joined) failed:', e?.response?.data || e);
        if (mounted) {
          setError('Failed to load budget vs expenses.');
          setSeries([]);
          setTotals({ budget: 0, expenses: 0, remaining: 0 });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, [token, windowPeriod, groupBy, catApplied]);

  const labelToSpanMemo = useMemo(
    () => (label: string) => labelToSpan(label, groupBy),
    [groupBy]
  );

  return (
    <div className="mt-5">
      {/* Header + controls */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h3 className="mb-0">Budget vs Expenses Over Time (Advanced Reporting)</h3>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Category filter */}
          <div className="input-group input-group-sm" style={{ width: 260 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by category…"
              value={catInput}
              onChange={(e) => setCatInput(e.target.value)}
            />
            <button
              className="btn btn-outline-primary"
              onClick={() => setCatApplied(catInput.trim())}
            >
              Apply
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => { setCatInput(''); setCatApplied(''); }}
              disabled={!catApplied && !catInput}
            >
              Clear
            </button>
          </div>

          {/* Group-by selector */}
          <label className="form-label mb-0 ms-2">Group by:</label>
          <select
            className="form-select form-select-sm w-auto"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="half-yearly">Half-yearly</option>
          </select>

          {/* Chart type toggle */}
          <div className="btn-group btn-group-sm ms-2" role="group" aria-label="Chart type">
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
      </div>

      {/* Active category pill */}
      {catApplied && (
        <div className="mb-2">
          <span className="badge bg-light text-dark">
            Category: {catApplied}
          </span>
        </div>
      )}

      {/* Totals (match series colors) */}
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="text-muted small">Total Budget ({windowPeriod})</div>
              <div className="fs-4 fw-bold" style={{ color: COLOR_BUDGET }}>
                {euro(totals.budget)}
              </div>
              <div className="small mt-1">
                <span style={{ display: 'inline-block', width: 10, height: 10, background: COLOR_BUDGET, marginRight: 6, borderRadius: 2 }} />
                Budget series color
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="text-muted small">Total Expenses ({windowPeriod})</div>
              <div className="fs-4 fw-bold" style={{ color: COLOR_EXP }}>
                {euro(totals.expenses)}
              </div>
              <div className="small mt-1">
                <span style={{ display: 'inline-block', width: 10, height: 10, background: COLOR_EXP, marginRight: 6, borderRadius: 2 }} />
                Expenses series color
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="text-muted small">Remaining ({windowPeriod})</div>
              <div className="fs-4 fw-bold" style={{ color: COLOR_REM }}>
                {euro(totals.remaining)}
              </div>
              <div className="small mt-1">
                <span style={{ display: 'inline-block', width: 10, height: 10, background: COLOR_REM, marginRight: 6, borderRadius: 2 }} />
                Remaining series color
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card shadow-sm">
        <div className="card-body">
          {loading ? (
            <p className="text-muted mb-0">Loading…</p>
          ) : error ? (
            <p className="text-danger mb-0">{error}</p>
          ) : series.length === 0 ? (
            <p className="text-muted mb-0">No data for this selection.</p>
          ) : (
            <div style={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={series} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip
                      formatter={(v: any) => euro(Number(v))}
                      labelFormatter={(label) => {
                        const span = labelToSpanMemo(label);
                        return span ? `${label} (${span})` : label;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="budget"   name="Budget"    fill={COLOR_BUDGET} />
                    <Bar dataKey="expenses" name="Expenses"  fill={COLOR_EXP} />
                    <Bar dataKey="remaining"name="Remaining" fill={COLOR_REM} />
                  </BarChart>
                ) : (
                  <LineChart data={series} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip
                      formatter={(v: any) => euro(Number(v))}
                      labelFormatter={(label) => {
                        const span = labelToSpanMemo(label);
                        return span ? `${label} (${span})` : label;
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="budget"    name="Budget"    stroke={COLOR_BUDGET} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="expenses"  name="Expenses"  stroke={COLOR_EXP}    strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="remaining" name="Remaining" stroke={COLOR_REM}    strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
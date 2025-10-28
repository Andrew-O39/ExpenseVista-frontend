import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBudgets, getExpenses, getIncomes, getCurrentUser } from "./services/api";
import { isTokenValid } from "./utils/auth";

type Props = {
  /** If you already loaded the user on the page, pass it to avoid re-fetch */
  initialUser?: { is_verified: boolean; username: string; email: string };
  /** Storage key to remember dismissal */
  storageKey?: string;
};

type Item = {
  id: string;
  label: string;
  done: boolean;
  cta?: React.ReactNode;
};

const DEFAULT_STORAGE_KEY = "onboarding_checklist_dismissed";

export default function OnboardingChecklist({ initialUser, storageKey = DEFAULT_STORAGE_KEY }: Props) {
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<boolean>(() => localStorage.getItem(storageKey) === "1");

  const [isVerified, setIsVerified] = useState<boolean>(!!initialUser?.is_verified);
  const [hasBudget, setHasBudget] = useState<boolean>(false);
  const [hasExpense, setHasExpense] = useState<boolean>(false);
  const [hasIncome, setHasIncome] = useState<boolean>(false);

  useEffect(() => {
    if (dismissed) return; // don't fetch if user dismissed
    const token = localStorage.getItem("access_token");
    if (!token || !isTokenValid()) {
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        // only fetch user if not provided
        if (!initialUser) {
          const me = await getCurrentUser(token);
          if (mounted) setIsVerified(!!me?.is_verified);
        }

        // get first-page lists; we only care if > 0 items exist
        const [budgets, expenses, incomes] = await Promise.all([
          getBudgets(token, { limit: 1 }),
          getExpenses(token, { limit: 1 }),
          getIncomes(token, { limit: 1 }),
        ]);

        if (!mounted) return;
        setHasBudget(Array.isArray(budgets?.items) ? budgets.items.length > 0 : (budgets?.total ?? 0) > 0);
        setHasExpense(Array.isArray(expenses?.items) ? expenses.items.length > 0 : (expenses?.total ?? 0) > 0);
        setHasIncome(Array.isArray(incomes?.items) ? incomes.items.length > 0 : (incomes?.total ?? 0) > 0);
      } catch {
        // swallow; show partial
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dismissed, initialUser]);

  const items: Item[] = useMemo(() => {
    return [
      {
        id: "verify_email",
        label: "Verify your email",
        done: isVerified,
        cta: (
          <Link to="/verify-email" className="small ms-2">
            Verify
          </Link>
        ),
      },
      {
        id: "create_budget",
        label: "Create your first budget",
        done: hasBudget,
        cta: (
          <Link to="/budgets/new" className="small ms-2">
            Create budget
          </Link>
        ),
      },
      {
        id: "log_expense",
        label: "Log your first expense",
        done: hasExpense,
        cta: (
          <Link to="/expenses/new" className="small ms-2">
            Add expense
          </Link>
        ),
      },
      {
        id: "add_income",
        label: "Add your first income",
        done: hasIncome,
        cta: (
          <Link to="/incomes/new" className="small ms-2">
            Add income
          </Link>
        ),
      },
    ];
  }, [isVerified, hasBudget, hasExpense, hasIncome]);

  const completed = items.filter(i => i.done).length;
  const total = items.length;
  const progress = Math.round((completed / total) * 100);

  if (dismissed || loading) return null;

  // if everything is complete, auto-dismiss
  if (completed === total) {
    localStorage.setItem(storageKey, "1");
    return null;
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h5 className="card-title mb-0">Getting started</h5>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              setDismissed(true);
              localStorage.setItem(storageKey, "1");
            }}
            aria-label="Dismiss onboarding checklist"
          >
            Dismiss
          </button>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} style={{ height: 8 }}>
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <div className="small text-muted mt-1">{completed} of {total} completed</div>
        </div>

        {/* Items */}
        <ul className="list-group list-group-flush">
          {items.map(item => (
            <li key={item.id} className="list-group-item d-flex align-items-center justify-content-between">
              <div>
                <span className={`me-2 badge ${item.done ? "bg-success" : "bg-secondary"}`}>
                  {item.done ? "Done" : "Todo"}
                </span>
                {item.label}
              </div>
              {!item.done && item.cta}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "../services/api";
import { isTokenValid } from "../utils/auth";
import CurrencySelector from "./CurrencySelector";
import ThemeToggle from "./ThemeToggle";
import SessionInfoModal from "./SessionInfoModal";

/**
 * Authenticated app shell: top bar + main content area.
 * Provides consistent navigation and account actions across all app pages.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState<string | null>(null);
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !isTokenValid()) return;
    getCurrentUser(token)
      .then((user) => setUsername(user?.username ?? null))
      .catch(() => setUsername(null));
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const me = await getCurrentUser(token);
          if (me?.id) {
            localStorage.removeItem(`has_seen_welcome:${me.id}`);
            localStorage.removeItem(`onboarding_checklist_dismissed:${me.id}`);
          }
        } catch {
          /* ignore */
        }
      }
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_expiry");
      localStorage.removeItem("has_seen_welcome");
      localStorage.removeItem("onboarding_checklist_dismissed");
      navigate("/login", { replace: true });
    }
  };

  const navLink = (to: string, label: string) => {
    const isActive = location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to));
    return (
      <Link
        className={`app-shell-nav-link ${isActive ? "active" : ""}`}
        to={to}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <div className="app-shell-container">
          <div className="app-shell-brand">
            <Link to="/dashboard" className="app-shell-brand-link">
              ExpenseVista
            </Link>
          </div>
          <nav className="app-shell-nav">
            {navLink("/dashboard", "Dashboard")}
            {navLink("/expenses", "Expenses")}
            {navLink("/incomes", "Incomes")}
            {navLink("/budgets", "Budgets")}
          </nav>
          <div className="app-shell-actions">
            <div className="dropdown">
              <button
                className="btn btn-sm btn-outline-secondary dropdown-toggle"
                type="button"
                id="appShellAccountDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {username ? username : "Account"}
              </button>
              <ul
                className="dropdown-menu dropdown-menu-end"
                aria-labelledby="appShellAccountDropdown"
              >
                {username && (
                  <>
                    <li>
                      <span className="dropdown-item-text text-muted small">
                        Signed in as {username}
                      </span>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                  </>
                )}
                <li>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => navigate("/create-income")}
                  >
                    Record Income
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => navigate("/create-expense")}
                  >
                    Add Expense
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => navigate("/create-budget")}
                  >
                    Create Budget
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => navigate("/incomes")}
                  >
                    Income List
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => navigate("/expenses")}
                  >
                    Expense List
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => navigate("/budgets")}
                  >
                    Budget List
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li><span className="dropdown-item-text text-muted">Preferences</span></li>
                <li className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <ThemeToggle />
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => setCurrencyModalOpen(true)}
                  >
                    Change currency…
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => navigate("/welcome")}
                  >
                    Onboarding / Welcome Tips
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => setSessionModalOpen(true)}
                  >
                    Session info…
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    type="button"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>
      <main className="app-shell-main">
        {children}
      </main>

      {/* Currency modal */}
      {currencyModalOpen && (
        <>
          <div
            className="modal-backdrop fade show"
            onClick={() => setCurrencyModalOpen(false)}
            aria-hidden="true"
          />
          <div
            className="modal fade show"
            style={{ display: "block" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="currencyModalTitle"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="currencyModalTitle">
                    Select currency & locale
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setCurrencyModalOpen(false)}
                  />
                </div>
                <div className="modal-body">
                  <CurrencySelector />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrencyModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {sessionModalOpen && (
        <SessionInfoModal
          open={sessionModalOpen}
          onClose={() => setSessionModalOpen(false)}
        />
      )}
    </div>
  );
}

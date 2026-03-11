import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
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

  const sidebarLink = (to: string, label: string, end: boolean = true) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `app-shell-sidebar-link ${isActive ? "active" : ""}`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <div className="app-shell">
      <aside className="app-shell-sidebar">
        <nav className="app-shell-sidebar-nav" aria-label="Main navigation">
          <div className="app-shell-sidebar-section">
            <div className="app-shell-sidebar-label">Overview</div>
            <div className="app-shell-sidebar-links">
              {sidebarLink("/dashboard", "Dashboard")}
            </div>
          </div>
          <div className="app-shell-sidebar-section">
            <div className="app-shell-sidebar-label">Create</div>
            <div className="app-shell-sidebar-links">
              {sidebarLink("/create-income", "Record Income")}
              {sidebarLink("/create-expense", "Add Expense")}
              {sidebarLink("/create-budget", "Create Budget")}
            </div>
          </div>
          <div className="app-shell-sidebar-section">
            <div className="app-shell-sidebar-label">Lists</div>
            <div className="app-shell-sidebar-links">
              {sidebarLink("/incomes", "Income List")}
              {sidebarLink("/expenses", "Expense List")}
              {sidebarLink("/budgets", "Budget List")}
            </div>
          </div>
          <div className="app-shell-sidebar-section app-shell-sidebar-section--account">
            <div className="app-shell-sidebar-label">Account</div>
            <div className="app-shell-sidebar-links">
              <button
                type="button"
                className="app-shell-sidebar-link app-shell-sidebar-link--logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      </aside>

      <div className="app-shell-body">
      <header className="app-shell-header">
        <div className="app-shell-container">
          <div className="app-shell-brand">
            <Link to="/dashboard" className="app-shell-brand-link">
              ExpenseVista
            </Link>
          </div>
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
              </ul>
            </div>
          </div>
        </div>
      </header>
      <main className="app-shell-main">
        {children}
      </main>
      </div>

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

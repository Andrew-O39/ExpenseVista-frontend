import { Link } from "react-router-dom";

/**
 * Simplified OnboardingChecklist:
 * Replaced with a clean "Tips & How It Works" panel for first-time users.
 * No duplication of main action buttons.
 */
export default function OnboardingChecklist() {
  return (
    <div className="card shadow-sm mt-4">
      <div className="card-body">
        <h5 className="card-title mb-3">Getting Started Tips</h5>

        <ul className="mb-3">
          <li>
            <strong>Budgets</strong> are category-based and period-based
            (weekly, monthly, quarterly, etc.). Each one helps you track
            spending limits by timeframe.
          </li>

          <li>
            <strong>Expenses</strong> automatically count toward their category’s
            budget. You’ll see summaries and trends in your{" "}
            <Link to="/dashboard">Dashboard</Link>.
          </li>

          <li>
            <strong>Income</strong> helps you understand your net savings rate.
            Record sources like salary, freelance, or interest earnings.
          </li>

          <li>
            <strong>Finance Assistant</strong> can answer queries such as{" "}
            <em>“How much did I spend on food last month?”</em> or{" "}
            <em>“Am I over budget this quarter?”</em>.
          </li>
        </ul>

        <div className="small text-muted">
          Pro tip: You can always revisit this Welcome page for quick access to
          create actions or see your overall progress in the{" "}
          <Link to="/dashboard">Dashboard</Link>.
        </div>
      </div>
    </div>
  );
}
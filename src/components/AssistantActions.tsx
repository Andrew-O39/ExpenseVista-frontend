import { useNavigate } from "react-router-dom";

type Action = { type: string; label?: string; params?: any };

export default function AssistantActions({ actions }: { actions?: Action[] }) {
  const navigate = useNavigate();
  if (!actions?.length) return null;

  const handle = (a: Action) => {
    switch (a.type) {
      case "show_expenses": {
        const qs = new URLSearchParams();
        if (a.params?.search) qs.set("search", a.params.search);
        if (a.params?.start_date) qs.set("start_date", a.params.start_date);
        if (a.params?.end_date) qs.set("end_date", a.params.end_date);
        if (a.params?.page) qs.set("page", String(a.params.page));
        if (a.params?.limit) qs.set("limit", String(a.params.limit));
        navigate(`/expenses?${qs.toString()}`);
        break;
      }
      case "go_to_budgets":
        navigate("/budgets");
        break;
      case "go_to_incomes":
        navigate("/incomes");
        break;
      case "go_to_dashboard":
        navigate("/dashboard");
        break;
      default:
        // no-op fallback
        break;
    }
  };

  return (
    <div className="mt-2 d-flex flex-wrap gap-2">
      {actions.map((a, i) => (
        <button
          key={i}
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => handle(a)}
          title={a.type}
        >
          {a.label || "Open"}
        </button>
      ))}
    </div>
  );
}
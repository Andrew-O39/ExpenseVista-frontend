import { useNavigate } from "react-router-dom";

type Action = { type: string; label?: string; params?: any };

export default function AssistantActions({ actions = [] as Action[] }) {
  const navigate = useNavigate();

  if (!Array.isArray(actions) || actions.length === 0) return null;

  const handle = (a: Action) => {
    switch (a.type) {
      case "open_expenses": {
        // Build /expenses?search=...&start_date=...&end_date=...&page=1&limit=10
        const p = new URLSearchParams();
        if (a.params?.search) p.set("search", String(a.params.search));
        if (a.params?.category) p.set("category", String(a.params.category));
        if (a.params?.start_date) p.set("start_date", String(a.params.start_date));
        if (a.params?.end_date) p.set("end_date", String(a.params.end_date));
        // optional paging defaults
        p.set("page", "1");
        p.set("limit", "10");
        navigate(`/expenses?${p.toString()}`);
        break;
      }

      // You can add more action types later:
      // case "open_budgets": ...
      // case "open_dashboard_section": ...

      default:
        console.warn("Unknown assistant action:", a);
    }
  };

  return (
    <div className="mt-2 d-flex flex-wrap gap-2">
      {actions.map((a, i) => (
        <button
          key={i}
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() => handle(a)}
          title={a.type}
        >
          {a.label || "Open"}
        </button>
      ))}
    </div>
  );
}
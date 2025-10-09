import { useNavigate } from "react-router-dom";

type AssistantAction = {
  type: "open_expenses" | "navigate" | "show_chart" | string;
  label?: string;
  params?: Record<string, any>;
};

export default function AssistantActions({ actions = [] as AssistantAction[] }) {
  const navigate = useNavigate();

  if (!Array.isArray(actions) || actions.length === 0) return null;

  const handle = (a: AssistantAction) => {
    switch (a.type) {
      case "open_expenses": {
        // Build /expenses?search=...&start_date=...&end_date=...&page=...&limit=...
        const p = new URLSearchParams();

        if (a.params?.search) p.set("search", String(a.params.search));
        if (a.params?.category) p.set("category", String(a.params.category));
        if (a.params?.start_date) p.set("start_date", String(a.params.start_date));
        if (a.params?.end_date) p.set("end_date", String(a.params.end_date));

        // Defaults (can be overridden by params)
        p.set("page", String(a.params?.page ?? 1));
        p.set("limit", String(a.params?.limit ?? 10));

        navigate(`/expenses?${p.toString()}`);
        break;
      }

      case "navigate": {
        // Generic navigation if backend returns a route
        const route = a.params?.route || "/";
        navigate(route);
        break;
      }

      case "show_chart": {
        // Example: jump to dashboard and optionally pass period
        const period = a.params?.period;
        navigate(period ? `/dashboard?period=${encodeURIComponent(period)}` : "/dashboard");
        break;
      }

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
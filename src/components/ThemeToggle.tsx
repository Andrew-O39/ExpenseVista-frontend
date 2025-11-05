import { useEffect, useState } from "react";
import type { Theme } from "../utils/theme";
import { getTheme, setTheme, applyTheme } from "../utils/theme";

export default function ThemeToggle() {
  const [theme, setStateTheme] = useState<Theme>("auto");

  useEffect(() => {
    const t = getTheme();
    setStateTheme(t);
    applyTheme(t);
  }, []);

  const onChange = (t: Theme) => {
    setStateTheme(t);
    setTheme(t); // persists + applies
  };

  return (
    <div className="theme-toggle">
      <button
        type="button"
        className={`btn btn-sm ${theme === "light" ? "btn-primary" : "btn-outline-secondary"}`}
        onClick={() => onChange("light")}
      >
        ☀️
      </button>
      <button
        type="button"
        className={`btn btn-sm ${theme === "dark" ? "btn-primary" : "btn-outline-secondary"}`}
        onClick={() => onChange("dark")}
      >
        🌙
      </button>
      <button
        type="button"
        className={`btn btn-sm ${theme === "auto" ? "btn-primary" : "btn-outline-secondary"}`}
        onClick={() => onChange("auto")}
      >
        🖥️
      </button>
    </div>
  );
}
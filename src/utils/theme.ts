export type Theme = "light" | "dark" | "auto";

const THEME_KEY_GLOBAL = "theme_pref";              // fallback when logged out
const USER_ID_KEY = "current_user_id";              // set at login
const keyForUser = (id: string | null) =>
  id ? `theme_pref:${id}` : THEME_KEY_GLOBAL;

export function getTheme(): Theme {
  const userId = localStorage.getItem(USER_ID_KEY);
  const val =
    localStorage.getItem(keyForUser(userId)) ||
    localStorage.getItem(THEME_KEY_GLOBAL) ||
    "auto";
  return (["light", "dark", "auto"].includes(val) ? val : "auto") as Theme;
}

export function setTheme(t: Theme) {
  const userId = localStorage.getItem(USER_ID_KEY);
  localStorage.setItem(keyForUser(userId), t);
  applyTheme(t);
}

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  const systemDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const finalTheme = t === "auto" ? (systemDark ? "dark" : "light") : t;
  root.setAttribute("data-bs-theme", finalTheme);
}

/** Init once on app boot */
export function initTheme() {
  applyTheme(getTheme());
  // keep in sync with system preference when on "auto"
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    if (getTheme() === "auto") applyTheme("auto");
  };
  try {
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  } catch {
    // Safari fallback
    mql.addListener && mql.addListener(handler);
    return () => mql.removeListener && mql.removeListener(handler);
  }
}
import axios from "axios";
import type { CurrentPeriod, GroupBy } from "../types/period";

/** Resolve an absolute base URL in production, /api by default */
function resolveBase(): string {
  const mode = import.meta.env.MODE;
  const envBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

  if (mode === "development") {
    // dev: allow override or default to local FastAPI
    return envBase ?? "http://127.0.0.1:8000";
  }

  // production: make absolute
  if (envBase) {
    if (/^https?:\/\//i.test(envBase)) return envBase.replace(/\/+$/, "");
    if (envBase.startsWith("/")) return (window.location.origin + envBase).replace(/\/+$/, "");
    return (window.location.origin + "/" + envBase).replace(/\/+$/, "");
  }

  return (window.location.origin + "/api").replace(/\/+$/, "");
}

const BASE = resolveBase();

// Axios instance
export const api = axios.create({
  baseURL: BASE, // absolute in prod; e.g. https://app.expensevista.com/api
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// Log final URL in dev
api.interceptors.request.use((config) => {
  if (import.meta.env.MODE === "development" || import.meta.env.VITE_LOG_API === "1") {
    const finalUrl = (config.baseURL ?? "") + (config.url ?? "");
    // eslint-disable-next-line no-console
    console.debug("[API URL]", finalUrl, (config.method || "GET").toUpperCase());
  }
  return config;
});

// Strict JSON guard: if the server ever returns HTML (index.html), fail loudly
api.interceptors.response.use(
  (res) => {
    // allow 204/empty
    if (res.status === 204 || res.data == null) return res;
    const ct = String(res.headers?.["content-type"] || "");
    if (!ct.includes("application/json")) {
      // Preview a bit of the body if possible
      const preview = typeof res.data === "string" ? res.data.slice(0, 200) : "";
      throw new Error(
        `Expected JSON from API but got '${ct}'. ` +
          `Are we hitting the SPA instead of the API? ` +
          `Check that the URL starts with ${BASE}. Preview: ${preview}`
      );
    }
    return res;
  },
  async (err) => {
    // Try to unwrap FastAPI-style errors
    const data = err?.response?.data;
    if (data?.detail) {
      const detail = Array.isArray(data.detail)
        ? data.detail.map((d: any) => d?.msg || d?.detail || d?.type).filter(Boolean).join("; ")
        : data.detail;
      err.message = detail || err.message;
    }
    return Promise.reject(err);
  }
);

/** Auth header helper */
const auth = (token?: string) => (token ? { Authorization: `Bearer ${token}` } : {});

/* ------------------ AUTH ------------------ */

export async function login(username: string, password: string) {
  const { data } = await api.post(
    "/login",
    new URLSearchParams({ username, password }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return data;
}

export async function registerUser(payload: { username: string; email: string; password: string }) {
  const { data } = await api.post("/register", payload);
  return data;
}

/* ------------------ CURRENT USER ------------------ */

export async function getCurrentUser(token: string) {
  const { data } = await api.get("/me", { headers: auth(token) });
  return data;
}

/* ------------------ SUMMARY (GET: no trailing slash) ------------------ */

export async function getSummary(token: string, period: CurrentPeriod, category?: string) {
  const { data } = await api.get("/summary", {
    headers: auth(token),
    params: { period, ...(category ? { category } : {}) },
  });
  return data;
}

export async function getOverview(
  token: string,
  params: { period?: CurrentPeriod; category?: string; group_by?: GroupBy } = {}
) {
  const { data } = await api.get("/summary/overview", {
    headers: auth(token),
    params,
  });
  return data;
}

/* ------------------ EXPENSES ------------------ */

export async function createExpense(
  token: string,
  expenseData: { amount: number; category: string; description?: string; notes?: string }
) {
  const { data } = await api.post("/expenses", expenseData, { headers: auth(token) });
  return data;
}

export async function getExpenses(
  token: string,
  opts: { search?: string; startDate?: string; endDate?: string; page?: number; limit?: number } = {}
) {
  const { search, startDate, endDate, page = 1, limit = 10 } = opts;
  const skip = (page - 1) * limit;
  const params: any = { skip, limit };
  if (search) params.search = search;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const { data } = await api.get("/expenses", { headers: auth(token), params });
  return data;
}

export async function getExpenseById(token: string, id: number) {
  const { data } = await api.get(`/expenses/${id}`, { headers: auth(token) });
  return data;
}

export async function updateExpense(
  token: string,
  id: number,
  payload: { amount?: number; category?: string; description?: string; notes?: string }
) {
  const { data } = await api.put(`/expenses/${id}`, payload, { headers: auth(token) });
  return data;
}

export async function deleteExpense(token: string, id: number) {
  const { data } = await api.delete(`/expenses/${id}`, { headers: auth(token) });
  return data;
}

/* ------------------ BUDGETS ------------------ */

export async function createBudget(
  token: string,
  budgetData: { category: string; limit_amount: number; period: string; notes?: string }
) {
  const { data } = await api.post("/budgets", budgetData, { headers: auth(token) });
  return data;
}

export async function getBudgets(
  token: string,
  opts: {
    period?: CurrentPeriod;
    category?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const { period, category, search, startDate, endDate, page = 1, limit = 10 } = opts;
  const skip = (page - 1) * limit;
  const params: any = { skip, limit };
  if (period) params.period = period;
  if (category) params.category = category;
  if (search) params.search = search;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const { data } = await api.get("/budgets", { headers: auth(token), params });
  return data;
}

export async function getBudgetById(token: string, id: number) {
  const { data } = await api.get(`/budgets/${id}`, { headers: auth(token) });
  return data;
}

export async function updateBudget(
  token: string,
  id: number,
  payload: { category?: string; limit_amount?: number; period?: string; notes?: string }
) {
  const { data } = await api.put(`/budgets/${id}`, payload, { headers: auth(token) });
  return data;
}

export async function deleteBudget(token: string, id: number) {
  const { data } = await api.delete(`/budgets/${id}`, { headers: auth(token) });
  return data;
}

/* ------------------ INCOMES ------------------ */

export async function createIncome(
  token: string,
  payload: { amount: number; category: string; source?: string; notes?: string }
) {
  const { data } = await api.post("/incomes", payload, { headers: auth(token) });
  return data;
}

export async function getIncomes(
  token: string,
  opts: { search?: string; startDate?: string; endDate?: string; page?: number; limit?: number } = {}
) {
  const { search, startDate, endDate, page = 1, limit = 10 } = opts;
  const skip = (page - 1) * limit;
  const params: any = { skip, limit };
  if (search) params.search = search;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const { data } = await api.get("/incomes", { headers: auth(token), params });
  return data;
}

export async function getIncomeById(token: string, id: number) {
  const { data } = await api.get(`/incomes/${id}`, { headers: auth(token) });
  return data;
}

export async function updateIncome(
  token: string,
  id: number,
  payload: { amount?: number; source?: string; category?: string; notes?: string; received_at?: string }
) {
  const { data } = await api.put(`/incomes/${id}`, payload, { headers: auth(token) });
  return data;
}

export async function deleteIncome(token: string, id: number) {
  const { data } = await api.delete(`/incomes/${id}`, { headers: auth(token) });
  return data;
}

/* ------------------ PASSWORD RESET / EMAIL ------------------ */

export async function forgotPassword(email: string) {
  const { data } = await api.post("/forgot-password", { email });
  return data;
}

export async function resetPassword(token: string, new_password: string) {
  const { data } = await api.post("/reset-password", { token, new_password });
  return data;
}

export async function verifyEmail(token: string) {
  const { data } = await api.get("/verify-email", { params: { token } });
  return data;
}

export async function resendVerificationEmail(email?: string) {
  const token = localStorage.getItem("access_token");
  const isAuthed = Boolean(token);
  const body = isAuthed ? {} : { email };
  if (!isAuthed && !email) throw new Error("Please enter your email address.");
  const headers = isAuthed ? { Authorization: `Bearer ${token}` } : {};
  const { data } = await api.post("/resend-verification", body, { headers });
  return data;
}

/* ------------------ AI ------------------ */

export async function aiSuggestCategory(token: string, payload: { description: string; amount?: number }) {
  const { data } = await api.post("/ai/suggest-category", payload, { headers: auth(token) });
  return data as { suggested_category: string | null; confidence: number; rationale?: string | null };
}

export async function aiCategoryFeedback(token: string, description: string, category: string) {
  const { data } = await api.post("/ai/category-feedback", { description, category }, { headers: auth(token) });
  return data;
}

export async function aiAssistant(token: string, message: string) {
  const { data } = await api.post("/ai/assistant", { message }, { headers: auth(token) });
  return data as { reply: string; actions?: Array<{ type: string; label?: string; params?: any }> };
}
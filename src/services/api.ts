import axios from "axios";
import type { CurrentPeriod, GroupBy } from "../types/period";

/** Decide base URL */
function resolveBase(): string {
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (import.meta.env.MODE === "development") {
    // When running Vite dev server on your laptop, point to the dev API
    return envBase ?? "http://127.0.0.1:8000";
  }
  // In Docker/nginx builds, always go through the nginx proxy prefix
  return envBase ?? "/api"; // <-- no trailing slash
}

export const API_BASE_URL = resolveBase();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/** Attach token + log final URL and status */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  // preview URL
  try {
    const final = new URL(config.url!, config.baseURL || location.origin).toString();
    console.log("[API URL]", final, (config.method || "GET").toUpperCase());
  } catch {
    console.log("[API URL]", (config.baseURL || "") + (config.url || ""), (config.method || "GET").toUpperCase());
  }
  return config;
});

api.interceptors.response.use(
  (resp) => {
    const final = new URL(resp.config.url!, resp.config.baseURL || location.origin).toString();
    console.log("[API OK]", resp.status, final);
    return resp;
  },
  (err) => {
    const cfg = err?.config || {};
    const final = new URL((cfg.url || ""), (cfg.baseURL || location.origin)).toString();
    console.warn("[API ERR]", err?.response?.status ?? "NETWORK", final, err?.response?.data);
    return Promise.reject(err);
  }
);

/** Helper for auth header when you pass token explicitly */
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

/* ------------------ SUMMARY ------------------ */

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
  const { data } = await api.post("/expenses/", expenseData, { headers: auth(token) });
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
  const { data } = await api.put(`/expenses/${id}/`, payload, { headers: auth(token) });
  return data;
}

export async function deleteExpense(token: string, id: number) {
  const { data } = await api.delete(`/expenses/${id}/`, { headers: auth(token) });
  return data;
}

/* ------------------ BUDGETS ------------------ */

export async function createBudget(
  token: string,
  budgetData: { category: string; limit_amount: number; period: string; notes?: string }
) {
  const { data } = await api.post("/budgets/", budgetData, { headers: auth(token) });
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
  const { data } = await api.put(`/budgets/${id}/`, payload, { headers: auth(token) });
  return data;
}

export async function deleteBudget(token: string, id: number) {
  const { data } = await api.delete(`/budgets/${id}/`, { headers: auth(token) });
  return data;
}

/* ------------------ INCOMES ------------------ */

export async function createIncome(
  token: string,
  payload: { amount: number; category: string; source?: string; notes?: string }
) {
  const { data } = await api.post("/incomes/", payload, { headers: auth(token) });
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
  const { data } = await api.put(`/incomes/${id}/`, payload, { headers: auth(token) });
  return data;
}

export async function deleteIncome(token: string, id: number) {
  const { data } = await api.delete(`/incomes/${id}/`, { headers: auth(token) });
  return data;
}

/* ------------------ PASSWORD RESET / EMAIL VERIFICATION ------------------ */

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
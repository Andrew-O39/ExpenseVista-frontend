import axios from "axios";
import type { CurrentPeriod, GroupBy } from "../types/period";

// --- base resolution ---
function resolveBase(): string {
  const mode = import.meta.env.MODE;
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (mode === "development") return envBase ?? "http://127.0.0.1:8000";
  if (envBase && envBase.startsWith("/")) return envBase;
  return "/api";
}

// ensure EXACTLY one trailing slash on base
const RAW_BASE = resolveBase();
const BASE = RAW_BASE.replace(/\/+$/, "") + "/";

// strip ALL leading slashes on endpoints
const join = (p: string) => p.replace(/^\/+/, "");

export const API_BASE_URL = BASE;

export const api = axios.create({
  baseURL: BASE, // e.g. "/api/"
  headers: { "Content-Type": "application/json" },
});

// normalize every request and add token
api.interceptors.request.use((config) => {
  // normalize base + url
  const b = (config.baseURL ?? "").replace(/\/+$/, "") + "/";
  let u = (config.url ?? "").toString().replace(/^\/+/, ""); // no leading slash
  config.baseURL = b;
  config.url = u;

  // attach token
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  // accurate preview of the final URL
  try {
    const final = new URL(u, b).toString();
    console.log("[API URL]", final, config.method?.toUpperCase());
  } catch {
    console.log("[API URL]", b + u, config.method?.toUpperCase());
  }

  return config;
});


/** Helper to attach Authorization only when a token exists */
const auth = (token?: string) =>
  token ? { Authorization: `Bearer ${token}` } : {};

/** Centralized FastAPI error extractor */
export function extractFastAPIError(err: any): string {
  const data = err?.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail)) {
    const msgs = data.detail
      .map((d: any) => d?.msg || d?.detail || d?.type)
      .filter(Boolean);
    if (msgs.length) return msgs.join("; ");
  }
  if (data?.message) return data.message;
  if (err?.message) return err.message;
  return "Something went wrong.";
}

/* ------------------ AUTH ------------------ */

export async function login(username: string, password: string) {
  const { data } = await api.post(
    join("login"),
    new URLSearchParams({ username, password }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return data;
}

export async function registerUser(payload: {
  username: string;
  email: string;
  password: string;
}) {
  const { data } = await api.post(join("register"), payload);
  return data;
}

/* ------------------ CURRENT USER ------------------ */

export async function getCurrentUser(token: string) {
  const { data } = await api.get(join("me"), { headers: auth(token) });
  return data;
}

/* ------------------ SUMMARY ------------------ */

export async function getSummary(
  token: string,
  period: CurrentPeriod,
  category?: string
) {
  const { data } = await api.get(join("summary/"), {
    headers: auth(token),
    params: { period, ...(category ? { category } : {}) },
  });
  return data;
}

/* ------------------ EXPENSES ------------------ */

export async function createExpense(
  token: string,
  expenseData: {
    amount: number;
    category: string;
    description?: string;
    notes?: string;
  }
) {
  const { data } = await api.post(join("expenses/"), expenseData, {
    headers: auth(token),
  });
  return data;
}

export async function getExpenses(
  token: string,
  opts: {
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const { search, startDate, endDate, page = 1, limit = 10 } = opts;
  const skip = (page - 1) * limit;
  const params: any = { skip, limit };
  if (search) params.search = search;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const { data } = await api.get(join("expenses/"), {
    headers: auth(token),
    params,
  });
  return data;
}

export async function getExpenseById(token: string, id: number) {
  const { data } = await api.get(join(`expenses/${id}/`), {
    headers: auth(token),
  });
  return data;
}

export async function updateExpense(
  token: string,
  id: number,
  payload: { amount?: number; category?: string; description?: string; notes?: string }
) {
  const { data } = await api.put(join(`expenses/${id}/`), payload, {
    headers: auth(token),
  });
  return data;
}

export async function deleteExpense(token: string, id: number) {
  const { data } = await api.delete(join(`expenses/${id}/`), {
    headers: auth(token),
  });
  return data;
}

/* ------------------ BUDGETS ------------------ */

export async function createBudget(
  token: string,
  budgetData: { category: string; limit_amount: number; period: string; notes?: string }
) {
  const { data } = await api.post(join("budgets/"), budgetData, {
    headers: auth(token),
  });
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
  const { period, category, search, startDate, endDate, page = 1, limit = 10 } =
    opts;
  const skip = (page - 1) * limit;
  const params: any = { skip, limit };
  if (period) params.period = period;
  if (category) params.category = category;
  if (search) params.search = search;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const { data } = await api.get(join("budgets/"), {
    headers: auth(token),
    params,
  });
  return data;
}

export async function getBudgetById(token: string, id: number) {
  const { data } = await api.get(join(`budgets/${id}/`), {
    headers: auth(token),
  });
  return data;
}

export async function updateBudget(
  token: string,
  id: number,
  payload: { category?: string; limit_amount?: number; period?: string; notes?: string }
) {
  const { data } = await api.put(join(`budgets/${id}/`), payload, {
    headers: auth(token),
  });
  return data;
}

export async function deleteBudget(token: string, id: number) {
  const { data } = await api.delete(join(`budgets/${id}/`), {
    headers: auth(token),
  });
  return data;
}

/* ------------------ INCOMES ------------------ */

export async function getIncomes(
  token: string,
  opts: {
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const { search, startDate, endDate, page = 1, limit = 10 } = opts;
  const skip = (page - 1) * limit;
  const params: any = { skip, limit };
  if (search) params.search = search;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const { data } = await api.get(join("incomes/"), {
    headers: auth(token),
    params,
  });
  return data;
}

export async function getIncomeById(token: string, id: number) {
  const { data } = await api.get(join(`incomes/${id}/`), {
    headers: auth(token),
  });
  return data;
}

export async function createIncome(
  token: string,
  payload: { amount: number; category: string; source?: string; notes?: string }
) {
  const { data } = await api.post(join("incomes/"), payload, {
    headers: auth(token),
  });
  return data;
}

export async function updateIncome(
  token: string,
  id: number,
  payload: { amount?: number; source?: string; category?: string; notes?: string; received_at?: string }
) {
  const { data } = await api.put(join(`incomes/${id}/`), payload, {
    headers: auth(token),
  });
  return data;
}

export async function deleteIncome(token: string, id: number) {
  const { data } = await api.delete(join(`incomes/${id}/`), {
    headers: auth(token),
  });
  return data;
}

/* ------------------ OVERVIEW ------------------ */

export async function getOverview(
  token: string,
  params: { period?: CurrentPeriod; category?: string; group_by?: GroupBy } = {}
) {
  const { data } = await api.get(join("summary/overview/"), {
    headers: auth(token),
    params,
  });
  return data;
}

/* ------------------ PASSWORD RESET ------------------ */

export async function forgotPassword(email: string) {
  const { data } = await api.post(
    join("forgot-password"),
    { email },
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}

export async function resetPassword(token: string, new_password: string) {
  const { data } = await api.post(
    join("reset-password"),
    { token, new_password },
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}

/* ------------------ AI ------------------ */

export async function aiSuggestCategory(
  token: string,
  payload: { description: string; amount?: number }
) {
  const { data } = await api.post(join("ai/suggest-category"), payload, {
    headers: auth(token),
  });
  return data as {
    suggested_category: string | null;
    confidence: number;
    rationale?: string | null;
  };
}

export async function aiCategoryFeedback(
  token: string,
  description: string,
  category: string
) {
  const { data } = await api.post(
    join("ai/category-feedback"),
    { description, category },
    { headers: auth(token) }
  );
  return data;
}

export async function aiAssistant(token: string, message: string) {
  const { data } = await api.post(
    join("ai/assistant"),
    { message },
    { headers: auth(token) }
  );
  return data as {
    reply: string;
    actions?: Array<{ type: string; label?: string; params?: any }>;
  };
}

/* ------------------ EMAIL VERIFICATION ------------------ */

export async function verifyEmail(token: string) {
  const { data } = await api.get(join("verify-email"), { params: { token } });
  return data;
}

export async function resendVerificationEmail(email?: string) {
  const token = localStorage.getItem("access_token");
  const isAuthed = Boolean(token);
  const body = isAuthed ? {} : { email };

  if (!isAuthed && !email) {
    throw new Error("Please enter your email address.");
  }

  const { data } = await api.post(join("resend-verification"), body, {
    headers: {
      "Content-Type": "application/json",
      ...(isAuthed ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return data;
}
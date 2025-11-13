import axios from "axios";
import type { CurrentPeriod, GroupBy } from "../types/period";

/** Resolve the API base URL */
function resolveBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

  // Development: allow override or default to local FastAPI
  if (import.meta.env.MODE === "development") {
    return envBase || "http://127.0.0.1:8000";
  }

  // Production: make absolute
  if (/^https?:\/\//i.test(envBase)) {
    // already absolute, just trim trailing slashes
    return envBase.replace(/\/+$/, "");
  }
  if (envBase.startsWith("/")) {
    // relative path like "/api" -> attach to current origin
    return (window.location.origin + envBase).replace(/\/+$/, "");
  }

  // Fallback: current origin + /api
  return (window.location.origin + "/api").replace(/\/+$/, "");
}

const BASE = resolveBase();

/** Shared axios instance */
export const api = axios.create({
  baseURL: BASE, // no trailing slash
  headers: { "Content-Type": "application/json" },
});

/** Attach Bearer token from localStorage on every request */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Guard: if we accidentally hit the SPA (HTML), throw a helpful error */
api.interceptors.response.use(
  (res) => {
    const ct = res.headers?.["content-type"] ?? "";
    if (typeof res.data === "string" && ct.includes("text/html")) {
      throw new Error(
        "Expected JSON but got HTML (likely hit the SPA). " +
          "Check that requests go to the API (baseURL is /api) " +
          "and that nginx/Caddy is proxying /api correctly."
      );
    }
    return res;
  },
  (err) => Promise.reject(err)
);

/** Optional helper for explicit tokens (still used in some calls) */
const auth = (token?: string) =>
  token ? { Authorization: `Bearer ${token}` } : {};

/* ------------------ AUTH ------------------ */

export async function login(username: string, password: string) {
  const { data } = await api.post(
    "/login",
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
  const { data } = await api.post("/register", payload);
  return data;
}

/* ------------------ CURRENT USER ------------------ */

export async function getCurrentUser(token: string) {
  const { data } = await api.get("/me", { headers: auth(token) });
  return data;
}

/* ------------------ SUMMARY ------------------ */

/**
 * Backend: router = APIRouter(prefix="/summary")
 * @router.get("/")  -> GET /summary/
 */
export async function getSummary(
  token: string,
  period: CurrentPeriod,
  category?: string
) {
  const { data } = await api.get("/summary/", {
    headers: auth(token),
    params: { period, ...(category ? { category } : {}) },
  });
  return data;
}

/**
 * Backend: @router.get("/overview")  -> GET /summary/overview
 * no trailing slash here
 */
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

/**
 * Backend: router = APIRouter(prefix="/expenses")
 * @router.post("/") -> POST /expenses/
 */
export async function createExpense(
  token: string,
  expenseData: {
    amount: number;
    category: string;
    description?: string;
    notes?: string;
  }
) {
  const { data } = await api.post("/expenses/", expenseData, {
    headers: auth(token),
  });
  return data;
}

/**
 * @router.get("/") -> GET /expenses/
 */
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

  const { data } = await api.get("/expenses/", { headers: auth(token), params });
  return data;
}

/**
 * @router.get("/{expense_id}") -> GET /expenses/{id}
 */
export async function getExpenseById(token: string, id: number) {
  const { data } = await api.get(`/expenses/${id}`, { headers: auth(token) });
  return data;
}

/**
 * @router.put("/{expense_id}") -> PUT /expenses/{id}
 */
export async function updateExpense(
  token: string,
  id: number,
  payload: {
    amount?: number;
    category?: string;
    description?: string;
    notes?: string;
  }
) {
  const { data } = await api.put(`/expenses/${id}`, payload, {
    headers: auth(token),
  });
  return data;
}

/**
 * @router.delete("/{expense_id}") -> DELETE /expenses/{id}
 */
export async function deleteExpense(token: string, id: number) {
  const { data } = await api.delete(`/expenses/${id}`, {
    headers: auth(token),
  });
  return data;
}

/* ------------------ BUDGETS ------------------ */

/**
 * Backend: router = APIRouter(prefix="/budgets")
 * @router.post("/") -> POST /budgets/
 */
export async function createBudget(
  token: string,
  budgetData: {
    category: string;
    limit_amount: number;
    period: string;
    notes?: string;
  }
) {
  const { data } = await api.post("/budgets/", budgetData, {
    headers: auth(token),
  });
  return data;
}

/**
 * @router.get("/") -> GET /budgets/
 */
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

  const { data } = await api.get("/budgets/", { headers: auth(token), params });
  return data;
}

/**
 * @router.get("/{budget_id}") -> GET /budgets/{id}
 */
export async function getBudgetById(token: string, id: number) {
  const { data } = await api.get(`/budgets/${id}`, { headers: auth(token) });
  return data;
}

/**
 * @router.put("/{budget_id}") -> PUT /budgets/{id}
 */
export async function updateBudget(
  token: string,
  id: number,
  payload: {
    category?: string;
    limit_amount?: number;
    period?: string;
    notes?: string;
  }
) {
  const { data } = await api.put(`/budgets/${id}`, payload, {
    headers: auth(token),
  });
  return data;
}

/**
 * @router.delete("/{budget_id}") -> DELETE /budgets/{id}
 */
export async function deleteBudget(token: string, id: number) {
  const { data } = await api.delete(`/budgets/${id}`, {
    headers: auth(token),
  });
  return data;
}

/* ------------------ INCOMES ------------------ */

/**
 * Backend: router = APIRouter(prefix="/incomes")
 * @router.post("/") -> POST /incomes/
 */
export async function createIncome(
  token: string,
  payload: {
    amount: number;
    category: string;
    source?: string;
    notes?: string;
  }
) {
  const { data } = await api.post("/incomes/", payload, {
    headers: auth(token),
  });
  return data;
}

/**
 * @router.get("/") -> GET /incomes/
 */
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

  const { data } = await api.get("/incomes/", { headers: auth(token), params });
  return data;
}

/**
 * @router.get("/{income_id}") -> GET /incomes/{id}
 */
export async function getIncomeById(token: string, id: number) {
  const { data } = await api.get(`/incomes/${id}`, { headers: auth(token) });
  return data;
}

/**
 * @router.put("/{income_id}") -> PUT /incomes/{id}
 */
export async function updateIncome(
  token: string,
  id: number,
  payload: {
    amount?: number;
    source?: string;
    category?: string;
    notes?: string;
    received_at?: string;
  }
) {
  const { data } = await api.put(`/incomes/${id}`, payload, {
    headers: auth(token),
  });
  return data;
}

/**
 * @router.delete("/{income_id}") -> DELETE /incomes/{id}
 */
export async function deleteIncome(token: string, id: number) {
  const { data } = await api.delete(`/incomes/${id}`, {
    headers: auth(token),
  });
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

export async function aiSuggestCategory(
  token: string,
  payload: { description: string; amount?: number }
) {
  const { data } = await api.post("/ai/suggest-category", payload, {
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
    "/ai/category-feedback",
    { description, category },
    { headers: auth(token) }
  );
  return data;
}

export async function aiAssistant(token: string, message: string) {
  const { data } = await api.post(
    "/ai/assistant",
    { message },
    { headers: auth(token) }
  );
  return data as {
    reply: string;
    actions?: Array<{ type: string; label?: string; params?: any }>;
  };
}
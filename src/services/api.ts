// src/services/api.ts
import axios from "axios";

// Pick from Vite env at build time; fallback to localhost for dev
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Small helper to attach Authorization only when a token is provided
const auth = (token?: string) =>
  token ? { Authorization: `Bearer ${token}` } : {};

// Centralized FastAPI error extractor
function extractFastAPIError(err: any): string {
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
  try {
    const { data } = await api.post(
      "/login",
      new URLSearchParams({ username, password }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return data; // { access_token, token_type }
  } catch (error: any) {
    console.error("Login failed:", error.response?.data || error.message);
    throw error;
  }
}

export async function registerUser(payload: {
  username: string;
  email: string;
  password: string;
}) {
  try {
    const { data } = await api.post("/register", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return data;
  } catch (error: any) {
    console.error("Registration failed:", error.response?.data || error.message);
    throw error;
  }
}

/* ------------------ CURRENT USER ------------------ */

export async function getCurrentUser(token: string) {
  try {
    const { data } = await api.get("/me", {
      headers: auth(token),
    });
    return data;
  } catch (error: any) {
    console.error(
      "Failed to fetch current user:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/* ------------------ SUMMARY ------------------ */

export async function getSummary(
  token: string,
  period: "weekly" | "monthly" | "yearly",
  category?: string
) {
  try {
    const { data } = await api.get("/summary", {
      headers: auth(token),
      params: { period, ...(category ? { category } : {}) },
    });
    return data;
  } catch (error: any) {
    console.error(
      "Failed to fetch summary:",
      error.response?.data || error.message
    );
    throw error;
  }
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
  try {
    const { data } = await api.post("/expenses", expenseData, {
      headers: { ...auth(token), "Content-Type": "application/json" },
    });
    return data;
  } catch (error: any) {
    console.error(
      "Failed to create expense:",
      error.response?.data || error.message
    );
    throw error;
  }
}

export async function getExpenses(
  token: string,
  opts: {
    search?: string;
    startDate?: string; // ISO
    endDate?: string; // ISO
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

  const { data } = await api.get("/expenses", {
    headers: auth(token),
    params,
  });
  return data;
}

export async function getExpenseById(token: string, id: number) {
  try {
    const { data } = await api.get(`/expenses/${id}`, {
      headers: auth(token),
    });
    return data;
  } catch (error: any) {
    console.error(
      "Failed to fetch expense:",
      error.response?.data || error.message
    );
    throw error;
  }
}

export async function updateExpense(
  token: string,
  id: number,
  payload: { amount?: number; category?: string; description?: string; notes?: string }
) {
  try {
    const { data } = await api.put(`/expenses/${id}`, payload, {
      headers: auth(token),
    });
    return data;
  } catch (error: any) {
    console.error(
      "Failed to update expense:",
      error.response?.data || error.message
    );
    throw error;
  }
}

export async function deleteExpense(token: string, id: number) {
  try {
    const { data } = await api.delete(`/expenses/${id}`, {
      headers: auth(token),
    });
    return data;
  } catch (error: any) {
    console.error(
      "Failed to delete expense:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/* ------------------ BUDGETS ------------------ */

export async function createBudget(
  token: string,
  budgetData: { category: string; limit_amount: number; period: string; notes?: string }
) {
  try {
    const { data } = await api.post("/budgets", budgetData, {
      headers: { ...auth(token), "Content-Type": "application/json" },
    });
    return data;
  } catch (error: any) {
    console.error(
      "Failed to create budget:",
      error.response?.data || error.message
    );
    throw error;
  }
}

export async function getBudgets(
  token: string,
  opts: {
    period?: "weekly" | "monthly" | "quarterly" | "half-yearly" | "yearly";
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

  const { data } = await api.get("/budgets", {
    headers: auth(token),
    params,
  });
  return data;
}

export async function getBudgetById(token: string, id: number) {
  try {
    const { data } = await api.get(`/budgets/${id}`, {
      headers: auth(token),
    });
    return data;
  } catch (error: any) {
    console.error(
      "Failed to fetch budget:",
      error.response?.data || error.message
    );
    throw error;
  }
}

export async function updateBudget(
  token: string,
  id: number,
  payload: { category?: string; limit_amount?: number; period?: string; notes?: string }
) {
  try {
    const { data } = await api.put(`/budgets/${id}`, payload, {
      headers: auth(token),
    });
    return data;
  } catch (error: any) {
    console.error(
      "Failed to update budget:",
      error.response?.data || error.message
    );
    throw error;
  }
}

export async function deleteBudget(token: string, id: number) {
  try {
    const { data } = await api.delete(`/budgets/${id}`, {
      headers: auth(token),
    });
    return data;
  } catch (error: any) {
    console.error(
      "Failed to delete budget:",
      error.response?.data || error.message
    );
    throw error;
  }
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

  const { data } = await api.get("/incomes", {
    headers: auth(token),
    params,
  });
  return data;
}

export async function getIncomeById(token: string, id: number) {
  try {
    const { data } = await api.get(`/incomes/${id}`, {
      headers: auth(token),
    });
    return data;
  } catch (error: any) {
    console.error(
      "Failed to fetch income:",
      error.response?.data || error.message
    );
    throw error;
  }
}

export async function createIncome(
  token: string,
  payload: { amount: number; category: string; source?: string; notes?: string }
) {
  try {
    const { data } = await api.post("/incomes", payload, {
      headers: auth(token),
    });
    return data;
  } catch (err: any) {
    const msg = extractFastAPIError(err);
    console.error("Failed to create income:", msg);
    throw new Error(msg);
  }
}

export async function updateIncome(
  token: string,
  id: number,
  payload: { amount?: number; source?: string; category?: string; notes?: string; received_at?: string }
) {
  try {
    const { data } = await api.put(`/incomes/${id}`, payload, {
      headers: auth(token),
    });
    return data;
  } catch (error: any) {
    console.error(
      "Failed to update income:",
      error.response?.data || error.message
    );
    throw error;
  }
}

export async function deleteIncome(token: string, id: number) {
  try {
    const { data } = await api.delete(`/incomes/${id}`, {
      headers: auth(token),
    });
    return data;
  } catch (error: any) {
    console.error(
      "Failed to delete income:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/* ------------------ OVERVIEW (income vs expenses, net balance) ------------------ */

export async function getOverview(
  token: string,
  params: {
    period?: "weekly" | "monthly" | "yearly";
    category?: string;
    group_by?: "weekly" | "monthly" | "quarterly" | "half-yearly";
  } = {}
) {
  try {
    const { data } = await api.get("/summary/overview", {
      headers: auth(token),
      params,
    });
    return data;
  } catch (error: any) {
    console.error(
      "Failed to fetch overview:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/* ------------------ PASSWORD RESET (Forgot & Reset) ------------------ */

export async function forgotPassword(email: string) {
  try {
    const { data } = await api.post(
      "/forgot-password",
      { email },
      { headers: { "Content-Type": "application/json" } }
    );
    return data; // { msg: ... }
  } catch (err: any) {
    throw new Error(extractFastAPIError(err));
  }
}

export async function resetPassword(token: string, new_password: string) {
  try {
    const { data } = await api.post(
      "/reset-password",
      { token, new_password },
      { headers: { "Content-Type": "application/json" } }
    );
    return data; // { msg: ... }
  } catch (err: any) {
    throw new Error(extractFastAPIError(err));
  }
}

/* ------------------ AI ------------------ */

export async function aiSuggestCategory(
  token: string,
  payload: { description: string; amount?: number }
) {
  try {
    const { data } = await api.post("/ai/suggest-category", payload, {
      headers: auth(token),
    });
    return data as {
      suggested_category: string | null;
      confidence: number;
      rationale?: string | null;
    };
  } catch (err: any) {
    throw new Error(extractFastAPIError(err));
  }
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
  return data; // { msg }
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

/* ------------------ EMAIL VERIFICATION ------------------ */

export async function verifyEmail(token: string) {
  try {
    const { data } = await api.post(
      "/verify-email",
      { token },
      { headers: { "Content-Type": "application/json" } }
    );
    return data; // { msg }
  } catch (err: any) {
    throw new Error(extractFastAPIError?.(err) || err?.message || "Verification failed");
  }
}

export async function resendVerificationEmail() {
  try {
    const token = localStorage.getItem("access_token");
    const { data } = await api.post(
      "/resend-verification",
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );
    return data; // { msg }
  } catch (err: any) {
    throw new Error(extractFastAPIError?.(err) || err?.message || "Resend failed");
  }
}
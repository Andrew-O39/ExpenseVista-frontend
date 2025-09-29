// services/api.ts
import axios from "axios";

// Pick from Vite env at build time; fallback to localhost for dev
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

function extractFastAPIError(err: any): string {
  // Axios error shape
  const data = err?.response?.data;

  // detail can be a string
  if (typeof data?.detail === 'string') return data.detail;

  // detail can be an array of {loc, msg, type}
  if (Array.isArray(data?.detail)) {
    const msgs = data.detail
      .map((d: any) => d?.msg || d?.detail || d?.type)
      .filter(Boolean);
    if (msgs.length) return msgs.join('; ');
  }

  // Sometimes the message is nested elsewhere
  if (data?.message) return data.message;
  if (err?.message) return err.message;

  return 'Something went wrong.';
}


// ------------------ AUTH ------------------

export async function login(username: string, password: string) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/login`,
      new URLSearchParams({ username, password }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return response.data; // { access_token, token_type }
  } catch (error: any) {
    console.error("Login failed:", error.response?.data || error.message);
    throw error;
  }
}

export async function registerUser(data: { username: string; email: string; password: string }) {
  try {
    const response = await axios.post(`${API_BASE_URL}/register`, data, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    console.error("Registration failed:", error.response?.data || error.message);
    throw error;
  }
}

// ------------------ CURRENT USER ------------------

export async function getCurrentUser(token: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch current user:", error.response?.data || error.message);
    throw error;
  }
}

// ------------------ SUMMARY ------------------

export async function getSummary(token: string, period: 'weekly' | 'monthly' | 'yearly', category?: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/summary`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { period, ...(category ? { category } : {}) },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch summary:", error.response?.data || error.message);
    throw error;
  }
}

// ------------------ EXPENSES ------------------

export async function createExpense(token: string, expenseData: { amount: number; category: string; description?: string; notes?: string }) {
  try {
    const response = await axios.post(`${API_BASE_URL}/expenses`, expenseData, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to create expense:", error.response?.data || error.message);
    throw error;
  }
}

export async function getExpenses(
  token: string,
  opts: {
    search?: string;
    startDate?: string; // ISO e.g. '2025-08-01T00:00:00Z'
    endDate?: string;   // ISO
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

  const resp = await axios.get(`${API_BASE_URL}/expenses`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return resp.data;
}

export async function getExpenseById(token: string, id: number) {
  try {
    const response = await axios.get(`${API_BASE_URL}/expenses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch expense:", error.response?.data || error.message);
    throw error;
  }
}

export async function updateExpense(token: string, id: number, data: { amount?: number; category?: string; description?: string; notes?: string }) {
  try {
    const response = await axios.put(`${API_BASE_URL}/expenses/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to update expense:", error.response?.data || error.message);
    throw error;
  }
}

export async function deleteExpense(token: string, id: number) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/expenses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete expense:", error.response?.data || error.message);
    throw error;
  }
}

// ------------------ BUDGETS ------------------

export async function createBudget(token: string, budgetData: { category: string; limit_amount: number; period: string; notes?: string }) {
  try {
    const response = await axios.post(`${API_BASE_URL}/budgets`, budgetData, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to create budget:", error.response?.data || error.message);
    throw error;
  }
}

export async function getBudgets(
  token: string,
  opts: {
    period?: 'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
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

  const resp = await axios.get(`${API_BASE_URL}/budgets`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return resp.data;
}

export async function getBudgetById(token: string, id: number) {
  try {
    const response = await axios.get(`${API_BASE_URL}/budgets/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch budget:", error.response?.data || error.message);
    throw error;
  }
}

export async function updateBudget(
    token: string,
    id: number,
    data: {
        category?: string;
        limit_amount?: number;
        period?: string;
        notes?: string
        })
        {
  try {
    const response = await axios.put(`${API_BASE_URL}/budgets/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to update budget:", error.response?.data || error.message);
    throw error;
  }
}

export async function deleteBudget(token: string, id: number) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/budgets/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete budget:", error.response?.data || error.message);
    throw error;
  }
}


// --- INCOMES ---

// List incomes (supports search + pagination; add more filters if you expose them)
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
  if (search) params.search = search;              // if you added search server-side
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const resp = await axios.get(`${API_BASE_URL}/incomes`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return resp.data;
}

export async function getIncomeById(token: string, id: number) {
  try {
    const response = await axios.get(`${API_BASE_URL}/incomes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch income:", error.response?.data || error.message);
    throw error;
  }
}

export async function createIncome(
  token: string,
  payload: {
    amount: number;
    category: string;
    source?: string;
    notes?: string;
  }
) {
  try {
    const resp = await axios.post(`${API_BASE_URL}/incomes`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return resp.data;
  } catch (err: any) {
    const msg = extractFastAPIError(err); // helper from before
    console.error("Failed to create income:", msg);
    throw new Error(msg);
  }
}

export async function updateIncome(
  token: string,
  id: number,
  data: { amount?: number; source?: string; category?: string; notes?: string; received_at?: string }
) {
  try {
    const response = await axios.put(`${API_BASE_URL}/incomes/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to update income:", error.response?.data || error.message);
    throw error;
  }
}

export async function deleteIncome(token: string, id: number) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/incomes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete income:", error.response?.data || error.message);
    throw error;
  }
}

// --- OVERVIEW (income vs expenses, net balance) ---
export async function getOverview(
  token: string,
  params: {
    period?: "weekly" | "monthly" | "yearly";
    category?: string;
    group_by?: "weekly" | "monthly" | "quarterly" | "half-yearly";
  } = {}
) {
  try {
    const response = await axios.get(`${API_BASE_URL}/summary/overview`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data; // { total_income, total_expenses, net_balance, maybe: series }
  } catch (error: any) {
    console.error("Failed to fetch overview:", error.response?.data || error.message);
    throw error;
  }
}
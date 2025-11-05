# 🧭 ExpenseVista User Guide (Frontend Edition)

Welcome to **ExpenseVista** — your smart personal finance companion.  
This guide shows you how to use every feature of the ExpenseVista web app, from onboarding to dashboards, dark mode, and the built-in AI assistant.

---

## 🌅 Welcome & Onboarding

When you log in for the first time, you’ll see a **Welcome Page** introducing the main features of ExpenseVista.

The welcome page includes:
- A preview of **Income vs Expenses** and **Budget vs Actual** charts  
- Quick links to explore **expenses**, **budgets**, and **income** pages  
- A short guide on **filtering and searching** lists  
- A reminder that you can revisit this page anytime via the **Actions Dropdown → “Onboarding / Welcome Tips”**

> 💡 The Welcome page helps new users understand what to expect before using the full dashboard.

Returning users will go directly to the dashboard but can revisit the welcome anytime.

---

## 💱 Choosing Your Currency

ExpenseVista supports **all major world currencies** 🌍.

### To change your currency:
1. Open the **Actions dropdown** (top-right corner on the dashboard).  
2. Click **“Change currency…”**.  
3. Select your desired currency (e.g. USD $, EUR €, GBP £, NGN ₦, JPY ¥).  
4. All amounts across dashboards, charts, and reports will instantly update.

Your choice is saved locally and persists between sessions.

> 💡 Tip: The currency code and symbol automatically appear when entering or viewing amounts.

---

## 🌗 Theme & Dark Mode Toggle

ExpenseVista offers a **Theme Toggle** that lets you choose your preferred appearance.

### To change the theme:
1. Open the **Actions dropdown** from your dashboard.  
2. Use the **Theme** buttons:
   - ☀️ **Light** – Cream-colored elegant look  
   - 🌙 **Dark** – Soothing dark interface for night use  
   - ⚙️ **Auto** – Automatically adapts to your system theme (light during day, dark at night)

The entire app — including charts, modals, and forms — adjusts instantly.

> 🎨 The default light mode uses a **warm cream background** with bronze accents.  
> In dark mode, forms and cards adopt subtle contrasts for readability.

---

## 🧭 Dashboard Overview

After logging in, you’ll see your **Financial Dashboard**, showing:

- 💰 **Total Income**
- 💸 **Total Expenses**
- 💹 **Net Balance (Income – Expenses)**
- 📊 **Charts by category and time period**
- ⚙️ **Actions Dropdown** for quick navigation and preferences

You can quickly navigate to:
- Record income or expense  
- Create a new budget  
- View list pages  
- Change currency  
- Revisit onboarding  
- Log out  

> The dashboard is your financial command center — everything is just one click away.

---

## 🎯 Managing Budgets

Budgets help you control how much you plan to spend per category and time frame.

### ➕ Create a New Budget
1. Go to **Budgets → Add Budget**.  
2. Fill in:
   - **Category** (e.g. groceries, utilities, transport)  
   - **Limit amount**  
   - **Period** (weekly, monthly, quarterly, yearly)  
3. Click **Create Budget**.

### ✏️ Edit or Delete
- Edit existing budgets using the **Edit** button.  
- Delete by clicking the **trash icon**.

ExpenseVista automatically monitors your progress and alerts you as you approach or exceed your limit.

---

## 💸 Recording Expenses

1. Go to **Expenses → Add Expense**.  
2. Fill in:
   - **Amount**  
   - **Category**  
   - Optional **Description** and **Notes**  
3. Click **Create Expense**.

### 🤖 Smart AI Category Suggestion
You can click **Suggest** beside the category field — ExpenseVista’s AI will analyze your description and auto-suggest the most likely category.

> Example: Typing “Uber ride to airport” might suggest “Transport 🚗”.

---

## 💰 Recording Income

1. Go to **Incomes → Add Income**.  
2. Enter:
   - **Amount**
   - **Category** (e.g. salary, interest)
   - Optional **Source** and **Notes**
3. Click **Create Income**.

All income entries are included in your net balance and charts.

---

## 📊 List Views & Filters

Every list page (Expenses, Budgets, Incomes) supports **powerful filtering and search** tools.

You can:
- Filter by **date range** or **period**
- Search by **description**, **category**, or **source**
- Sort by **amount** or **date**
- Paginate through long lists efficiently

> 💡 Example: On the Expenses List, you can search “transport” or “January” to instantly narrow results.

---

## 🤖 The Finance Assistant (Bubble Chat)

You’ll notice a **💬 Finance Assistant bubble** floating at the **bottom right corner** of every page.  
Click it anytime to open a chat panel where you can ask questions naturally.

### 🗣️ You can ask:
- “How much did I spend this week?”
- “Am I over budget on groceries this month?”
- “Compare my income vs expenses this year.”
- “What’s my top spending category this quarter?”

### ⚡ Quick Prompts
Inside the chat, you’ll see quick buttons like:
- “This week spend”
- “Groceries last month”
- “Over budget?”
- “Income vs expenses”

### ✨ The Assistant Can:
- Read your actual data  
- Explain your budget usage  
- Suggest categories  
- Give summarized insights  

The assistant stays open as you navigate, so you can chat while reviewing your data.

---

## 💬 Email Alerts

ExpenseVista automatically sends you friendly alerts when:
- You hit **50%, 80%, or 100%** of a budget  
- You exceed a budget limit  

Each message includes your name, category, and remaining balance — sent securely via **AWS SES**.

---

## 🔐 Session Management

For your security:
- Each session lasts **60 minutes**.  
- A small notification appears 5 minutes before expiry.  
- You can log out manually from the **Actions dropdown**.  

Your account stays safe, even if left idle.

---

## 🌈 Visual Themes Summary

| Mode | Description | Use case |
|------|--------------|-----------|
| **Light** | Warm cream theme with bronze accents | Everyday use |
| **Dark** | Sleek dark mode with soft contrasts | Night use |
| **Auto** | Adapts to your system preference | Set it and forget it |

---

## 🧩 Tips for New Users

- Start with the **Welcome Page** — it previews everything.  
- Add one or two budgets first, then record your daily expenses.  
- Try asking the **Finance Assistant** something fun, like:  
  > “Which month had my highest expenses?”  
- Adjust your currency anytime via the Actions dropdown.  
- Try dark mode at night — it’s easier on the eyes.

---

## 💡 Frequently Asked Questions

**Q: Why can’t I see any charts yet?**  
A: You need at least one budget, income, and expense entry before the dashboard shows insights.

**Q: How do I change my password?**  
A: Use “Forgot Password” on the login screen to receive a reset link.

**Q: Can I use multiple currencies?**  
A: You can view data in one selected currency at a time — switch anytime from the Actions dropdown.

**Q: Why is the AI Assistant not responding?**  
A: Check your internet connection or ensure you’re logged in with a valid token.

---

## 🎯 Summary

ExpenseVista brings together everything you need to manage your money intelligently:
- 📊 Budgets, Expenses, and Income tracking  
- 💬 AI Finance Assistant  
- 💱 Flexible currency support  
- 🌗 Light/Dark/Auto themes  
- 💌 Smart alerts and insights  
- 🧭 Clear onboarding and easy navigation  

It’s your all-in-one finance dashboard — designed for clarity, control, and confidence.

---

## 💬 Support

Need help or have ideas?  
📧 **Email:** support@expensevista.com  
🐙 **GitHub Issues:** [github.com/Andrew-O39/expense_vista/issues](https://github.com/Andrew-O39/expense_vista/issues)

---

© 2025 **ExpenseVista** — Personal Finance Simplified 💰
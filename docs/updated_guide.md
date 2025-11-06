# 🧭 ExpenseVista User Guide

Welcome to **ExpenseVista** — your smart personal finance companion.  
This guide walks you through everything you need to know to make the most of your budgets, expenses, incomes, reports, and AI-powered insights.

---

## 🪄 What Is ExpenseVista?

**ExpenseVista** helps you take full control of your personal finances.

You can:
- Create and manage **budgets** by category and period
- Track **daily expenses** and **income**
- Compare **budget vs actual spending**
- Visualize **income vs expenses**
- Get **AI-powered insights** about your spending
- Change **currency** and **theme** (light/dark mode)
- View a **Welcome Insights** page to explore how the app works
- Stay aware of your **session duration** for security

Whether you’re an individual, freelancer, or household manager, ExpenseVista keeps your financial picture clear, simple, and empowering.

---

## 🔐 Getting Started

### 1️⃣ Sign Up or Log In

1. Go to your ExpenseVista web app (e.g. `https://expensevista.com`).
2. Click **Register** if you’re new, or **Log In** if you already have an account.
3. Verify your email through the link sent to your inbox.

Once verified, you can sign in securely. ExpenseVista uses **JWT authentication** to protect your session.

---

## 🌅 Welcome Page (Onboarding)

When you log in for the first time, you’ll see the **Welcome Page**, a friendly walkthrough showing:
- How to record your first **income** and **expense**
- How to set **budgets**
- Preview charts for **Income vs Expenses** and **Budget vs Actuals**
- A summary of how filtering and list pages work
- Tips on navigating the app

You can always revisit this page later via your **Dashboard → Actions → Onboarding / Welcome Tips**.

---

## 💰 Currency & Locale Settings

ExpenseVista supports **any currency in the world** 🌍.  
To change your currency or locale format:

1. Go to your **Dashboard → Actions → Change Currency**.  
2. Choose your preferred **ISO code** (e.g., USD, EUR, GHS, INR).  
3. Optionally adjust **locale** (affects separators and symbol position).  
4. Click **Apply** — the app refreshes and updates all monetary values.

This setting persists across all pages until you change it again.

---

## 🎨 Light / Dark Mode

ExpenseVista supports both **light** and **dark** themes — plus an **auto** mode that follows your system preference.

To switch themes:
1. Open **Dashboard → Actions → Theme**.  
2. Select **Light**, **Dark**, or **Auto**.

The theme is remembered even after you log out.  
The default light mode uses a **warm cream background** for comfort during long use.

---

## 🏠 Dashboard Overview

Once signed in, your dashboard provides a complete financial snapshot:

### Key Metrics
- **💰 Total Income**
- **💸 Total Expenses**
- **💹 Net Balance (Income – Expenses)**
- **📊 Charts by category and period**

### Charts
- **Income vs Expenses**: See both flows over time.  
- **Budget vs Actuals**: Compare planned vs real spending per category.  
- **Net Balance**: Quickly see if you’re in surplus or deficit.

Each chart updates dynamically as you log new data.

### Actions
From the **Actions dropdown**, you can:
- Record new income or expense
- Create new budgets
- Open any list (Expenses, Budgets, Incomes)
- Revisit the Welcome Page
- Change currency
- Toggle themes
- Log out securely

---

## 🎯 Managing Budgets

Budgets are central to ExpenseVista — they help you plan and control your spending.

### ➕ Create a Budget
1. Go to **Budgets → Create Budget**
2. Fill in:
   - **Category** (e.g., groceries, transport)
   - **Limit amount**
   - **Period** (weekly, monthly, quarterly, yearly)
3. Save your budget.

### 📊 Budget vs Actual
ExpenseVista automatically compares your **budgeted amount** with your **actual spending**:
- You can see visual comparisons both in the **Dashboard charts** and the **Budgets List**.
- Overspending is clearly highlighted.

### ✏️ Edit or Delete Budgets
- Use the **Edit** button to adjust limits or notes.
- Use the **Delete** button to remove a budget (this does not delete related expenses).

### ✉️ Budget Alerts
You’ll automatically receive email notifications when:
- Spending hits **50%**, **80%**, or **100%+** of a budget.

---

## 🧾 Adding and Tracking Expenses

### ➕ Add an Expense
1. Go to **Expenses → Add Expense**.
2. Enter:
   - **Category**
   - **Amount**
   - Optional **Description** and **Notes**
3. You can also click **Suggest Category** to let the AI guess based on your description.

### 📊 Expense List
- Use **filters** and **search** to find specific expenses by date, category, or keyword.
- Sort by **date** or **amount**.

Expenses automatically count toward related budgets.

---

## 💰 Recording Income

Keep track of your income streams.

### ➕ Add Income
1. Go to **Income → Record Income**
2. Enter:
   - **Category**
   - **Amount**
   - **Source** (optional)
   - **Date received**
3. Save and view it in the **Income List**.

### 📈 Income vs Expenses
The **Dashboard** displays income and expense trends together, making it easy to see:
- When income dips or expenses rise
- Net savings per week/month/quarter

---

## 📧 Email Notifications

ExpenseVista sends automated emails (via **Amazon SES**) when:
- You approach or exceed a budget.
- You verify your email or reset your password.

Emails include:
- Budget category and limits
- Personalized progress messages
- Links back to your dashboard

> Example:  
> “Hi Andrew, you’ve used 80% of your transport budget this month — keep an eye on your spending!”

---

## 📊 Reports & Analytics

The **Reports and Dashboard** sections help you understand your financial health.

### Income vs Expenses Chart
- Compare total income and expenses side by side.
- Filter by **weekly**, **monthly**, **quarterly**, or **yearly**.

### Budget vs Actuals Chart
- Visualize each category’s spending vs its set limit.
- Instantly see where you’re **under** or **over** budget.

Charts are interactive and auto-scale to your data.

---

## 🤖 Finance Assistant

A small 💬 **Finance Assistant bubble** appears at the **bottom-right** of every page.

Click it to open your **AI assistant** — a conversational helper that can answer:
- “How much did I spend on groceries last month?”
- “What’s my top spending category this quarter?”
- “Am I over budget this month?”
- “Compare income vs expenses this year.”

### Quick Prompts
At the top of the chat, you’ll find one-click prompts for common queries.

### Smart Feedback
When you accept AI suggestions (like category names), ExpenseVista learns your preferences over time.

The assistant uses your data locally and safely — it never shares or exposes your private financial data.

---

## 💡 Additional Features

### 🕓 Session Management
- Each login session lasts **60 minutes**.
- You’ll see a **Session Watcher** prompt 5 minutes before expiry.
- If you do nothing, you’ll be logged out for security.
- Simply log back in to resume where you left off.

### 🌐 Multi-Currency Support
All monetary fields (budgets, incomes, expenses) dynamically adapt to your selected currency and locale.

### 🪄 Welcome Insights Page
A friendly interactive page summarizing your dashboard, charts, and filtering options.  
You can revisit it anytime via **Dashboard → Actions → Onboarding / Welcome Tips**.

---

## 💡 FAQ

### ❓ Why do my totals differ from my bank account?
ExpenseVista only reports what you’ve logged.  
Missing entries = missing totals.

### ❓ Can I track multiple accounts?
Not yet — future versions may allow linked accounts or categories for each wallet.

### ❓ How do I reset my password?
Click **Forgot Password** on the login screen and check your email.

### ❓ Didn’t receive an alert email?
Check **spam/junk folders** or ensure your email is verified.

### ❓ Why does my session expire?
Sessions expire automatically after 60 minutes for security reasons.

---

## 🛠️ Troubleshooting

| Issue | Possible Fix |
|--------|---------------|
| **AI Assistant not responding** | Ensure you’re logged in and online; rephrase your question with a date range. |
| **Emails not sending** | Your verification may be pending. Recheck your inbox. |
| **Budget alerts missing** | Verify email and check spam folder. |
| **Theme not changing** | Reload after selecting light/dark mode in Actions. |
| **Currency not updating** | Click “Apply” after selecting your preferred ISO code. |

---

## 🌱 Smart Budgeting Tips

- Set **realistic limits** based on past data.
- Review your **top categories monthly**.
- Combine short-term and long-term budgets.
- Use **AI Assistant** to spot trends:
  > “What’s my biggest expense this month?”
  > “Which category am I over budget on?”

---

## 🧭 Summary

ExpenseVista empowers you to:
- Create and track budgets, expenses, and incomes
- Compare budget vs actuals and income vs expenses
- Receive smart alerts and emails
- Ask your AI Assistant about your data
- Switch themes, currencies, and locales with ease
- Enjoy a smooth, intuitive experience on desktop or mobile

ExpenseVista — **Personal Finance Simplified.**

---

## 💬 Support

Need help or have ideas?

📧 **Email:** support@expensevista.com  
(You can also reply to our outgoing emails — we’ll get your message through our support channel.)  

🐙 **GitHub Issues:** [github.com/Andrew-O39/expense_vista/issues](https://github.com/Andrew-O39/expense_vista/issues)

---

© 2025 **ExpenseVista** — Smarter Budgets, Simpler Life 💰
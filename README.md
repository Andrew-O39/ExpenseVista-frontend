# 💻 ExpenseVista Frontend

The **ExpenseVista Frontend** is the web interface for the ExpenseVista personal finance platform.

It provides a modern dashboard for tracking income, expenses, and budgets while visualizing financial trends and exporting reports.

The frontend communicates with the **ExpenseVista FastAPI backend** and delivers a responsive, interactive user experience.

---

# 🌟 Features

ExpenseVista's frontend provides a full financial dashboard experience.

### 📊 Financial Dashboard
- Total Income, Total Expenses, Net Balance cards
- Spending by category visualization
- Budget vs actual spending comparison
- Income vs expenses trend analysis
- Dynamic filtering by time period and category

### 📋 Data Management
Users can manage:

- **Expenses**
- **Income**
- **Budgets**

Each list page includes:

- Search
- Date filters
- Pagination
- Totals summary
- Edit / delete functionality

### 📄 PDF Export
Users can export filtered data as **PDF reports**:

- Expense List
- Income List
- Budget List
- Budget vs Actual table on the Dashboard

Exports include:
- Active filters
- Totals summary
- Timestamp

### 🤖 Finance Assistant
A floating AI-powered assistant helps users:

- Ask questions about their spending
- Analyze budgets
- Compare income vs expenses
- Receive insights about financial habits

### 🎨 Modern UI
- Responsive layout
- Sidebar navigation
- Light / Dark theme
- Currency switching
- Animated dashboard cards
- Smooth micro-interactions

### 🔐 Secure Authentication
- JWT-based login
- Email verification
- Password reset
- Session timeout protection

---

# 🧱 Tech Stack

### Framework
- **React**
- **TypeScript**
- **Vite**

### UI
- **Bootstrap 5**
- Custom design tokens
- Framer Motion animations

### Charts
- **Recharts**

### Exporting
- **jsPDF**
- **jspdf-autotable**

### Routing
- **React Router**

---

# 📂 Project Structure

```
src/
│
├── components/        # Reusable UI components
│   ├── AppShell.tsx
│   ├── FinanceAssistant.tsx
│   ├── DashboardKpiCard.tsx
│   ├── DashboardMetricCard.tsx
│   └── ...
│
├── pages/             # Application pages
│   ├── Dashboard.tsx
│   ├── ExpenseList.tsx
│   ├── IncomeList.tsx
│   ├── BudgetList.tsx
│   ├── CreateExpense.tsx
│   ├── CreateIncome.tsx
│   ├── CreateBudget.tsx
│   └── ...
│
├── utils/
│   ├── pdfExport.ts   # Shared PDF export utility
│
├── App.tsx            # Main router
├── App.css            # Global styles and design tokens
└── main.tsx           # Application entry point
```

---

# 🧭 Application Layout

ExpenseVista uses a **two-part layout**.

### Sidebar Navigation

The left sidebar contains the main workflow:

```
Overview
 └ Dashboard

Create
 ├ Record Income
 ├ Add Expense
 └ Create Budget

Lists
 ├ Income List
 ├ Expense List
 └ Budget List

Account
 └ Logout
```

### User Menu

Located in the **top-right corner** of the application.

Options include:

- Theme selection
- Currency settings
- Onboarding / Welcome Tips
- Session information

---

# 🚀 Running the Frontend Locally

## 1️⃣ Install dependencies

```bash
npm install
```

## 2️⃣ Start the development server

```bash
npm run dev
```

The app will run at:

```
http://localhost:5173
```

---

# 🏗️ Building for Production

To create a production build:

```bash
npm run build
```

The compiled application will appear in:

```
dist/
```

---

# 🐳 Running with Docker

The frontend is designed to run as part of the **ExpenseVista Docker stack**.

Typical setup:

```
frontend (React + Vite)
backend (FastAPI)
database (PostgreSQL)
redis (optional for async tasks)
```

Build the frontend container:

```bash
docker compose build web
```

Start the stack:

```bash
docker compose up
```

---

# 📊 Dashboard Visualizations

ExpenseVista uses **Recharts** for data visualization.

Charts include:

- Spending by category
- Budget vs actual comparison
- Income vs expenses trends

Charts automatically update when new data is added.

---

# 📄 PDF Reporting

PDF exports are generated using:

- **jsPDF**
- **jspdf-autotable**

The shared utility:

```
src/utils/pdfExport.ts
```

ensures consistent export formatting across:

- Expense lists
- Income lists
- Budget lists
- Dashboard tables

---

# 🤖 Finance Assistant

The assistant provides conversational insights about the user's finances.

Users can ask questions such as:

```
How much did I spend this month?
Which category exceeds my budget?
Compare income vs expenses this quarter.
```

The assistant appears as a **floating chat bubble** on all authenticated pages.

---

# 🧪 Development Tips

### Lint the project

```
npm run lint
```

### Format code

```
npm run format
```

### Check TypeScript errors

```
npm run build
```

---

# 🔮 Future Improvements

Potential future features include:

- CSV exports
- Chart image exports
- Multi-account support
- Mobile navigation improvements
- Financial trend forecasting
- Category management

---

# 🤝 Contributing

Contributions are welcome.

To contribute:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

Please ensure:

- Code compiles
- TypeScript passes
- UI remains responsive

---

# 📄 License

This project is part of the **ExpenseVista** platform.

---

# 💬 Support

GitHub Issues  
https://github.com/Andrew-O39/expense_vista/issues
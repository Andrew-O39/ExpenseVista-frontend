import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import CreateExpense from './pages/CreateExpense';
import CreateBudget from './pages/CreateBudget';
import ExpenseList from './pages/ExpenseList';
import BudgetList from './pages/BudgetList';
import ExpenseEdit from './pages/ExpenseEdit';
import BudgetEdit from './pages/BudgetEdit';
import CreateIncome from './pages/CreateIncome';
import IncomeList from './pages/IncomeList';
import EditIncome from './pages/EditIncome';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} /> {/* <-- fixed */}
        <Route path="/create-expense" element={<CreateExpense />} />
        <Route path="/create-budget" element={<CreateBudget />} />
        <Route path="/expenses" element={<ExpenseList />} />
        <Route path="/budgets" element={<BudgetList />} />
        <Route path="/edit-expense/:id" element={<ExpenseEdit />} />
        <Route path="/edit-budget/:id" element={<BudgetEdit />} />
        <Route path="/create-income" element={<CreateIncome />} />
        <Route path="/incomes" element={<IncomeList />} />
        <Route path="/edit-income/:id" element={<EditIncome />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// Illustrative chart data
const CHART_DATA = [
  { month: "Jan", income: 2400, expenses: 1200 },
  { month: "Feb", income: 2200, expenses: 1400 },
  { month: "Mar", income: 2600, expenses: 1100 },
  { month: "Apr", income: 2450, expenses: 1320 },
  { month: "May", income: 2500, expenses: 1280 },
  { month: "Jun", income: 2550, expenses: 1300 },
];

const METRICS = [
  { label: "Income", value: "+$2,450", variant: "success" },
  { label: "Expenses", value: "$1,320", variant: "neutral" },
  { label: "Net", value: "+$1,130", variant: "success" },
  { label: "Budget", value: "78%", variant: "neutral" },
];

export default function LandingHero() {
  return (
    <div className="hero-welcome">
      <motion.div
        className="hero-welcome-inner"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h1 className="hero-welcome-title" variants={item}>
          Your finance dashboard, simplified
        </motion.h1>
        <motion.p className="hero-welcome-subtitle" variants={item}>
          Track expenses, manage budgets, and see your income at a glance. ExpenseVista brings clarity to your personal finances.
        </motion.p>
        <motion.div className="hero-welcome-actions" variants={item}>
          <Link to="/register" className="btn btn-primary btn-lg shadow-sm">
            Get started
          </Link>
          <Link to="/login" className="btn btn-outline-primary btn-lg shadow-sm">
            Log in
          </Link>
        </motion.div>

        <motion.div
          className="hero-preview"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="hero-preview-card">
            <div className="hero-preview-chart">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={CHART_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--bs-secondary-color)" />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "var(--ev-surface-elevated)",
                      border: "1px solid var(--ev-border-subtle)",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }}
                    formatter={(val: number) => [`$${val.toLocaleString()}`, ""]}
                    labelFormatter={(l) => l}
                  />
                  <Bar dataKey="income" name="Income" fill="var(--bs-success)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="var(--bs-secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="hero-preview-caption">Income vs expenses · illustrative</p>
          </div>

          <div className="hero-metrics">
            {METRICS.map((m, i) => (
              <motion.div
                key={m.label}
                className="hero-metric-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: [0, -4, 0],
                }}
                transition={{
                  opacity: { delay: 0.6 + i * 0.1, duration: 0.35 },
                  y: {
                    delay: 1.2 + i * 0.4,
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
              >
                <span className="hero-metric-label">{m.label}</span>
                <motion.span
                  className={`hero-metric-value hero-metric-value--${m.variant}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 + i * 0.1, duration: 0.4 }}
                >
                  {m.value}
                </motion.span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface BudgetTrackerProps {
  onBudgetWarning?: (warning: string) => void;
}

export const FreepikBudgetTracker: React.FC<BudgetTrackerProps> = ({
  onBudgetWarning,
}) => {
  const [budgetStatus, setBudgetStatus] = useState<{
    monthlyUsed: number;
    monthlyLimit: number;
    dailyUsed: number;
    dailyLimit: number;
    estimatedCost: number;
  } | null>(null);

  const [showTracker, setShowTracker] = useState(false);

  // Check budget status periodically
  useEffect(() => {
    const checkBudget = async () => {
      try {
        const response = await fetch("/api/images/budget-status");
        if (response.ok) {
          const status = await response.json();
          setBudgetStatus(status);

          // Warn when approaching limits
          const monthlyUsagePercent =
            (status.monthlyUsed / status.monthlyLimit) * 100;
          const dailyUsagePercent =
            (status.dailyUsed / status.dailyLimit) * 100;

          if (monthlyUsagePercent > 80) {
            onBudgetWarning?.(
              `⚠️ Monthly budget is ${monthlyUsagePercent.toFixed(
                1
              )}% used (${status.estimatedCost.toFixed(2)} EUR / 5.00 EUR)`
            );
            setShowTracker(true);
          } else if (dailyUsagePercent > 90) {
            onBudgetWarning?.(
              `⚠️ Daily limit is ${dailyUsagePercent.toFixed(1)}% used`
            );
            setShowTracker(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch budget status:", error);
      }
    };

    checkBudget();
    const interval = setInterval(checkBudget, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [onBudgetWarning]);

  if (!budgetStatus || !showTracker) return null;

  const monthlyPercentage =
    (budgetStatus.monthlyUsed / budgetStatus.monthlyLimit) * 100;
  const dailyPercentage =
    (budgetStatus.dailyUsed / budgetStatus.dailyLimit) * 100;

  const getColorByPercentage = (percentage: number) => {
    if (percentage >= 90) return "text-red-600 bg-red-100";
    if (percentage >= 70) return "text-orange-600 bg-orange-100";
    if (percentage >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-gray-800 flex items-center gap-2">
          💰 API Budget Tracker
        </h4>
        <button
          onClick={() => setShowTracker(false)}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ✕
        </button>
      </div>

      {/* Monthly Budget */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">
            Monthly (5 EUR limit)
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${getColorByPercentage(
              monthlyPercentage
            )}`}
          >
            {monthlyPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${
              monthlyPercentage >= 90
                ? "bg-red-500"
                : monthlyPercentage >= 70
                ? "bg-orange-500"
                : "bg-green-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(monthlyPercentage, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {budgetStatus.monthlyUsed}/{budgetStatus.monthlyLimit} requests (≈
          {budgetStatus.estimatedCost.toFixed(2)} EUR)
        </p>
      </div>

      {/* Daily Budget */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Daily Limit</span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${getColorByPercentage(
              dailyPercentage
            )}`}
          >
            {dailyPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${
              dailyPercentage >= 90
                ? "bg-red-500"
                : dailyPercentage >= 70
                ? "bg-orange-500"
                : "bg-green-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(dailyPercentage, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {budgetStatus.dailyUsed}/{budgetStatus.dailyLimit} requests today
        </p>
      </div>

      {/* Budget Tips */}
      {monthlyPercentage > 60 && (
        <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            💡 <strong>Tip:</strong> Images are cached for 1 hour to reduce API
            costs. Same searches won't use additional budget.
          </p>
        </div>
      )}
    </motion.div>
  );
};

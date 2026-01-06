import React, { useEffect, useState } from "react";
import { getGeminiUsageStats } from "../../services/aiService";

interface QuotaStatusProps {
  showDetails?: boolean;
}

export const QuotaStatus: React.FC<QuotaStatusProps> = ({
  showDetails = false,
}) => {
  const [stats, setStats] = useState<ReturnType<typeof getGeminiUsageStats> | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const usageStats = getGeminiUsageStats();
    setStats(usageStats);
    setQuotaExceeded(usageStats.percentageUsed >= 100);
  }, []);

  if (!stats) return null;

  const getStatusColor = () => {
    if (stats.percentageUsed >= 100) return "text-red-600 bg-red-50 border-red-200";
    if (stats.percentageUsed >= 80) return "text-orange-600 bg-orange-50 border-orange-200";
    if (stats.percentageUsed >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getProgressColor = () => {
    if (stats.percentageUsed >= 100) return "bg-red-500";
    if (stats.percentageUsed >= 80) return "bg-orange-500";
    if (stats.percentageUsed >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (quotaExceeded) {
    return (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 mb-1">
              AI Quota Exceeded
            </h3>
            <p className="text-sm text-red-700 mb-2">
              You've reached the monthly limit for AI-generated itineraries. The app will use sample itineraries instead.
            </p>
            <div className="text-xs text-red-600 space-y-1">
              <p>• Monthly usage: {stats.monthlyUsed}/{stats.monthlyLimit} requests</p>
              <p>• Resets on: First day of next month</p>
              <p className="mt-2 font-medium">To continue using AI features, consider upgrading to a paid Gemini API plan.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!showDetails) return null;

  return (
    <div className={`mb-4 p-3 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">API Usage This Month</span>
        <span className="text-sm font-semibold">{stats.monthlyUsed}/{stats.monthlyLimit}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${Math.min(stats.percentageUsed, 100)}%` }}
        />
      </div>
      <div className="text-xs space-y-1">
        <p>• Daily: {stats.dailyUsed}/{stats.dailyLimit}</p>
        <p>• Per minute: {stats.minuteUsed}/{stats.minuteLimit}</p>
        {stats.percentageUsed >= 80 && stats.percentageUsed < 100 && (
          <p className="mt-2 font-medium">⚠️ Approaching monthly limit. App will use sample itineraries when quota is exceeded.</p>
        )}
      </div>
    </div>
  );
};

import React from "react";

interface SampleDataBannerProps {
  onDismiss?: () => void;
}

export const SampleDataBanner: React.FC<SampleDataBannerProps> = ({
  onDismiss,
}) => {
  return (
    <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">
            Viewing Sample Itinerary
          </h3>
          <p className="text-sm text-blue-800 mb-2">
            The AI API quota has been exceeded for this month. You're viewing a
            demonstration itinerary that showcases the app's capabilities.
          </p>
          <div className="mt-3 space-y-2">
            <div className="text-xs text-blue-700 space-y-1">
              <p className="font-medium">What this means:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Sample data is displayed instead of AI-generated content
                </li>
                <li>All app features remain functional for demonstration</li>
                <li>
                  Real AI generation resumes when quota resets (next month)
                </li>
              </ul>
            </div>
            <div className="mt-3 text-xs text-blue-700">
              <p className="font-medium mb-1">To restore AI features:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Wait for monthly quota reset (1st of next month)</li>
                <li>Or upgrade to a paid Google Gemini API plan</li>
              </ul>
            </div>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors"
            aria-label="Dismiss banner"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

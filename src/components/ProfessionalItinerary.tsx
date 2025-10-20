import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ImageService } from "../services/imageService";

interface ProfessionalItineraryProps {
  itinerary: any;
  onGenerateNew: () => void;
}

// Hook for async image loading
function useAsyncImage(activityName: string, activityAddress: string = "") {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      setLoading(true);
      try {
        const url = await ImageService.getActivityImage(
          activityName,
          activityAddress
        );
        setImageUrl(url);
      } catch (error) {
        console.error("Error loading image:", error);
        setImageUrl(
          "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=400&h=300&fit=crop&q=80"
        );
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [activityName, activityAddress]);

  return { imageUrl, loading };
}

// Activity Image Component
function ActivityImage({
  activityName,
  activityAddress = "",
  className = "",
}: {
  activityName: string;
  activityAddress?: string;
  className?: string;
}) {
  const { imageUrl, loading } = useAsyncImage(activityName, activityAddress);

  if (loading) {
    return (
      <div
        className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
      >
        <span className="text-gray-400">📷</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={activityName}
      className={className}
      onError={(e) => {
        // Fallback to a generic travel image if specific one fails
        (
          e.target as HTMLImageElement
        ).src = `https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=400&h=300&fit=crop&q=80`;
      }}
    />
  );
}

// Helper function to get category colors
function getCategoryColor(category: string): string {
  const categoryColors: { [key: string]: string } = {
    // Main activity categories with distinct colors
    historical: "bg-amber-100 text-amber-800 border-amber-300",
    cultural: "bg-cyan-100 text-cyan-800 border-cyan-300",
    shopping: "bg-emerald-100 text-emerald-800 border-emerald-300",
    sightseeing: "bg-blue-100 text-blue-800 border-blue-300",
    nature: "bg-green-100 text-green-800 border-green-300",
    entertainment: "bg-violet-100 text-violet-800 border-violet-300",
    religious: "bg-rose-100 text-rose-800 border-rose-300",
    museum: "bg-purple-100 text-purple-800 border-purple-300",
    food: "bg-orange-100 text-orange-800 border-orange-300",
    nightlife: "bg-indigo-100 text-indigo-800 border-indigo-300",
    outdoor: "bg-lime-100 text-lime-800 border-lime-300",
    sports: "bg-red-100 text-red-800 border-red-300",
    // Specific venue types
    attraction: "bg-blue-100 text-blue-800 border-blue-300",
    gallery: "bg-purple-100 text-purple-800 border-purple-300",
    church: "bg-rose-100 text-rose-800 border-rose-300",
    cathedral: "bg-rose-100 text-rose-800 border-rose-300",
    castle: "bg-amber-100 text-amber-800 border-amber-300",
    palace: "bg-amber-100 text-amber-800 border-amber-300",
    park: "bg-green-100 text-green-800 border-green-300",
    garden: "bg-green-100 text-green-800 border-green-300",
    restaurant: "bg-orange-100 text-orange-800 border-orange-300",
    pub: "bg-yellow-100 text-yellow-800 border-yellow-300",
    bar: "bg-yellow-100 text-yellow-800 border-yellow-300",
    cafe: "bg-pink-100 text-pink-800 border-pink-300",
    library: "bg-indigo-100 text-indigo-800 border-indigo-300",
    university: "bg-indigo-100 text-indigo-800 border-indigo-300",
    college: "bg-indigo-100 text-indigo-800 border-indigo-300",
    market: "bg-emerald-100 text-emerald-800 border-emerald-300",
    default: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const lowerCategory = category.toLowerCase();
  for (const [key, color] of Object.entries(categoryColors)) {
    if (lowerCategory.includes(key)) {
      return color;
    }
  }
  return categoryColors.default;
}

// Helper function to get day colors
function getDayColor(dayNumber: number): {
  bg: string;
  circle: string;
  gradient: string;
} {
  const dayColors = [
    {
      bg: "bg-blue-50",
      circle: "bg-blue-600",
      gradient: "from-blue-50 to-blue-100",
    },
    {
      bg: "bg-purple-50",
      circle: "bg-purple-600",
      gradient: "from-purple-50 to-purple-100",
    },
    {
      bg: "bg-green-50",
      circle: "bg-green-600",
      gradient: "from-green-50 to-green-100",
    },
    {
      bg: "bg-orange-50",
      circle: "bg-orange-600",
      gradient: "from-orange-50 to-orange-100",
    },
    {
      bg: "bg-pink-50",
      circle: "bg-pink-600",
      gradient: "from-pink-50 to-pink-100",
    },
    {
      bg: "bg-indigo-50",
      circle: "bg-indigo-600",
      gradient: "from-indigo-50 to-indigo-100",
    },
    {
      bg: "bg-teal-50",
      circle: "bg-teal-600",
      gradient: "from-teal-50 to-teal-100",
    },
  ];

  // Cycle through colors if more than 7 days
  const colorIndex = (dayNumber - 1) % dayColors.length;
  return dayColors[colorIndex];
}

interface ProfessionalItineraryProps {
  itinerary: any;
  onGenerateNew: () => void;
}

export default function ProfessionalItinerary({
  itinerary,
  onGenerateNew,
}: ProfessionalItineraryProps) {
  console.log("🎨 ProfessionalItinerary received:", itinerary);
  console.log("🎨 Daily plans:", itinerary?.dailyPlans);
  console.log(
    "🎨 First activity:",
    itinerary?.dailyPlans?.[0]?.activities?.[0]
  );

  return (
    <section className="mb-24 relative">
      <motion.div
        className="bg-white rounded-3xl shadow-2xl max-w-6xl mx-auto overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Hero Header with Trip Overview */}
        <div className="relative h-80 overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${ImageService.getHeroImage(
                itinerary.title
              )})`,
            }}
          ></div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-purple-900/70 to-pink-900/80"></div>

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          </div>

          <div className="relative z-10 p-8 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="text-white">
                <motion.div
                  className="flex items-center gap-3 mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                    📅 {itinerary.dailyPlans?.length || 0} day plan
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                    ⭐ 4.9/5 AI Generated
                  </span>
                </motion.div>

                <motion.h1
                  className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {itinerary.title || "Your Perfect Journey"}
                </motion.h1>

                <motion.p
                  className="text-xl opacity-90 max-w-2xl leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {itinerary.description || "An amazing adventure awaits"}
                </motion.p>
              </div>

              <motion.div
                className="text-right text-white"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-4xl font-bold mb-1">
                  ${itinerary.totalEstimatedCost?.toFixed(0) || "0"}
                </div>
                <div className="text-sm opacity-80">Total Budget</div>
              </motion.div>
            </div>

            {/* Trip Tags */}
            <motion.div
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-white border border-white/30">
                🏛️ Cultural
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-white border border-white/30">
                👥 Couple
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-white border border-white/30">
                💎 Mid-range
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-white border border-white/30">
                🏛️ Historical Sites
              </span>
            </motion.div>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-8">
          {/* Daily Itinerary */}
          <div className="space-y-8">
            {itinerary.dailyPlans?.map((day: any, dayIndex: number) => (
              <motion.div
                key={dayIndex}
                className="border border-gray-200 rounded-2xl overflow-hidden bg-white"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.1 }}
              >
                {/* Day Header */}
                <div
                  className={`bg-gradient-to-r ${
                    getDayColor(day.day).gradient
                  } p-6 border-b border-gray-200`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 ${
                        getDayColor(day.day).circle
                      } text-white rounded-full flex items-center justify-center font-bold text-lg`}
                    >
                      {day.day}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        Day {day.day}: {day.theme}
                      </h3>
                      <p className="text-gray-600 mt-1">{day.date}</p>
                    </div>
                  </div>
                </div>

                {/* Day Content */}
                <div className="p-6">
                  {/* Time-based Activity Groups */}
                  {day.activities?.length > 0 && (
                    <div className="space-y-6">
                      {[
                        {
                          period: "Morning",
                          times: ["06", "07", "08", "09", "10", "11"],
                          icon: "🌅",
                        },
                        {
                          period: "Afternoon",
                          times: ["12", "13", "14", "15", "16", "17"],
                          icon: "☀️",
                        },
                        {
                          period: "Evening",
                          times: ["18", "19", "20", "21", "22", "23"],
                          icon: "🌆",
                        },
                      ].map((timeGroup) => {
                        const periodActivities = day.activities.filter(
                          (activity: any) =>
                            timeGroup.times.some((time) =>
                              activity.time.startsWith(time)
                            )
                        );

                        if (periodActivities.length === 0) return null;

                        return (
                          <div key={timeGroup.period} className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-200 pb-2">
                              {timeGroup.icon} {timeGroup.period}
                            </h4>

                            {periodActivities.map(
                              (activity: any, actIdx: number) => (
                                <div
                                  key={actIdx}
                                  className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                  {/* Activity Image - Bigger and responsive */}
                                  <div className="flex-shrink-0 w-full md:w-32">
                                    <ActivityImage
                                      activityName={activity.name}
                                      activityAddress={activity.address || ""}
                                      className="w-full md:w-32 h-24 md:h-32 object-cover rounded-lg shadow-md"
                                    />
                                  </div>

                                  {/* Time info - responsive layout */}
                                  <div className="flex-shrink-0 md:w-16 text-center md:text-center">
                                    <div className="text-blue-600 font-bold text-lg">
                                      {activity.time}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {activity.duration}
                                    </div>
                                  </div>

                                  <div className="flex-grow">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-3 gap-2">
                                      <div className="flex-grow">
                                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                                          <h5 className="font-bold text-gray-900 text-lg">
                                            {activity.name}
                                          </h5>
                                          {/* Multiple colored category tags - separated */}
                                          <div className="flex flex-wrap gap-2">
                                            {(activity.category || "")
                                              .split("|")
                                              .filter((cat: string) =>
                                                cat.trim()
                                              )
                                              .map(
                                                (
                                                  category: string,
                                                  catIdx: number
                                                ) => (
                                                  <span
                                                    key={catIdx}
                                                    className={`text-xs font-medium px-3 py-1 rounded-full border ${getCategoryColor(
                                                      category
                                                        .trim()
                                                        .toLowerCase()
                                                    )}`}
                                                  >
                                                    {category
                                                      .trim()
                                                      .toLowerCase()}
                                                  </span>
                                                )
                                              )}
                                          </div>
                                        </div>
                                        {activity.address && (
                                          <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                                            📍 {activity.address}
                                          </p>
                                        )}
                                        {activity.googleMapsRating && (
                                          <p className="text-sm text-yellow-600">
                                            ⭐ {activity.googleMapsRating}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <p className="text-gray-700 mb-3 leading-relaxed text-sm md:text-base">
                                      {activity.description}
                                    </p>

                                    {activity.tips?.length > 0 && (
                                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <div className="text-sm font-medium text-yellow-800 mb-1">
                                          💡 Pro Tips:
                                        </div>
                                        <ul className="text-sm text-yellow-700 space-y-1">
                                          {activity.tips.map(
                                            (tip: string, tipIdx: number) => (
                                              <li
                                                key={tipIdx}
                                                className="flex items-start gap-2"
                                              >
                                                <span className="text-yellow-600 mt-0.5">
                                                  •
                                                </span>
                                                <span>{tip}</span>
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action Button */}
          <div className="mt-12 text-center">
            <motion.button
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 px-12 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGenerateNew}
            >
              ✨ Generate New Itinerary
            </motion.button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

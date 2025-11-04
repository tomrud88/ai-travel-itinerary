import React, { useState } from "react";
import { motion } from "framer-motion";
import type { AIItineraryRequest, TravelPreferences } from "../../types";
import {
  ActivityLevel,
  AccommodationType,
  TransportationType,
  DiningPreference,
} from "../../types";

interface AIItineraryGeneratorProps {
  onGenerate?: (request: AIItineraryRequest) => void;
  loading?: boolean;
}

const AIItineraryGenerator: React.FC<AIItineraryGeneratorProps> = ({
  onGenerate,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    destination: "",
    duration: 4,
    budget: 1000,
    travelers: 2,
    startDate: "",
    preferences: {
      budget: 1000,
      travelers: 2,
      interests: ["SIGHTSEEING"], // Default to sightseeing
      accommodationType: [AccommodationType.HOTEL], // Default to hotel
      transportationPreference: [TransportationType.WALK], // Default to walking for local transport (no flights)
      activityLevel: ActivityLevel.LOW, // Default to relaxed pace
      diningPreference: [DiningPreference.LOCAL], // Default to local cuisine
    } as TravelPreferences,
  });

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const interestOptions = [
    "SIGHTSEEING",
    "ADVENTURE",
    "CULTURAL",
    "FOOD",
    "NIGHTLIFE",
    "SHOPPING",
    "NATURE",
    "RELAXATION",
  ];

  const accommodationOptions = Object.values(AccommodationType);
  const transportationOptions = Object.values(TransportationType).filter(
    (t) => t !== "FLIGHT"
  ); // Remove FLIGHT
  const diningOptions = Object.values(DiningPreference);
  const activityLevels = Object.values(ActivityLevel);

  const handleInterestToggle = (interest: string) => {
    const currentInterests = formData.preferences.interests;
    const isCurrentlySelected = currentInterests.includes(interest);

    let updatedInterests;
    if (isCurrentlySelected && currentInterests.length > 1) {
      // Remove only if there's more than one selected
      updatedInterests = currentInterests.filter((i) => i !== interest);
    } else if (!isCurrentlySelected) {
      // Add if not selected
      updatedInterests = [...currentInterests, interest];
    } else {
      // Keep at least one selected
      updatedInterests = currentInterests;
    }

    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        interests: updatedInterests,
      },
    }));
  };

  const handleAccommodationToggle = (accommodation: AccommodationType) => {
    const currentAccommodations = formData.preferences.accommodationType;
    const isCurrentlySelected = currentAccommodations.includes(accommodation);

    let updated;
    if (isCurrentlySelected && currentAccommodations.length > 1) {
      // Remove only if there's more than one selected
      updated = currentAccommodations.filter((a) => a !== accommodation);
    } else if (!isCurrentlySelected) {
      // Add if not selected
      updated = [...currentAccommodations, accommodation];
    } else {
      // Keep at least one selected
      updated = currentAccommodations;
    }

    setFormData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, accommodationType: updated },
    }));
  };

  const handleTransportationToggle = (transport: TransportationType) => {
    const currentTransports = formData.preferences.transportationPreference;
    const isCurrentlySelected = currentTransports.includes(transport);

    let updated;
    if (isCurrentlySelected && currentTransports.length > 1) {
      // Remove only if there's more than one selected
      updated = currentTransports.filter((t) => t !== transport);
    } else if (!isCurrentlySelected) {
      // Add if not selected
      updated = [...currentTransports, transport];
    } else {
      // Keep at least one selected
      updated = currentTransports;
    }

    setFormData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, transportationPreference: updated },
    }));
  };

  const handleDiningToggle = (dining: DiningPreference) => {
    const currentDining = formData.preferences.diningPreference;
    const isCurrentlySelected = currentDining.includes(dining);

    let updated;
    if (isCurrentlySelected && currentDining.length > 1) {
      // Remove only if there's more than one selected
      updated = currentDining.filter((d) => d !== dining);
    } else if (!isCurrentlySelected) {
      // Add if not selected
      updated = [...currentDining, dining];
    } else {
      // Keep at least one selected
      updated = currentDining;
    }

    setFormData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, diningPreference: updated },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const request: AIItineraryRequest = {
      destinations: [formData.destination], // Single destination as array
      duration: formData.duration,
      budget: formData.budget,
      travelers: formData.travelers,
      interests: formData.preferences.interests, // Use preferences.interests
      startDate: new Date(formData.startDate),
      preferences: {
        ...formData.preferences,
        budget: formData.budget,
        travelers: formData.travelers,
      },
    };

    onGenerate?.(request);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destination Input - Single destination */}
        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Where do you want to go?
          </label>
          <input
            type="text"
            value={formData.destination}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, destination: e.target.value }))
            }
            placeholder="Enter destination (e.g., Paris, Tokyo, New York)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 placeholder-gray-500"
            required
          />
        </motion.div>

        {/* Duration and Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (days)
            </label>
            <input
              type="number"
              min="1"
              max="4"
              value={formData.duration}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  duration: parseInt(e.target.value),
                }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 text-gray-900"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget ($)
            </label>
            <input
              type="number"
              min="100"
              value={formData.budget}
              onChange={(e) => {
                const budget = parseInt(e.target.value);
                setFormData((prev) => ({
                  ...prev,
                  budget,
                  preferences: { ...prev.preferences, budget },
                }));
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 text-gray-900"
            />
          </motion.div>
        </div>

        {/* Travelers and Start Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Travelers
            </label>
            <select
              value={formData.travelers}
              onChange={(e) => {
                const travelers = parseInt(e.target.value);
                setFormData((prev) => ({
                  ...prev,
                  travelers,
                  preferences: { ...prev.preferences, travelers },
                }));
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 text-gray-900"
            >
              <option value={1}>1 Traveler</option>
              <option value={2}>2 Travelers</option>
              <option value={3}>3 Travelers</option>
              <option value={4}>4 Travelers</option>
              <option value={5}>5+ Travelers</option>
            </select>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 text-gray-900"
              required
            />
          </motion.div>
        </div>

        {/* Travel Preferences with option to customize */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 p-4 rounded-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              🎛️ Travel Preferences
            </h4>
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-md text-sm flex items-center gap-2"
            >
              {showAdvancedOptions ? (
                <>
                  <span>↑</span> Hide Options
                </>
              ) : (
                <>
                  <span>⚙️</span> Customize Preferences
                </>
              )}
            </button>
          </div>

          {!showAdvancedOptions && (
            <div className="bg-white/70 rounded-lg p-3 text-sm text-gray-700 space-y-2 border border-blue-200">
              <p className="flex items-center gap-2">
                <span className="text-blue-600">🎯</span>
                <strong>Focus:</strong>{" "}
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  {formData.preferences.interests.join(", ").replace(/_/g, " ")}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-600">🚶</span>
                <strong>Pace:</strong>{" "}
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  {formData.preferences.activityLevel.replace("_", " ")}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-purple-600">🏨</span>
                <strong>Stay:</strong>{" "}
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                  {formData.preferences.accommodationType
                    .join(", ")
                    .replace(/_/g, " ")}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-orange-600">�</span>
                <strong>Transport:</strong>{" "}
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                  {formData.preferences.transportationPreference
                    .join(", ")
                    .replace(/_/g, " ")}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-red-600">🍜</span>
                <strong>Dining:</strong>{" "}
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                  {formData.preferences.diningPreference
                    .join(", ")
                    .replace(/_/g, " ")}
                </span>
              </p>
              <div className="mt-3 pt-2 border-t border-blue-200">
                <p className="text-blue-600 text-center text-xs italic">
                  👆 Click "Customize Preferences" above to modify these
                  settings
                </p>
              </div>
            </div>
          )}

          {showAdvancedOptions && (
            <div className="space-y-6 mt-4">
              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What are you interested in?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {interestOptions.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-3 rounded-lg text-xs font-medium transition-all duration-200 relative ${
                        formData.preferences.interests.includes(interest)
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-2 border-blue-600 shadow-lg"
                          : "bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {formData.preferences.interests.includes(interest) && (
                          <span className="text-white">✓</span>
                        )}
                        {interest.replace("_", " ")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Activity Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {activityLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            activityLevel: level,
                          },
                        }))
                      }
                      className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                        formData.preferences.activityLevel === level
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-2 border-blue-600 shadow-lg"
                          : "bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {formData.preferences.activityLevel === level && (
                            <span className="text-white text-xs">✓</span>
                          )}
                          <span className="text-lg">
                            {level === "LOW"
                              ? "😌"
                              : level === "MODERATE"
                              ? "🚶"
                              : "🏃"}
                          </span>
                        </div>
                        {level.replace("_", " ")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accommodation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Preferred Accommodation
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {accommodationOptions.map((accommodation) => (
                    <button
                      key={accommodation}
                      type="button"
                      onClick={() => handleAccommodationToggle(accommodation)}
                      className={`p-3 rounded-lg text-xs font-medium transition-all duration-200 relative ${
                        formData.preferences.accommodationType.includes(
                          accommodation
                        )
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-2 border-blue-600 shadow-lg"
                          : "bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {formData.preferences.accommodationType.includes(
                            accommodation
                          ) && <span className="text-white text-xs">✓</span>}
                          <span className="text-sm">
                            {accommodation === "HOTEL"
                              ? "🏨"
                              : accommodation === "HOSTEL"
                              ? "🏠"
                              : accommodation === "APARTMENT"
                              ? "🏢"
                              : accommodation === "RESORT"
                              ? "🏖️"
                              : accommodation === "BNB"
                              ? "🏡"
                              : "🏕️"}
                          </span>
                        </div>
                        {accommodation.replace("_", " ")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transportation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Preferred Transportation
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {transportationOptions.map((transport) => (
                    <button
                      key={transport}
                      type="button"
                      onClick={() => handleTransportationToggle(transport)}
                      className={`p-3 rounded-lg text-xs font-medium transition-all duration-200 relative ${
                        formData.preferences.transportationPreference.includes(
                          transport
                        )
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-2 border-blue-600 shadow-lg"
                          : "bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {formData.preferences.transportationPreference.includes(
                            transport
                          ) && <span className="text-white text-xs">✓</span>}
                          <span className="text-sm">
                            {transport === "TRAIN"
                              ? "🚂"
                              : transport === "BUS"
                              ? "🚌"
                              : transport === "CAR"
                              ? "🚗"
                              : transport === "BIKE"
                              ? "🚲"
                              : "🚶"}
                          </span>
                        </div>
                        {transport.replace("_", " ")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dining */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Dining Preferences
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {diningOptions.map((dining) => (
                    <button
                      key={dining}
                      type="button"
                      onClick={() => handleDiningToggle(dining)}
                      className={`p-3 rounded-lg text-xs font-medium transition-all duration-200 relative ${
                        formData.preferences.diningPreference.includes(dining)
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-2 border-blue-600 shadow-lg"
                          : "bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {formData.preferences.diningPreference.includes(
                            dining
                          ) && <span className="text-white text-xs">✓</span>}
                          <span className="text-sm">
                            {dining === "LOCAL"
                              ? "🍜"
                              : dining === "INTERNATIONAL"
                              ? "🌍"
                              : dining === "VEGETARIAN"
                              ? "🥗"
                              : dining === "VEGAN"
                              ? "🌱"
                              : "🌾"}
                          </span>
                        </div>
                        {dining.replace("_", " ")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Submit Button */}
        <motion.div variants={itemVariants} className="pt-6">
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ${
              loading
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating your perfect itinerary...
              </div>
            ) : (
              "✨ Generate AI Itinerary"
            )}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default AIItineraryGenerator;

import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { ImageService } from "../services/imageService";

interface LocalInsights {
  culturalEtiquette?: string[];
  transportation?: {
    localTransport?: string;
    walkingFriendliness?: string;
    taxiServices?: string;
  };
  weatherConsiderations?: string;
  bestTimeToVisit?: string;
}

interface Itinerary {
  title: string;
  totalEstimatedCost?: number;
  description?: string;
  dailyPlans: Day[];
  localInsights?: LocalInsights;
}

interface ProfessionalItineraryProps {
  itinerary: Itinerary;
  onGenerateNew: () => void;
}

interface Activity {
  name: string;
  address?: string;
  duration?: string;
  time?: string;
  type?: string;
  description?: string;
  price?: string;
}

interface Day {
  day: number;
  date?: string;
  theme?: string;
  activities: Activity[];
}

export default function ProfessionalItinerary({
  itinerary,
  onGenerateNew,
}: ProfessionalItineraryProps) {
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [activityImages, setActivityImages] = useState<Record<string, string>>(
    {}
  );

  // Get activity tag with color based on type/keywords
  const getActivityTag = (activity: Activity) => {
    const name = activity.name?.toLowerCase() || "";
    const description = activity.description?.toLowerCase() || "";
    const type = activity.type?.toLowerCase() || "";

    // Define tag categories with colors
    const tagConfig = [
      {
        keywords: [
          "museum",
          "gallery",
          "art",
          "exhibition",
          "cultural",
          "history",
        ],
        tag: "Culture",
        color: "bg-purple-500 text-white",
      },
      {
        keywords: [
          "restaurant",
          "café",
          "food",
          "dining",
          "eat",
          "meal",
          "cuisine",
        ],
        tag: "Food",
        color: "bg-orange-500 text-white",
      },
      {
        keywords: ["park", "garden", "outdoor", "nature", "walking", "hiking"],
        tag: "Nature",
        color: "bg-green-500 text-white",
      },
      {
        keywords: ["shopping", "market", "store", "boutique", "souvenir"],
        tag: "Shopping",
        color: "bg-pink-500 text-white",
      },
      {
        keywords: [
          "architecture",
          "building",
          "tower",
          "cathedral",
          "church",
          "monument",
        ],
        tag: "Architecture",
        color: "bg-blue-500 text-white",
      },
      {
        keywords: ["nightlife", "bar", "club", "evening", "night", "drinks"],
        tag: "Nightlife",
        color: "bg-indigo-500 text-white",
      },
      {
        keywords: ["beach", "water", "swimming", "seaside", "coast"],
        tag: "Beach",
        color: "bg-cyan-500 text-white",
      },
      {
        keywords: ["entertainment", "show", "theater", "performance", "music"],
        tag: "Entertainment",
        color: "bg-red-500 text-white",
      },
    ];

    const content = `${name} ${description} ${type}`;

    for (const config of tagConfig) {
      if (config.keywords.some((keyword) => content.includes(keyword))) {
        return { tag: config.tag, color: config.color };
      }
    }

    // Default tag
    return { tag: "Activity", color: "bg-gray-500 text-white" };
  };

  // Extract city name more intelligently
  const extractDestination = (title: string): string => {
    if (!title) return "destination";
    console.log(`🏙️ Extracting destination from title: "${title}"`);

    // Common city names to look for - expanded list with variants
    const cities = {
      Barcelona: ["Barcelona", "BCN"],
      Valencia: ["Valencia", "VLC"],
      Zaragoza: ["Zaragoza", "Saragossa", "ZAZ"],
      Dublin: ["Dublin", "DUB"],
      Dubai: ["Dubai", "DXB", "UAE"],
      Porto: ["Porto", "Oporto"],
      Madrid: ["Madrid", "MAD"],
      Paris: ["Paris", "Parisian"],
      Rome: ["Rome", "Roma"],
      London: ["London", "Greater London"],
      Amsterdam: ["Amsterdam", "AMS"],
      Sofia: ["Sofia", "SOF"],
      Varna: ["Varna"],
      Wrocław: ["Wrocław", "Wroclaw", "WRO"],
      Warsaw: ["Warsaw", "Warszawa", "WAW"],
      Krakow: ["Krakow", "Kraków", "KRK"],
      Prague: ["Prague", "Praha", "PRG"],
      Vienna: ["Vienna", "Wien", "VIE"],
      Berlin: ["Berlin", "BER"],
      Munich: ["Munich", "München", "MUC"],
      Budapest: ["Budapest", "BUD"],
      Brussels: ["Brussels", "BRU"],
      Milan: ["Milan", "Milano", "MXP"],
      Florence: ["Florence", "Firenze", "FLR"],
      Venice: ["Venice", "Venezia", "VCE"],
      Lisbon: ["Lisbon", "Lisboa", "LIS"],
      Seville: ["Seville", "Sevilla", "SVQ"],
      Granada: ["Granada", "GRX"],
      Copenhagen: ["Copenhagen", "København", "CPH"],
      Stockholm: ["Stockholm", "ARN"],
      Oslo: ["Oslo", "OSL"],
      Athens: ["Athens", "ATH"],
      Istanbul: ["Istanbul", "IST"],
    };

    const normalizedTitle = title.trim();

    // First try to extract city from "[City] in [Duration]" pattern (like "Oslo in Two Days")
    const cityInDurationMatch = normalizedTitle.match(
      /^([A-Z][a-zA-Z\u00C0-\u017F]+(?:\s+[A-Z][a-zA-Z\u00C0-\u017F]+)*)\s+in\s+(?:One|Two|Three|Four|Five|Six|Seven|\d+)\s+Days?/i
    );
    if (cityInDurationMatch && cityInDurationMatch[1]) {
      const extractedCity = cityInDurationMatch[1].trim();
      console.log(`Found city "${extractedCity}" using "City in Duration" pattern`);
      return extractedCity;
    }

    // Then try to extract city from general "in [City]" pattern (but exclude duration words)
    const inCityMatch = normalizedTitle.match(
      /\bin\s+([A-Z][a-zA-Z\u00C0-\u017F]+(?:\s+[A-Z][a-zA-Z\u00C0-\u017F]+)*)/
    );
    if (inCityMatch && inCityMatch[1]) {
      const extractedCity = inCityMatch[1].trim();
      // Skip if it's a duration word
      if (!/^(?:One|Two|Three|Four|Five|Six|Seven|\d+)\s*Days?$/i.test(extractedCity)) {
        console.log(`Found city "${extractedCity}" using "in City" pattern`);
        return extractedCity;
      }
    }

    // Then try to find exact city names or their variants
    for (const [cityName, variants] of Object.entries(cities)) {
      if (
        variants.some((variant) => {
          const variantLower = variant.toLowerCase();
          const titleLower = normalizedTitle.toLowerCase();

          // Use word boundaries for better matching to avoid partial matches
          // Check for exact match or match with word boundaries
          return (
            titleLower === variantLower ||
            titleLower.includes(` ${variantLower} `) ||
            titleLower.startsWith(`${variantLower} `) ||
            titleLower.endsWith(` ${variantLower}`) ||
            (variant.length > 3 && titleLower.includes(variantLower))
          ); // Only allow substring match for longer names
        })
      ) {
        console.log(`Found city "${cityName}" in known city list`);
        return cityName;
      }
    }

    // If no exact match, try more aggressive extraction
    let extracted = normalizedTitle;

    // Remove common title patterns
    extracted = extracted.replace(/^(?:a|an|the)?\s*(?:relaxed?|amazing?|perfect)?\s*/i, ""); // Remove articles and adjectives
    extracted = extracted.replace(/^(\d+)[-\s]?days?\s+(?:in\s+)?/i, ""); // "3 Days in" or "2-Day"
    extracted = extracted.split(/[:\-–—]/)[0].trim(); // Split on punctuation

    // Remove descriptive phrases
    const removePatterns = [
      /^(?:discover|explore|experience|visit)\s+/i,
      /\s+(?:trip|tour|adventure|journey|experience|guide|itinerary).*$/i,
      /'s\s+.*$/i, // Possessive forms
      /\s+(?:city\s+break|weekend|getaway).*$/i,
      /\s+(?:sightseeing|cultural).*$/i, // Remove sightseeing and cultural suffixes
      /^(?:the\s+|a\s+|an\s+)/i,
    ];

    removePatterns.forEach((pattern) => {
      extracted = extracted.replace(pattern, "");
    });

    // Check if the cleaned up text matches any city variants
    for (const [cityName, variants] of Object.entries(cities)) {
      if (
        variants.some((variant) => {
          const variantLower = variant.toLowerCase();
          const extractedLower = extracted.toLowerCase();

          // Use word boundaries for better matching to avoid partial matches
          return (
            extractedLower === variantLower ||
            extractedLower.includes(` ${variantLower} `) ||
            extractedLower.startsWith(`${variantLower} `) ||
            extractedLower.endsWith(` ${variantLower}`) ||
            (variant.length > 3 && extractedLower.includes(variantLower))
          );
        })
      ) {
        return cityName;
      }
    }

    // If we still have text, use the first significant word
    const words = extracted.split(/\s+/);
    console.log(`🔍 Words after extraction: [${words.join(', ')}]`);
    const significantWord = words.find(
      (word) => word.length > 2 && /^[A-Z]/.test(word)
    );
    console.log(`🎯 Found significant word: "${significantWord}"`);
    if (significantWord) {
      return significantWord;
    }

    return "destination";
  };

  const destination = useMemo(() => extractDestination(itinerary.title), [itinerary.title]);
  const days = useMemo(
    () => itinerary?.dailyPlans || [],
    [itinerary?.dailyPlans]
  );

  // Load city gallery and activity images
  useEffect(() => {
    const loadActivityImages = async () => {
      // Get city gallery first
      setGalleryLoading(true);
      try {
        // Make sure we have a valid city name before requesting images
        if (
          !destination ||
          destination === "destination" ||
          destination === "European"
        ) {
          console.log("No valid city name found, skipping gallery load");
          return;
        }
        console.log(`Loading gallery for: ${destination}`);
        const cityImages = await ImageService.getCityGallery(destination);
        setGalleryImages(cityImages.slice(0, 3)); // Keep top 3 for gallery display

        // Collect all activities from all days
        const allActivities = days.flatMap((day: Day) => day.activities || []);

        if (allActivities.length > 0) {
          // Start loading activity images in parallel (non-blocking)
          setGalleryLoading(false); // Allow city gallery to show immediately

          console.log(
            `🚀 Setting up lazy loading for ${allActivities.length} activities`
          );

          // Track which activities are being loaded
          const loadingActivities = new Set<string>();

          // Create a single observer for all activities (memoized to prevent recreation)
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                const activityName = entry.target.getAttribute("data-activity");
                if (!activityName) return;

                // Skip if already loaded or currently loading
                if (
                  activityImages[activityName] ||
                  loadingActivities.has(activityName)
                ) {
                  observer.unobserve(entry.target);
                  return;
                }

                // Double-check after intersection to prevent race conditions
                if (activityImages[activityName]) {
                  observer.unobserve(entry.target);
                  return;
                }

                if (entry.isIntersecting) {
                  // Mark as loading to prevent duplicate requests
                  loadingActivities.add(activityName);

                  // Clean activity name before sending to image service
                  const cleanActivityName = activityName
                    .split(/\s+A Day/i)[0]
                    .trim();

                  // Load image
                  ImageService.getActivityImage(
                    cleanActivityName,
                    "", // address will be added when needed
                    destination
                  )
                    .then((result) => {
                      if (result) {
                        setActivityImages((prev) => ({
                          ...prev,
                          [activityName]: result,
                        }));
                        console.log(
                          `Loaded image for ${activityName}:`,
                          result
                        );
                      }
                      // Remove from loading set once complete
                      loadingActivities.delete(activityName);
                      observer.unobserve(entry.target);
                    })
                    .catch((error) => {
                      console.error(
                        `Error loading image for ${activityName}:`,
                        error
                      );
                      loadingActivities.delete(activityName);
                      observer.unobserve(entry.target);
                    });
                }
              });
            },
            {
              rootMargin: "100px 0px", // Increased margin for earlier loading
              threshold: 0.1,
            }
          );

          // Set up observers for each activity
          allActivities.forEach((activity) => {
            if (activity.name) {
              const element = document.querySelector(
                `[data-activity="${activity.name}"]`
              );
              if (element && !activityImages[activity.name]) {
                observer.observe(element);
              }
            }
          });

          // Cleanup function
          return () => {
            observer.disconnect();
            loadingActivities.clear();
          };
        } else {
          setGalleryLoading(false);
        }
      } catch (error) {
        console.error("Error loading city images:", error);
        setGalleryImages([]);
      } finally {
        setGalleryLoading(false);
      }
    };

    if (destination && days.length > 0) {
      loadActivityImages();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, days]); // Intentionally omitting activityImages to prevent infinite loop

  return (
    <section className="mb-24 relative">
      <motion.div
        className="bg-white rounded-3xl shadow-2xl max-w-6xl mx-auto overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* City Gallery Section - Only show if Freepik images available */}
        {galleryImages.length > 0 && (
          <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
            {galleryLoading ? (
              <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
                <div className="col-span-2 aspect-[4/3] bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="grid grid-rows-2 gap-4">
                  <div className="aspect-[4/3] bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="aspect-[4/3] bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
                {galleryImages[0] && (
                  <motion.div className="col-span-2 aspect-[4/3] overflow-hidden rounded-lg shadow-lg">
                    <img
                      src={galleryImages[0]}
                      alt={`${destination} main view`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}
                <div className="grid grid-rows-2 gap-4">
                  {galleryImages[1] && (
                    <motion.div className="aspect-[4/3] overflow-hidden rounded-lg shadow-md">
                      <img
                        src={galleryImages[1]}
                        alt={`${destination} view 2`}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  )}
                  {galleryImages[2] && (
                    <motion.div className="aspect-[4/3] overflow-hidden rounded-lg shadow-md">
                      <img
                        src={galleryImages[2]}
                        alt={`${destination} view 3`}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Trip Details */}
        <div className="px-8 py-8 bg-white">
          <div className="max-w-4xl mx-auto text-center mb-6">
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium border border-blue-200">
                🏛️ Cultural
              </span>
              <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium border border-purple-200">
                👥 Couple
              </span>
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium border border-green-200">
                💰 Mid-range
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {itinerary?.title || `${days.length}-Day ${destination} Adventure`}
            </h2>

            <div className="text-lg text-gray-700 mt-2 font-semibold">
              Total budget:{" "}
              <span className="text-green-600">
                ${itinerary?.totalEstimatedCost ?? "—"}
              </span>
            </div>
          </div>

          <div className="prose prose-lg max-w-none text-gray-800">
            <p className="text-lg font-medium leading-relaxed">
              {itinerary?.description ||
                `Embark on a journey through ${destination} rich history.`}
            </p>
          </div>
        </div>
        {/* Daily Itinerary */}
        <div className="p-8">
          <div className="space-y-8">
            {days.map((day: Day, dayIndex: number) => (
              <motion.div
                key={dayIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.06 }}
                className="border border-gray-200 rounded-2xl overflow-hidden bg-white"
              >
                <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 p-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                      {day.day}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        Day {day.day}
                      </h3>
                      <p className="text-blue-100 text-lg font-medium">
                        {day.date}
                      </p>
                      {day.theme && (
                        <p className="text-blue-100 mt-1 italic">
                          "{day.theme}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-6">
                    {["Morning", "Afternoon", "Evening"].map((period) => {
                      const periodIcon =
                        period === "Morning"
                          ? "🌅"
                          : period === "Afternoon"
                          ? "☀️"
                          : "🌆";

                      // Take up to 6 activities total per day and filter by period using simple time prefixes.
                      const allActivities = (day.activities || []).slice(0, 6);
                      const timeRanges =
                        period === "Morning"
                          ? ["06", "07", "08", "09", "10", "11"]
                          : period === "Afternoon"
                          ? ["12", "13", "14", "15", "16", "17"]
                          : ["18", "19", "20", "21", "22", "23"];

                      let periodActivities = allActivities.filter(
                        (activity: Activity) =>
                          timeRanges.some((t) =>
                            String(activity.time || "").startsWith(t)
                          )
                      );

                      // Limit each period to maximum 2 activities
                      periodActivities = periodActivities.slice(0, 2);

                      // Skip empty periods entirely - AI must generate all activities
                      if (periodActivities.length === 0) {
                        return null;
                      }

                      return (
                        <div key={period} className="space-y-4">
                          <h4 className="text-xl font-bold text-gray-900 flex items-center gap-3 border-l-4 border-blue-500 pl-4 py-2 bg-gradient-to-r from-blue-50 to-transparent">
                            <span className="text-2xl">{periodIcon}</span>
                            <span>{period}</span>
                          </h4>

                          {periodActivities.map(
                            (activity: Activity, actIdx: number) => {
                              const activityTag = getActivityTag(activity);
                              return (
                                <div
                                  key={actIdx}
                                  className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                >
                                  {/* Mobile Layout: Stack vertically */}
                                  <div className="flex flex-col md:flex-row gap-4">
                                    {/* Time always at top on mobile, left on desktop */}
                                    <div className="flex-shrink-0 text-center md:text-left md:w-20">
                                      <div className="text-blue-600 font-bold text-lg">
                                        {activity.time}
                                      </div>
                                      {activity.duration && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {activity.duration}
                                        </div>
                                      )}
                                    </div>

                                    {/* Activity image with placeholder */}
                                    <div
                                      className="w-full md:w-auto md:flex-shrink-0 self-center md:self-start relative"
                                      data-activity={activity.name
                                        .split(/\s+A Day/i)[0]
                                        .trim()}
                                    >
                                      <div className="w-full h-64 md:w-62 md:h-47 relative">

                                        {/* Lazy loaded image with loading states */}
                                        {activityImages[activity.name] ? (
                                          <img
                                            src={activityImages[activity.name]}
                                            alt={activity.name || "Activity"}
                                            className="absolute inset-0 w-full h-full object-contain mx-auto md:mx-0 transition-opacity duration-500 opacity-100"
                                            loading="lazy"
                                            onLoad={(e) => {
                                              // Add opacity transition
                                              e.currentTarget.style.opacity = "1";
                                            }}
                                            style={{ opacity: 0 }} // Start transparent
                                          />
                                        ) : (
                                          // Show pulsing loading state
                                          <div className="absolute inset-0 w-full h-full bg-gray-200 rounded-lg animate-pulse"></div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Text content */}
                                    <div className="flex-grow">
                                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                                        <h5 className="font-bold text-gray-900 text-lg">
                                          {activity.name}
                                        </h5>
                                        <span
                                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${activityTag.color} flex-shrink-0`}
                                        >
                                          {activityTag.tag}
                                        </span>
                                      </div>
                                      {activity.address && (
                                        <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                                          <span className="text-gray-400">
                                            📍
                                          </span>
                                          {activity.address}
                                        </p>
                                      )}
                                      <p className="text-gray-800 leading-relaxed font-medium">
                                        {activity.description}
                                      </p>
                                      {activity.price && (
                                        <p className="text-green-600 font-semibold mt-2">
                                          💰 {activity.price}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Generate New Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={onGenerateNew}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center gap-2"
            >
              <span>Generate New Itinerary</span>
              <span className="text-xl">✨</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Travel Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="mt-8"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
            Travel Information
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Cultural Etiquette */}
            <div className="bg-gradient-to-br from-pink-50 to-red-50 p-6 rounded-xl border border-pink-100">
              <h3 className="text-xl font-bold text-pink-700 mb-4 flex items-center gap-2">
                <span className="text-2xl">🤝</span>
                Cultural Etiquette
              </h3>
              <ul className="text-gray-700 space-y-2">
                {itinerary.localInsights?.culturalEtiquette
                  ?.slice(0, 2)
                  .map((tip: string, index: number) => (
                    <li key={index}>• {tip}</li>
                  )) || [
                  <li key={0}>
                    • Dress modestly when visiting religious sites
                  </li>,
                  <li key={1}>• Tipping 10-15% is customary at restaurants</li>,
                ]}
              </ul>
            </div>

            {/* Transportation */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
              <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
                <span className="text-2xl">🚌</span>
                Transportation
              </h3>
              <ul className="text-gray-700 space-y-2">
                <li>
                  •{" "}
                  <strong>
                    {itinerary.localInsights?.transportation?.localTransport ||
                      "Metro/Subway:"}
                  </strong>{" "}
                  {itinerary.localInsights?.transportation?.localTransport
                    ? ""
                    : "Most efficient for city travel"}
                </li>
                <li>
                  • <strong>Walking:</strong>{" "}
                  {itinerary.localInsights?.transportation
                    ?.walkingFriendliness ||
                    "Best way to explore neighborhoods"}
                </li>
                <li>
                  • <strong>Taxis:</strong>{" "}
                  {itinerary.localInsights?.transportation?.taxiServices ||
                    "Convenient but pricier option"}
                </li>
              </ul>
            </div>

            {/* Weather Considerations */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
              <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                <span className="text-2xl">🌦️</span>
                Weather Considerations
              </h3>
              <div className="text-gray-700 space-y-2">
                <p>
                  {itinerary.localInsights?.weatherConsiderations ||
                    "Pack layers for temperature changes and bring comfortable walking shoes."}
                </p>
                <p>
                  {itinerary.localInsights?.bestTimeToVisit
                    ? `Best time: ${itinerary.localInsights.bestTimeToVisit}`
                    : "Check forecast before outdoor activities and carry sun protection."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

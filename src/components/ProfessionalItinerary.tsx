import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { ImageService } from "../services/imageService";

interface ProfessionalItineraryProps {
  itinerary: any;
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

    // Common city names to look for
    const cities = [
      "Barcelona",
      "Valencia",
      "Dublin",
      "Porto",
      "Madrid",
      "Paris",
      "Rome",
      "London",
      "Amsterdam",
    ];

    // Check if any city name is mentioned in the title
    for (const city of cities) {
      if (title.toLowerCase().includes(city.toLowerCase())) {
        return city;
      }
    }

    // Fallback: take everything before the first colon and clean it
    let extracted = title.split(":")[0].trim();

    // Remove possessive forms like "Barcelona's Soul" -> "Barcelona"
    extracted = extracted.replace(/'s\s+\w+$/i, "");

    return extracted || "destination";
  };

  const destination = extractDestination(itinerary.title);
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
        console.log(`Loading gallery for: ${destination}`);
        const cityImages = await ImageService.getCityGallery(destination);
        setGalleryImages(cityImages.slice(0, 3)); // Keep top 3 for gallery display

        // Collect all activities from all days
        const allActivities = days.flatMap((day: Day) => day.activities || []);

        if (allActivities.length > 0) {
          // Start loading activity images in parallel (non-blocking)
          setGalleryLoading(false); // Allow city gallery to show immediately

          console.log(
            `🚀 Starting parallel image fetch for ${allActivities.length} activities`
          );

          // Create parallel promises for all activity images
          const imagePromises = allActivities.map(
            async (activity: Activity) => {
              if (activity?.name) {
                try {
                  const activityImage = await ImageService.getActivityImage(
                    activity.name,
                    activity.address || ""
                  );
                  return { name: activity.name, image: activityImage };
                } catch (error) {
                  console.error(
                    `Error fetching image for ${activity.name}:`,
                    error
                  );
                  return { name: activity.name, image: null };
                }
              }
              return { name: null, image: null };
            }
          );

          // Execute all image fetches in parallel
          Promise.all(imagePromises)
            .then((results) => {
              const newActivityImages: Record<string, string> = {};
              let successCount = 0;

              results.forEach((result) => {
                if (result.name && result.image) {
                  newActivityImages[result.name] = result.image;
                  successCount++;
                }
              });

              setActivityImages(newActivityImages);
              console.log(
                `📸 Parallel fetch complete: ${successCount}/${allActivities.length} activity images loaded`
              );
            })
            .catch((error) => {
              console.error("Error in parallel image fetching:", error);
            });
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
  }, [destination, days]);

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
              {days.length}-Day {destination} Adventure
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

                                    {/* Image on top for mobile, side for desktop */}
                                    {activityImages[activity.name] && (
                                      <div className="flex-shrink-0 self-center md:self-start">
                                        <img
                                          src={activityImages[activity.name]}
                                          alt={activity.name || "Activity"}
                                          className="w-full max-w-sm md:w-48 md:h-36 h-48 object-cover rounded-lg shadow-md mx-auto md:mx-0"
                                          loading="lazy"
                                        />
                                      </div>
                                    )}

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
        </div>
      </motion.div>
    </section>
  );
}

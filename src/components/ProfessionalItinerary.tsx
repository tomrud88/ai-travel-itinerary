import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { ImageService } from "../services/imageService";

interface ProfessionalItineraryProps {
  itinerary: any;
  onGenerateNew: () => void;
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
        const allActivities = days.flatMap((day: any) => day.activities || []);

        if (cityImages.length > 0 && allActivities.length > 0) {
          // Distribute city images across activities
          const distributedImages = ImageService.distributeCityImages(
            cityImages,
            allActivities.length
          );

          // Assign images to activities
          const newActivityImages: Record<string, string> = {};
          allActivities.forEach((activity: any, index: number) => {
            if (activity?.name && distributedImages[index]) {
              newActivityImages[activity.name] = distributedImages[index];
            }
          });

          setActivityImages(newActivityImages);
          console.log(
            `� Assigned images to ${
              Object.keys(newActivityImages).length
            } activities`
          );
        } else {
          console.log(`📷 No city images available for distribution`);
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
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              🏛️ Discover {destination}
            </h3>
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

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              {days.length}-Day {destination} Trip
            </h2>

            <div className="text-sm text-gray-600 mt-1">
              Total budget: ${itinerary?.totalEstimatedCost ?? "—"}
            </div>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              {itinerary?.description ||
                `Embark on a journey through ${destination} rich history.`}
            </p>
          </div>
        </div>
        {/* Daily Itinerary */}
        <div className="p-8">
          <div className="space-y-8">
            {days.map((day: any, dayIndex: number) => (
              <motion.div
                key={dayIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.06 }}
                className="border border-gray-200 rounded-2xl overflow-hidden bg-white"
              >
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
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
                        (activity: any) =>
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
                          <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-200 pb-2">
                            <span>{periodIcon}</span>
                            <span>{period}</span>
                          </h4>

                          {periodActivities.map(
                            (activity: any, actIdx: number) => (
                              <div
                                key={actIdx}
                                className="p-4 rounded-xl bg-gray-50"
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
                                        className="w-full max-w-xs md:w-32 md:h-32 h-48 object-cover rounded-lg shadow-sm mx-auto md:mx-0"
                                        loading="lazy"
                                      />
                                    </div>
                                  )}

                                  {/* Text content */}
                                  <div className="flex-grow">
                                    <h5 className="font-bold text-gray-900 text-lg mb-2">
                                      {activity.name}
                                    </h5>
                                    {activity.address && (
                                      <p className="text-sm text-gray-600 mb-2">
                                        📍 {activity.address}
                                      </p>
                                    )}
                                    <p className="text-gray-700 leading-relaxed">
                                      {activity.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
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

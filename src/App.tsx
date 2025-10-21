import { useState } from "react";
import { motion } from "framer-motion";
import AIItineraryGenerator from "./components/AI/AIItineraryGenerator";
import ProfessionalItinerary from "./components/ProfessionalItinerary";
import type { AIItineraryRequest, AIGeneratedItinerary } from "./types";
import { AITravelService } from "./services/aiService";

const mockDestinations = [
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    imageUrl:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    description:
      "Experience the perfect blend of traditional culture and cutting-edge technology in Japan's vibrant capital.",
    highlights: [
      "Cherry blossoms in spring",
      "Ancient temples and shrines",
      "World-class cuisine",
      "Neon-lit districts",
    ],
    bestTimeToVisit: "March-May, September-November",
  },
  {
    id: "paris",
    name: "Paris",
    country: "France",
    imageUrl:
      "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&q=80",
    description:
      "The City of Light offers romance, art, fashion, and cuisine in an enchanting European setting.",
    highlights: [
      "Eiffel Tower views",
      "World-renowned museums",
      "Charming neighborhoods",
      "Café culture",
    ],
    bestTimeToVisit: "April-June, September-October",
  },
  {
    id: "santorini",
    name: "Santorini",
    country: "Greece",
    imageUrl:
      "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80",
    description:
      "Discover stunning sunsets, white-washed buildings, and crystal-clear waters in this Greek island paradise.",
    highlights: [
      "Iconic blue domes",
      "Volcanic beaches",
      "Wine tasting",
      "Sunset in Oia",
    ],
    bestTimeToVisit: "April-June, September-October",
  },
  {
    id: "dubai",
    name: "Dubai",
    country: "UAE",
    imageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    description:
      "A modern metropolis where luxury meets innovation, featuring stunning architecture and world-class shopping.",
    highlights: [
      "Burj Khalifa",
      "Luxury shopping",
      "Desert safaris",
      "Modern architecture",
    ],
    bestTimeToVisit: "November-March",
  },
  {
    id: "bali",
    name: "Bali",
    country: "Indonesia",
    imageUrl:
      "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&q=80",
    description:
      "An island paradise offering spiritual retreats, stunning beaches, and lush landscapes.",
    highlights: [
      "Ancient temples",
      "Rice terraces",
      "Beach clubs",
      "Yoga retreats",
    ],
    bestTimeToVisit: "April-September",
  },
  {
    id: "newyork",
    name: "New York",
    country: "USA",
    imageUrl:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
    description:
      "The city that never sleeps offers endless entertainment, culture, and culinary experiences.",
    highlights: [
      "Times Square",
      "Central Park",
      "Broadway shows",
      "World-class museums",
    ],
    bestTimeToVisit: "April-June, September-November",
  },
];

function App() {
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] =
    useState<AIGeneratedItinerary | null>(null);
  const aiService = new AITravelService();

  const handleDestinationClick = (destinationId: string) => {
    console.log("Destination clicked:", destinationId);
  };

  const handleGenerateItinerary = async (request: AIItineraryRequest) => {
    setIsGeneratingItinerary(true);
    try {
      console.log("Generating itinerary with request:", request);

      const result = await aiService.generateItinerary(request);
      console.log("AI Service result:", result);

      if (result && result.itinerary) {
        console.log("📱 App received itinerary:", result.itinerary);
        console.log(
          "📱 First activity name in App:",
          result.itinerary.dailyPlans?.[0]?.activities?.[0]?.name
        );
        setGeneratedItinerary(result.itinerary);
      } else {
        console.error("No result or itinerary from AI service");
      }
    } catch (error) {
      console.error("Error generating itinerary:", error);
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-3/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-3/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -120, 0],
            y: [0, 120, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <main className="relative z-10">
        {/* Hero Section */}
        <motion.section
          className="min-h-screen flex items-center justify-center text-center px-6 md:px-12 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="inline-block p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl mb-8"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2,
              }}
            >
              <div className="text-6xl">✈️</div>
            </motion.div>

            <motion.h1
              className="text-6xl md:text-8xl font-bold mb-8 leading-tight"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Travel
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                Guide
              </span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed max-w-4xl mx-auto"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Discover your next adventure with AI-powered travel
              recommendations. Get personalized itineraries, hidden gems, and
              insider tips for unforgettable journeys around the world. 🌍
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <motion.button
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-cyan-500/25 transform transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  document
                    .querySelector("#ai-generator")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                🤖 Start AI Planning
              </motion.button>
              <motion.button
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transform transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  document
                    .querySelector("#destinations")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                🌟 Explore Destinations
              </motion.button>
            </motion.div>
          </div>
        </motion.section>

        {/* AI Itinerary Generator Section */}
        <section id="ai-generator" className="py-24 px-6 md:px-12">
          <motion.div
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-16">
              <motion.div
                className="inline-block p-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-3xl mb-8"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                viewport={{ once: true }}
              >
                <div className="text-5xl">🤖</div>
              </motion.div>

              <h2 className="text-5xl md:text-6xl font-bold mb-8 text-white relative">
                <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  AI-Powered Trip Planning
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                Tell our AI assistant about your dream trip, and watch as it
                creates a personalized itinerary tailored just for you. From
                hidden gems to popular attractions, we've got you covered! 🎯
              </p>
            </div>

            <AIItineraryGenerator
              onGenerate={handleGenerateItinerary}
              loading={isGeneratingItinerary}
            />
          </motion.div>
        </section>

        {/* Generated Itinerary Display - Professional Style */}
        {generatedItinerary && (
          <ProfessionalItinerary
            itinerary={generatedItinerary}
            onGenerateNew={() => setGeneratedItinerary(null)}
          />
        )}

        {/* Popular Destinations */}
        <section id="destinations" className="mb-24 py-24 px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-8 text-white relative">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                🌟 Popular Destinations
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
              Explore these amazing places that travelers love. Each destination
              offers unique experiences and unforgettable memories. ✈️
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
            {mockDestinations.map((destination, index) => (
              <motion.div
                key={destination.id}
                className="group relative bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl cursor-pointer border border-white/30"
                onClick={() => handleDestinationClick(destination.id)}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
                viewport={{ once: true }}
                whileHover={{
                  scale: 1.03,
                  rotateY: 5,
                  transition: { duration: 0.3 },
                }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Image with overlay */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 h-56">
                  <img
                    src={destination.imageUrl}
                    alt={`${destination.name}, ${destination.country}`}
                    className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:from-black/40 transition-all duration-300" />
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-medium">
                    {destination.country}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 text-gray-800">
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">
                    {destination.name}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {destination.description}
                  </p>

                  {/* Highlights */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">
                      ✨ Highlights:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {destination.highlights
                        .slice(0, 3)
                        .map((highlight, idx) => (
                          <span
                            key={idx}
                            className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                          >
                            {highlight}
                          </span>
                        ))}
                      {destination.highlights.length > 3 && (
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                          +{destination.highlights.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Best time to visit */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>🗓️</span>
                    <span>
                      <strong>Best time:</strong> {destination.bestTimeToVisit}
                    </span>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-24 py-24 px-6 md:px-12">
          <motion.div
            className="max-w-6xl mx-auto text-center"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-8 text-white relative">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                🚀 Why Choose Our AI Guide?
              </span>
            </h2>
            <p className="text-xl text-blue-100 mb-16 max-w-4xl mx-auto">
              Experience the future of travel planning with our cutting-edge AI
              technology.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: "🎯",
                  title: "Personalized Recommendations",
                  description:
                    "Get custom itineraries based on your preferences, budget, and travel style.",
                },
                {
                  icon: "⚡",
                  title: "Instant Planning",
                  description:
                    "Generate complete trip plans in seconds, not hours of research.",
                },
                {
                  icon: "🗺️",
                  title: "Hidden Gems",
                  description:
                    "Discover local secrets and off-the-beaten-path destinations.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                  viewport={{ once: true }}
                  whileHover={{
                    scale: 1.05,
                    transition: { duration: 0.2 },
                  }}
                >
                  <div className="text-6xl mb-6">{feature.icon}</div>
                  <h3 className="text-2xl font-bold mb-4 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-blue-100 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="bg-white/10 backdrop-blur-sm mt-20 py-8 text-center border-t border-white/20">
        <p className="text-white font-medium">
          Made with ❤️ for travelers by AI Travel Guide
        </p>
      </footer>
    </div>
  );
}

export default App;

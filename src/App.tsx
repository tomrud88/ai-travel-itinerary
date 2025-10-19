import { motion } from "framer-motion";

// Mock data for demonstration
const mockDestinations = [
  {
    id: "1",
    name: "Paris",
    country: "France",
    description:
      "The City of Light, known for its art, fashion, gastronomy and culture. Home to iconic landmarks like the Eiffel Tower and Louvre Museum.",
    imageUrl: "https://picsum.photos/500/300?random=1",
    rating: 4.8,
    priceRange: "Mid-Range",
    highlights: ["🗼 Eiffel Tower", "🎨 Louvre Museum", "🥐 French Cuisine"],
  },
  {
    id: "2",
    name: "Tokyo",
    country: "Japan",
    description:
      "A bustling metropolis blending ultra-modern and traditional. Experience cutting-edge technology alongside ancient temples.",
    imageUrl:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&h=300&fit=crop",
    rating: 4.9,
    priceRange: "Luxury",
    highlights: [
      "🏯 Ancient Temples",
      "🍣 Sushi Culture",
      "🌸 Cherry Blossoms",
    ],
  },
  {
    id: "3",
    name: "Bali",
    country: "Indonesia",
    description:
      "Tropical paradise with beautiful beaches, ancient temples, and lush rice terraces. Perfect for relaxation and adventure.",
    imageUrl:
      "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=500&h=300&fit=crop",
    rating: 4.7,
    priceRange: "Budget",
    highlights: ["🏖️ Pristine Beaches", "🌾 Rice Terraces", "🧘 Yoga Retreats"],
  },
];

function App() {
  const handleDestinationClick = (destinationId: string) => {
    console.log("Clicked destination:", destinationId);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-50 py-6 border-b border-white/20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex justify-between items-center">
            <motion.div
              className="flex items-center gap-4 text-2xl font-bold text-blue-600"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-lg shadow-2xl">
                  ✈️
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TravelAI
              </span>
            </motion.div>

            <nav className="hidden md:flex gap-8 items-center">
              <motion.a
                href="#destinations"
                className="relative text-gray-700 font-medium hover:text-blue-500 transition-all duration-300 group"
                whileHover={{ y: -2 }}
              >
                🌍 Destinations
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </motion.a>
              <motion.a
                href="#itineraries"
                className="relative text-gray-700 font-medium hover:text-blue-500 transition-all duration-300 group"
                whileHover={{ y: -2 }}
              >
                📋 My Trips
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </motion.a>
              <motion.a
                href="#about"
                className="relative text-gray-700 font-medium hover:text-blue-500 transition-all duration-300 group"
                whileHover={{ y: -2 }}
              >
                ℹ️ About
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </motion.a>
              <motion.button
                className="btn-gradient relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">✨ Get Started</span>
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full transition-transform duration-700 hover:translate-x-full"></div>
              </motion.button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <div className="max-w-6xl mx-auto px-5">
          {/* Hero Section */}
          <section className="text-center mb-20 text-white relative">
            {/* Floating elements */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-32 right-20 w-16 h-16 bg-purple-400/20 rounded-full blur-lg animate-pulse delay-300"></div>
            <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-pink-400/20 rounded-full blur-md animate-pulse delay-700"></div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10"
            >
              <motion.h1
                className="text-5xl md:text-7xl font-extrabold mb-8 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                Plan Your Perfect Journey
              </motion.h1>

              <motion.p
                className="text-xl md:text-2xl mb-10 opacity-95 max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                🌟 Discover amazing destinations and create personalized
                itineraries with the power of AI. Your dream vacation is just a
                few clicks away! 🌟
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex justify-center items-center"
              >
                <motion.button
                  className="btn-gradient text-xl px-10 py-5 relative overflow-hidden group"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10">🚀 Start Planning Now</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.button>
              </motion.div>

              {/* Stats */}
              <motion.div
                className="flex justify-center gap-8 mt-16 text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                  <div className="text-2xl font-bold">10K+</div>
                  <div className="text-sm opacity-80">🌍 Destinations</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                  <div className="text-2xl font-bold">50K+</div>
                  <div className="text-sm opacity-80">✈️ Happy Travelers</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                  <div className="text-2xl font-bold">4.9⭐</div>
                  <div className="text-sm opacity-80">📱 App Rating</div>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* AI Generator Section */}
          <section className="mb-24 relative">
            {/* Background decoration */}
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>

            <motion.div
              className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl max-w-5xl mx-auto border border-white/30 relative overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              {/* Decorative corner elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 opacity-50 rounded-bl-full"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-100 to-yellow-100 opacity-50 rounded-tr-full"></div>

              <div className="text-center mb-12 relative z-10">
                <motion.div
                  className="inline-block p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl mb-6"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-4xl">🤖</div>
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  AI Travel Planner
                </h2>
                <p className="text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed">
                  Tell us your preferences and let our advanced AI create the
                  perfect itinerary tailored just for you! 🎯
                </p>
              </div>

              <form className="space-y-8 relative z-10">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <label className="flex items-center gap-3 mb-4 text-lg font-semibold text-gray-700">
                    🌍 Where do you want to go?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-8 py-5 border-2 border-gray-200 rounded-2xl text-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                      placeholder="Enter your dream destination ✨"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl">
                      🔍
                    </div>
                  </div>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    viewport={{ once: true }}
                  >
                    <label className="flex items-center gap-3 mb-4 text-lg font-semibold text-gray-700">
                      📅 Duration (days)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full px-8 py-5 border-2 border-gray-200 rounded-2xl text-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                        defaultValue="7"
                        min="1"
                        max="30"
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xl">
                        ⏰
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    viewport={{ once: true }}
                  >
                    <label className="flex items-center gap-3 mb-4 text-lg font-semibold text-gray-700">
                      💰 Budget ($)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full px-8 py-5 border-2 border-gray-200 rounded-2xl text-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                        defaultValue="1000"
                        min="100"
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xl">
                        💵
                      </div>
                    </div>
                  </motion.div>
                </div>

                <motion.button
                  type="submit"
                  className="w-full btn-gradient text-xl py-6 rounded-2xl font-bold relative overflow-hidden group shadow-2xl"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    ✨ Generate AI Itinerary 🚀
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </motion.button>
              </form>
            </motion.div>
          </section>

          {/* Popular Destinations */}
          <section className="mb-24">
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
                Explore these amazing places that travelers love. Each
                destination offers unique experiences and unforgettable
                memories. ✈️
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
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
                      loading="eager"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      onLoad={() => {
                        console.log(
                          `Image loaded successfully for ${destination.name}`
                        );
                      }}
                    />
                    {/* Fallback content when image fails */}
                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl opacity-50">
                      {destination.name}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                    {/* Floating rating badge */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                      <span className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                        ⭐ {destination.rating}
                      </span>
                    </div>

                    {/* Price badge */}
                    <div className="absolute top-4 left-4">
                      <span
                        className={`px-4 py-2 rounded-full text-xs font-bold shadow-lg ${
                          destination.priceRange === "Budget"
                            ? "bg-green-100 text-green-700"
                            : destination.priceRange === "Mid-Range"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {destination.priceRange === "Budget"
                          ? "💰"
                          : destination.priceRange === "Mid-Range"
                          ? "💎"
                          : "👑"}{" "}
                        {destination.priceRange}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-2xl font-bold text-gray-800">
                        {destination.name}
                      </h3>
                      <span className="text-lg">
                        {destination.country === "France"
                          ? "🇫🇷"
                          : destination.country === "Japan"
                          ? "🇯🇵"
                          : "🇮🇩"}
                      </span>
                    </div>

                    <p className="text-gray-500 text-sm mb-2 font-medium flex items-center gap-2">
                      📍 {destination.country}
                    </p>

                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                      {destination.description}
                    </p>

                    {/* Highlights */}
                    <div className="space-y-2 mb-6">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Top Highlights
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {destination.highlights.map((highlight, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action button */}
                    <motion.button
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      🎒 Explore Destination
                    </motion.button>
                  </div>

                  {/* Decorative corner */}
                  <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-blue-100 to-purple-100 opacity-20 rounded-tl-full"></div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Features Section */}
          <section className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-5xl md:text-6xl font-bold mb-8 text-white">
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  🌟 Why Choose TravelAI?
                </span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[
                {
                  icon: "🤖",
                  title: "AI-Powered Planning",
                  description:
                    "Let artificial intelligence create personalized itineraries based on your preferences and interests.",
                  gradient: "from-blue-500 to-cyan-500",
                  bgGradient: "from-blue-50 to-cyan-50",
                },
                {
                  icon: "🗺️",
                  title: "Interactive Maps",
                  description:
                    "Visualize your journey with beautiful, interactive maps and route planning.",
                  gradient: "from-green-500 to-emerald-500",
                  bgGradient: "from-green-50 to-emerald-50",
                },
                {
                  icon: "💾",
                  title: "Save & Share",
                  description:
                    "Save your itineraries and share them with friends and family for collaborative planning.",
                  gradient: "from-purple-500 to-pink-500",
                  bgGradient: "from-purple-50 to-pink-50",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="group relative bg-white/95 backdrop-blur-sm rounded-3xl p-10 text-center border border-white/30 overflow-hidden"
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{
                    scale: 1.05,
                    y: -10,
                    transition: { duration: 0.3 },
                  }}
                >
                  {/* Background decoration */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  ></div>

                  {/* Icon container */}
                  <motion.div
                    className={`relative inline-block p-6 bg-gradient-to-br ${feature.gradient} rounded-3xl mb-8 shadow-2xl`}
                    whileHover={{
                      rotate: [0, -10, 10, -10, 0],
                      scale: 1.1,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="text-5xl relative z-10">{feature.icon}</div>
                  </motion.div>

                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-6 text-gray-800 group-hover:text-gray-900 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-lg group-hover:text-gray-700 transition-colors">
                      {feature.description}
                    </p>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 bg-white/10 rounded-full"></div>

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </motion.div>
              ))}
            </div>

            {/* Call to action */}
            <motion.div
              className="text-center mt-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <motion.button
                className="btn-gradient text-xl px-12 py-6 relative overflow-hidden group shadow-2xl"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center gap-3">
                  🚀 Start Your Journey Today ✨
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </motion.button>
            </motion.div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-effect mt-20 py-8 text-center border-t border-white/20">
        <div className="max-w-6xl mx-auto px-5">
          <p className="text-gray-700 font-medium">
            © 2025 TravelAI. Made with ❤️ for travelers everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";

interface ImageLoadState {
  lowQuality: boolean;
  highQuality: boolean;
}

interface TravelCarouselProps {
  isVisible: boolean;
}

const TravelCarousel: React.FC<TravelCarouselProps> = ({ isVisible }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadStates, setLoadStates] = useState<Record<string, ImageLoadState>>(
    {}
  );

  // Travel images from public folder - memoized to prevent re-renders
  const travelImages = useMemo(
    () => [
      {
        src: "/beautiful-blonde-woman-smiling-resting-relaxing-swimming-pool.webp",
        alt: "Relaxing by the swimming pool",
        caption: "✨ Finding perfect relaxation spots",
      },
      {
        src: "/friends-sunbathing-smiling-lying-chaises-near-swimming-pool.webp",
        alt: "Friends enjoying poolside time",
        caption: "👥 Planning group adventures",
      },
      {
        src: "/woman-enjoying-rural-surroundings.webp",
        alt: "Woman enjoying rural surroundings",
        caption: "🌿 Discovering hidden natural gems",
      },
      {
        src: "/woman-with-hat-sitting-chairs-beach-beautiful-tropical-beach-woman-relaxing-tropical-beach-koh-nangyuan-island.webp",
        alt: "Beautiful tropical beach relaxation",
        caption: "🏖️ Finding pristine beach experiences",
      },
      {
        src: "/view-child-summer-beach.webp",
        alt: "Child enjoying summer beach",
        caption: "🌊 Creating family memories",
      },
      {
        src: "/cute-child-feeling-happy-smiles-with-her-mother-while-playing-with-parrot-bird.webp",
        alt: "Family enjoying wildlife",
        caption: "🦜 Curating wildlife encounters",
      },
      {
        src: "/medium-shot-smiley-people-partying-together.webp",
        alt: "People celebrating together",
        caption: "🎉 Planning celebration moments",
      },
    ],
    []
  );

  // Preload images for instant display
  useEffect(() => {
    const preloadImages = () => {
      let loadedCount = 0;
      travelImages.forEach((image) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === travelImages.length) {
            setImagesLoaded(true);
          }
        };
        img.src = image.src;
      });
    };

    preloadImages();
  }, [travelImages]);

  // Auto-advance carousel
  useEffect(() => {
    if (!isVisible || !imagesLoaded) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % travelImages.length);
    }, 2500); // Change image every 2.5 seconds

    return () => clearInterval(interval);
  }, [isVisible, imagesLoaded, travelImages.length]);

  if (!isVisible) return null;

  // Get 3 images to display (current, next, next+1)
  const getVisibleImages = () => {
    const images = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % travelImages.length;
      images.push({ ...travelImages[index], position: i });
    }
    return images;
  };

  const visibleImages = getVisibleImages();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.6 }}
          className="mt-12 mb-8"
        >
          {/* Loading Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block text-4xl mb-4"
            >
              ✈️
            </motion.div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Creating Your Perfect Itinerary
            </h3>
            <p className="text-blue-200 text-lg">
              Our AI is analyzing destinations and crafting personalized
              experiences...
            </p>
          </div>

          {/* Carousel Container */}
          <div className="relative max-w-5xl mx-auto">
            <div className="flex justify-center items-center gap-4 md:gap-6 overflow-hidden">
              {visibleImages.map((image, index) => (
                <motion.div
                  key={`${image.src}-${currentIndex}-${index}`}
                  initial={{ opacity: 0, scale: 0.8, x: 100 }}
                  animate={{
                    opacity: 1,
                    scale: index === 1 ? 1.1 : 0.9, // Center image slightly larger
                    x: 0,
                    zIndex: index === 1 ? 10 : 5, // Center image on top
                  }}
                  exit={{ opacity: 0, scale: 0.8, x: -100 }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100,
                  }}
                  className={`relative rounded-2xl overflow-hidden shadow-2xl ${
                    index === 1
                      ? "w-72 h-48 md:w-80 md:h-56" // Center image bigger
                      : "w-56 h-36 md:w-64 md:h-44" // Side images smaller
                  }`}
                >
                  {/* Image */}
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Caption (only on center image) */}
                  {index === 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="absolute bottom-0 left-0 right-0 p-4"
                    >
                      <p className="text-white text-sm md:text-base font-medium text-center">
                        {image.caption}
                      </p>
                    </motion.div>
                  )}

                  {/* Loading shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                </motion.div>
              ))}
            </div>

            {/* Progress Indicators */}
            <div className="flex justify-center mt-6 gap-2">
              {travelImages.map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-blue-400 w-8"
                      : "bg-white/30 hover:bg-white/50"
                  }`}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>

            {/* Fun Loading Messages */}
            <motion.div
              key={currentIndex} // Re-animate on image change
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-6"
            >
              <p className="text-blue-100 text-sm md:text-base font-medium">
                {
                  [
                    "🗺️ Mapping out the best routes...",
                    "🏨 Finding perfect accommodations...",
                    "🍽️ Selecting amazing restaurants...",
                    "🎯 Personalizing your experience...",
                    "📍 Discovering hidden gems...",
                    "⭐ Adding special touches...",
                    "🎨 Crafting your perfect trip...",
                  ][currentIndex % 7]
                }
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TravelCarousel;

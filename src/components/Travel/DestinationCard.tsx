import React from "react";
import { motion } from "framer-motion";

interface DestinationCardProps {
  destination: {
    id: string;
    name: string;
    country: string;
    description: string;
    imageUrl: string;
    rating: number;
    priceRange: string;
  };
  onClick?: (destinationId: string) => void;
}

const DestinationCard: React.FC<DestinationCardProps> = ({
  destination,
  onClick,
}) => {
  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
    hover: {
      y: -8,
      transition: { duration: 0.2 },
    },
  };

  const imageVariants = {
    hover: {
      scale: 1.1,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="destination-card max-w-sm mx-auto overflow-hidden"
      onClick={() => onClick?.(destination.id)}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden rounded-t-xl">
        <motion.img
          variants={imageVariants}
          src={destination.imageUrl}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4">
          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-medium text-gray-800">
            {destination.priceRange}
          </span>
        </div>
        {/* Rating Badge */}
        <div className="absolute bottom-4 left-4">
          <div className="flex items-center bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
            <span className="text-yellow-500 mr-1">⭐</span>
            <span className="text-sm font-medium text-gray-800">
              {destination.rating}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-2">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {destination.name}
          </h3>
          <p className="text-sm text-gray-500">{destination.country}</p>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
          {destination.description}
        </p>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-200 text-sm font-medium"
          >
            View Details
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default DestinationCard;

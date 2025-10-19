// Travel related types
export interface Destination {
  id: string;
  name: string;
  country: string;
  description: string;
  imageUrl: string;
  rating: number;
  priceRange: PriceRange;
  coordinates: {
    lat: number;
    lng: number;
  };
  activities: Activity[];
  bestTimeToVisit: string[];
  tags: string[];
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  duration: number; // in hours
  price: number;
  category: ActivityCategory;
  rating: number;
  imageUrl?: string;
}

export interface Itinerary {
  id: string;
  userId: string;
  title: string;
  description: string;
  destinations: Destination[];
  startDate: Date;
  endDate: Date;
  budget: number;
  travelers: number;
  preferences: TravelPreferences;
  dailyPlans: DailyPlan[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyPlan {
  id: string;
  date: Date;
  activities: Activity[];
  meals: Meal[];
  accommodation?: Accommodation;
  transportation?: Transportation;
  notes: string;
  aiSuggestions: string;
}

export interface TravelPreferences {
  budget: number;
  travelers: number;
  interests: string[];
  accommodationType: AccommodationType[];
  transportationPreference: TransportationType[];
  activityLevel: ActivityLevel;
  diningPreference: DiningPreference[];
}

export interface Accommodation {
  id: string;
  name: string;
  type: AccommodationType;
  rating: number;
  pricePerNight: number;
  imageUrl: string;
  amenities: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Transportation {
  id: string;
  type: TransportationType;
  from: string;
  to: string;
  departureTime: Date;
  arrivalTime: Date;
  price: number;
  duration: number; // in minutes
}

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  restaurant?: string;
  cuisine: string;
  price: number;
  rating?: number;
}

// Enums
export enum PriceRange {
  BUDGET = "BUDGET",
  MID_RANGE = "MID_RANGE",
  LUXURY = "LUXURY",
}

export enum ActivityCategory {
  SIGHTSEEING = "SIGHTSEEING",
  ADVENTURE = "ADVENTURE",
  CULTURAL = "CULTURAL",
  FOOD = "FOOD",
  NIGHTLIFE = "NIGHTLIFE",
  SHOPPING = "SHOPPING",
  NATURE = "NATURE",
  RELAXATION = "RELAXATION",
}

export enum AccommodationType {
  HOTEL = "HOTEL",
  HOSTEL = "HOSTEL",
  APARTMENT = "APARTMENT",
  RESORT = "RESORT",
  BNB = "BNB",
  CAMPING = "CAMPING",
}

export enum TransportationType {
  FLIGHT = "FLIGHT",
  TRAIN = "TRAIN",
  BUS = "BUS",
  CAR = "CAR",
  BIKE = "BIKE",
  WALK = "WALK",
}

export enum ActivityLevel {
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
}

export enum DiningPreference {
  LOCAL = "LOCAL",
  INTERNATIONAL = "INTERNATIONAL",
  VEGETARIAN = "VEGETARIAN",
  VEGAN = "VEGAN",
  GLUTEN_FREE = "GLUTEN_FREE",
}

export enum MealType {
  BREAKFAST = "BREAKFAST",
  LUNCH = "LUNCH",
  DINNER = "DINNER",
  SNACK = "SNACK",
}

// AI Related types
export interface AIItineraryRequest {
  destinations: string[];
  duration: number; // days
  budget: number;
  travelers: number;
  interests: string[];
  startDate: Date;
  preferences: TravelPreferences;
}

export interface AIItineraryResponse {
  itinerary: Itinerary;
  confidence: number;
  alternatives: Itinerary[];
  tips: string[];
  warnings: string[];
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences?: TravelPreferences;
  savedItineraries: string[];
  createdAt: Date;
}

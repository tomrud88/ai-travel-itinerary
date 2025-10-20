/**
 * Image Service for fetching location-specific images
 */

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY =
  import.meta.env.VITE_UNSPLASH_ACCESS_KEY || "YOUR_UNSPLASH_ACCESS_KEY";
const UNSPLASH_API_URL = "https://api.unsplash.com/search/photos";

// Fallback images from Unsplash (no API key needed)
const FALLBACK_IMAGES = {
  // Specific locations
  "skanderbeg square":
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80",
  "ethem bey mosque":
    "https://images.unsplash.com/photo-1564769625392-651b8d9c12e8?w=400&h=300&fit=crop&q=80",
  "et'hem bey mosque":
    "https://images.unsplash.com/photo-1564769625392-651b8d9c12e8?w=400&h=300&fit=crop&q=80",
  "clock tower":
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&q=80",
  "bunk'art":
    "https://images.unsplash.com/photo-1551798507-629020c513ed?w=400&h=300&fit=crop&q=80",
  "bunker museum":
    "https://images.unsplash.com/photo-1551798507-629020c513ed?w=400&h=300&fit=crop&q=80",
  "national history museum":
    "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&h=300&fit=crop&q=80",
  "pazari i ri":
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop&q=80",
  "new bazaar":
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop&q=80",
  "grand park":
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&q=80",
  blloku:
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&q=80",
  pyramid:
    "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop&q=80",

  // Restaurants
  "restaurant oda":
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&q=80",
  "oda restaurant":
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&q=80",
  mullixhiu:
    "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&q=80",
  "era restaurant":
    "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop&q=80",

  // Generic categories
  museum:
    "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&h=300&fit=crop&q=80",
  mosque:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&q=80",
  church:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&q=80",
  square:
    "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop&q=80",
  market:
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop&q=80",
  park: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&q=80",
  restaurant:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&q=80",
  cafe: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop&q=80",
  tower:
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&q=80",
  gallery:
    "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&h=300&fit=crop&q=80",

  // Default
  default:
    "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=400&h=300&fit=crop&q=80",
};

// Hero images for different destinations
const HERO_IMAGES = {
  tirana:
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=400&fit=crop&q=80",
  albania:
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=400&fit=crop&q=80",
  paris:
    "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=1200&h=400&fit=crop&q=80",
  france:
    "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=1200&h=400&fit=crop&q=80",
  dublin:
    "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1200&h=400&fit=crop&q=80",
  ireland:
    "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1200&h=400&fit=crop&q=80",
  london:
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&h=400&fit=crop&q=80",
  england:
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&h=400&fit=crop&q=80",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&h=400&fit=crop&q=80",
  italy:
    "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&h=400&fit=crop&q=80",
  barcelona:
    "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&h=400&fit=crop&q=80",
  spain:
    "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&h=400&fit=crop&q=80",
  istanbul:
    "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&h=400&fit=crop&q=80",
  turkey:
    "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&h=400&fit=crop&q=80",
  default:
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=400&fit=crop&q=80",
};

export class ImageService {
  /**
   * Get an image for a specific activity/location
   */
  static async getActivityImage(
    activityName: string,
    activityAddress: string = ""
  ): Promise<string> {
    console.log(`🖼️ Getting image for: "${activityName}"`);

    const searchText = `${activityName} ${activityAddress}`
      .toLowerCase()
      .trim();

    // Try Unsplash API for most activities (not just specific locations)
    const shouldTryUnsplash = this.shouldUseUnsplashAPI(searchText);

    if (shouldTryUnsplash) {
      console.log(`🔍 Trying Unsplash API for: "${activityName}"`);
      const unsplashImage = await this.searchUnsplash(
        `${activityName} ${activityAddress}`
      );

      // If we got a different URL than the fallback, use it
      if (unsplashImage !== this.getFallbackImage(searchText)) {
        console.log(`✅ Using Unsplash image for: "${activityName}"`);
        return unsplashImage;
      }
    }

    // Use curated fallback images
    return this.getFallbackImage(searchText);
  }

  /**
   * Determine if we should try Unsplash API for this search
   */
  static shouldUseUnsplashAPI(searchText: string): boolean {
    // Skip generic terms that might not give good results
    const skipTerms = [
      "lunch",
      "dinner",
      "breakfast",
      "meal",
      "snack",
      "break",
      "rest",
      "walk",
      "stroll",
      "explore",
    ];

    const hasSkipTerm = skipTerms.some((term) => searchText.includes(term));
    if (hasSkipTerm) {
      console.log(`⏭️ Skipping Unsplash for generic term: "${searchText}"`);
      return false;
    }

    // Try Unsplash for specific places, attractions, and establishments
    const tryTerms = [
      // Dublin specific
      "trinity",
      "dublin castle",
      "kilmainham",
      "temple bar",
      "brazen head",
      "st. patrick",
      "saint patrick",
      "christ church",
      "phoenix park",
      "guinness",
      "jameson",
      "grafton",
      "o'connell",
      "halfpenny bridge",

      // General attractions
      "museum",
      "gallery",
      "cathedral",
      "church",
      "castle",
      "palace",
      "park",
      "garden",
      "library",
      "university",
      "college",
      "distillery",
      "brewery",
      "market",
      "square",
      "bridge",
      "theatre",
      "opera",
      "concert",
      "tower",
      "monument",

      // Establishments with names
      "restaurant",
      "pub",
      "bar",
      "cafe",
      "hotel",
    ];

    const shouldTry =
      tryTerms.some((term) => searchText.includes(term)) ||
      searchText.split(" ").length >= 3; // Try for specific named places

    if (shouldTry) {
      console.log(`✅ Will try Unsplash for: "${searchText}"`);
    } else {
      console.log(`⏭️ Skipping Unsplash for: "${searchText}"`);
    }

    return shouldTry;
  }

  /**
   * Get fallback image for locations not found via API
   */
  static getFallbackImage(searchText: string): string {
    // Dublin/Ireland specific fallback locations FIRST
    if (
      searchText.includes("trinity college") ||
      searchText.includes("trinity")
    ) {
      console.log("🏫 Using Trinity College image");
      return "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=300&fit=crop&q=80";
    }
    if (
      searchText.includes("long room library") ||
      searchText.includes("long room")
    ) {
      console.log("📚 Using Long Room Library image");
      return "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&q=80";
    }
    if (searchText.includes("dublin castle")) {
      console.log("🏰 Using Dublin Castle image");
      return "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=400&h=300&fit=crop&q=80";
    }
    if (
      searchText.includes("st. patrick") ||
      searchText.includes("saint patrick")
    ) {
      console.log("⛪ Using St. Patrick's Cathedral image");
      return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&q=80";
    }
    if (searchText.includes("brazen head")) {
      console.log("🍺 Using Irish pub image");
      return "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=400&h=300&fit=crop&q=80";
    }
    if (searchText.includes("winding stair")) {
      console.log("📖 Using bookstore cafe image");
      return "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop&q=80";
    }
    if (searchText.includes("temple bar")) {
      console.log("🍻 Using Temple Bar image");
      return "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop&q=80";
    }
    if (
      searchText.includes("stephen's green") ||
      searchText.includes("stephens green")
    ) {
      console.log("🌳 Using St. Stephen's Green image");
      return "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&q=80";
    }
    if (
      searchText.includes("kilmainham gaol") ||
      searchText.includes("kilmainham jail")
    ) {
      console.log("🏛️ Using Kilmainham Gaol image");
      return "https://images.unsplash.com/photo-1520637836862-4d197d17c927?w=400&h=300&fit=crop&q=80";
    }
    if (searchText.includes("liberties")) {
      console.log("🏘️ Using Dublin neighborhood image");
      return "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&q=80";
    }
    if (
      searchText.includes("stag's head") ||
      searchText.includes("stags head")
    ) {
      console.log("🍻 Using traditional pub image");
      return "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop&q=80";
    }

    // Then try exact matches from FALLBACK_IMAGES (Albanian/other specific locations)
    for (const [key, imageUrl] of Object.entries(FALLBACK_IMAGES)) {
      if (searchText.includes(key)) {
        console.log(`✅ Found specific image for: ${key}`);
        return imageUrl;
      }
    }

    // If no specific match, try category matches
    if (searchText.includes("college") || searchText.includes("university")) {
      console.log("🎓 Using university/college image");
      return FALLBACK_IMAGES.museum; // Universities often have similar architecture
    }
    if (searchText.includes("castle") || searchText.includes("fortress")) {
      console.log("🏰 Using castle image");
      return "https://images.unsplash.com/photo-1520637836862-4d197d17c927?w=400&h=300&fit=crop&q=80";
    }
    if (searchText.includes("cathedral") || searchText.includes("basilica")) {
      console.log("⛪ Using cathedral image");
      return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&q=80";
    }
    if (searchText.includes("library")) {
      console.log("📚 Using library image");
      return "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&q=80";
    }
    if (searchText.includes("pub") || searchText.includes("tavern")) {
      console.log("🍺 Using pub image");
      return "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop&q=80";
    }
    if (searchText.includes("museum") || searchText.includes("gallery")) {
      console.log("🏛️ Using museum image");
      return FALLBACK_IMAGES.museum;
    }
    if (searchText.includes("mosque") || searchText.includes("church")) {
      console.log("🕌 Using religious building image");
      return FALLBACK_IMAGES.mosque;
    }
    if (searchText.includes("square") || searchText.includes("plaza")) {
      console.log("🏛️ Using square image");
      return FALLBACK_IMAGES.square;
    }
    if (searchText.includes("market") || searchText.includes("bazaar")) {
      console.log("🛒 Using market image");
      return FALLBACK_IMAGES.market;
    }
    if (searchText.includes("park") || searchText.includes("garden")) {
      console.log("🌳 Using park image");
      return FALLBACK_IMAGES.park;
    }
    if (searchText.includes("restaurant") || searchText.includes("cafe")) {
      console.log("🍽️ Using restaurant image");
      return FALLBACK_IMAGES.restaurant;
    }
    if (searchText.includes("tower")) {
      console.log("🗼 Using tower image");
      return FALLBACK_IMAGES.tower;
    }

    console.log("🎯 Using default travel image");
    return FALLBACK_IMAGES.default;
  }

  /**
   * Get a hero image for the destination
   */
  static getHeroImage(title: string = ""): string {
    console.log(`🏞️ Getting hero image for: "${title}"`);

    const titleLower = title.toLowerCase();

    for (const [key, imageUrl] of Object.entries(HERO_IMAGES)) {
      if (titleLower.includes(key)) {
        console.log(`✅ Found hero image for: ${key}`);
        return imageUrl;
      }
    }

    console.log("🎯 Using default hero image");
    return HERO_IMAGES.default;
  }

  /**
   * Search Unsplash API for dynamic images
   */
  static async searchUnsplash(query: string): Promise<string> {
    try {
      if (
        !UNSPLASH_ACCESS_KEY ||
        UNSPLASH_ACCESS_KEY === "YOUR_UNSPLASH_ACCESS_KEY"
      ) {
        console.log("📝 No Unsplash API key, using fallback images");
        return this.getFallbackImage(query.toLowerCase());
      }

      // Enhance query for better results
      let enhancedQuery = query.trim();

      // Add location context for better results
      if (
        enhancedQuery.toLowerCase().includes("dublin") ||
        enhancedQuery.toLowerCase().includes("ireland")
      ) {
        enhancedQuery = `${enhancedQuery} Ireland architecture`;
      } else if (
        !enhancedQuery.toLowerCase().includes("ireland") &&
        (enhancedQuery.toLowerCase().includes("trinity") ||
          enhancedQuery.toLowerCase().includes("temple bar") ||
          enhancedQuery.toLowerCase().includes("dublin castle"))
      ) {
        enhancedQuery = `${enhancedQuery} Dublin Ireland`;
      }

      console.log(`🔍 Searching Unsplash for: "${enhancedQuery}"`);

      const response = await fetch(
        `${UNSPLASH_API_URL}?query=${encodeURIComponent(
          enhancedQuery
        )}&per_page=3&orientation=landscape&content_filter=high`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        // Pick the best image from results (first one is usually most relevant)
        const bestImage = data.results[0];
        const imageUrl = `${bestImage.urls.regular}?w=400&h=300&fit=crop&q=80`;
        console.log(
          `📸 Found Unsplash image for: "${enhancedQuery}" by ${bestImage.user.name}`
        );
        return imageUrl;
      } else {
        console.log(`❌ No Unsplash results for: "${enhancedQuery}"`);
      }
    } catch (error) {
      console.error("Error fetching from Unsplash:", error);
    }

    // Fallback to predefined images
    console.log("🔄 Falling back to predefined images");
    return this.getFallbackImage(query.toLowerCase());
  }
}

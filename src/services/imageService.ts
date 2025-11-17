/**
 * Freepik-Only Image Service - No fallback images, real API only
 */

interface ImageUrls {
  url: string;
}

export class ImageService {
  private static imageCache = new Map<string, ImageUrls>();
  private static requestCooldown = new Map<string, number>();
  private static requestCount = 0;
  private static lastMinuteStart = Date.now();
  // Tiny blurred placeholder (1x1 pixel, base64 encoded)
  static readonly PLACEHOLDER_IMAGE =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRseHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/2wBDAR4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAIAAgDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";
  private static readonly MAX_REQUESTS_PER_MINUTE = 35; // Client-side limit: 35 per minute (below server limit of 40 for safety)
  private static pendingRequests = new Map<string, Promise<ImageUrls | null>>();

  /**
   * Check client-side rate limiting before making requests
   */
  private static checkRateLimit(): boolean {
    const now = Date.now();

    // Reset counter every minute
    if (now - this.lastMinuteStart > 60000) {
      this.requestCount = 0;
      this.lastMinuteStart = now;
    }

    // Check if we've exceeded the limit
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      console.warn(
        `⚠️ Client-side Freepik rate limit reached (${this.MAX_REQUESTS_PER_MINUTE}/min). Skipping request.`
      );
      return false;
    }

    this.requestCount++;
    return true;
  }

  static async getFreepikImage(
    activityName: string,
    activityAddress: string = "",
    destinationCity?: string
  ): Promise<ImageUrls | null> {
    if (!destinationCity) {
      console.log("⚠️ Warning: No destination city provided for image search");
      return null;
    }

    // Clean the destination city
    destinationCity = destinationCity.trim();

    // Get only the location name before "A Day" or similar phrases
    const parts = activityName.split(/\s+(?:A Day|in the|at the|of the|and)/i);
    let cleanName = parts[0].trim();

    // Remove any parenthetical text and extra descriptive words
    cleanName = cleanName
      .replace(/\s*\([^)]*\)/g, "")
      .replace(
        /\b(Cultural|Culinary|Immersion|Delights|Amazing|Beautiful|Local)\b/gi,
        ""
      )
      .trim();

    // Always ensure the city name is present in the query
    // Always ensure the city name is present in the query
    const searchQuery = `${cleanName} ${destinationCity}`.trim();
    const cacheKey = searchQuery.toLowerCase();

    console.log(`🔍 Query optimization:`, {
      original: activityName,
      clean: cleanName,
      city: destinationCity,
      optimized: searchQuery,
    });

    if (this.imageCache.has(cacheKey)) {
      console.log(`🎯 Using cached Freepik image for: "${searchQuery}"`);
      return this.imageCache.get(cacheKey)!;
    }

    // Check if we made a recent request for this query to prevent spam
    const now = Date.now();
    const lastRequestTime = this.requestCooldown.get(cacheKey) || 0;
    if (now - lastRequestTime < 500) {
      // 500ms cooldown
      console.log(`⏰ Cooldown active for: "${searchQuery}"`);
      return this.pendingRequests.get(cacheKey) || null;
    }
    this.requestCooldown.set(cacheKey, now);

    // Check if there's already a pending request for this query
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      console.log(`⏳ Waiting for pending request for: "${searchQuery}"`);
      return pendingRequest;
    }

    // Check rate limiting before making request
    if (!this.checkRateLimit()) {
      console.log(
        `🚫 Skipping Freepik request due to rate limiting: "${searchQuery}"`
      );
      return null;
    }

    // Create new request promise and store it
    const requestPromise = this.makeFreepikRequest(searchQuery);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await this.makeFreepikRequest(searchQuery);

      // Clean up pending request
      this.pendingRequests.delete(cacheKey);

      return result;
    } catch (error) {
      // Clean up pending request on error
      this.pendingRequests.delete(cacheKey);
      console.error(`💥 Freepik API error for "${searchQuery}":`, error);
      return null;
    }
  }

  private static async makeFreepikRequest(
    query: string
  ): Promise<ImageUrls | null> {
    console.log(`🔍 Server-side Freepik search for: "${query}"`);

    const response = await fetch("/api/images/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        activityName: query,
        activityAddress: "",
        limit: 1,
        orientation: "horizontal", // Prefer horizontal/landscape images
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      if (response.status === 429) {
        console.log(`⏳ Freepik rate limit exceeded for: "${query}"`);
      } else if (
        errorText.includes("rate limit") ||
        errorText.includes("Rate limit")
      ) {
        console.log(`⏳ Freepik rate limit error for: "${query}"`);
      } else {
        console.log(`❌ Freepik API error ${response.status} for: "${query}"`);
      }
      return null;
    }

    const data = await response.json();

    if (data.images && data.images.length > 0) {
      console.log(
        `✅ Found real Freepik image for: "${query}"`,
        data.images[0]
      );
      const imageUrl = data.images[0];
      const urls: ImageUrls = { url: imageUrl.url };
      this.imageCache.set(query.toLowerCase(), urls);
      return urls;
    }

    console.log(`📷 No Freepik results for: "${query}"`);
    return null;
  }

  private static galleryCache = new Map<
    string,
    { urls: string[]; timestamp: number }
  >();
  private static readonly GALLERY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async getCityGallery(destination: string): Promise<string[]> {
    if (
      !destination ||
      destination === "destination" ||
      destination === "European"
    ) {
      console.log("⚠️ Invalid city name provided");
      return [];
    }

    console.log(`🏙️ Getting Freepik gallery for: "${destination}"`);

    // Check gallery cache first
    const cacheKey = destination.toLowerCase();
    const cached = this.galleryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.GALLERY_CACHE_DURATION) {
      console.log(`🎯 Using cached gallery for: "${destination}"`);
      return cached.urls;
    }

    // Clean up the city name by removing descriptive words and ensuring it's properly formatted
    const cityName = destination
      .replace(
        /\b(?:relaxed|cultural|historic|beautiful|amazing|city|guide|tour|experience)\b/gi,
        ""
      )
      .replace(/\s+(?:city|town|village)\b/gi, "")
      .replace(/^\s+|\s+$/g, "") // trim spaces
      .replace(/\s+/g, " "); // normalize internal spaces

    // Ensure we have a valid city name and form a specific query
    if (!cityName) {
      console.log("⚠️ No valid city name found after cleaning");
      return [];
    }

    const finalQuery = `${cityName} famous landmarks architecture`;

    console.log(`🔍 Optimized gallery search term: "${finalQuery}"`);

    // Check rate limiting before making request
    if (!this.checkRateLimit()) {
      console.log(
        `🚫 Skipping Freepik city gallery request due to rate limiting: "${finalQuery}"`
      );
      return [];
    }

    try {
      // Get a larger batch of city images - 15 to cover all activities
      const response = await fetch("/api/images/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activityName: finalQuery, // Use the enhanced query
          limit: 3, // Request only 3 images for the gallery
          orientation: "horizontal", // Prefer horizontal/panoramic images
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 429) {
          console.log(`⏳ Freepik city gallery rate limit exceeded`);
        } else if (
          errorText.includes("rate limit") ||
          errorText.includes("Rate limit")
        ) {
          console.log(`⏳ Freepik city gallery rate limit error`);
        } else {
          console.log(`❌ Freepik city gallery API error ${response.status}`);
        }
        return [];
      }

      const data = await response.json();

      if (data.images && data.images.length > 0) {
        console.log(
          `✅ Found ${data.images.length} Freepik city images for distribution`
        );
        const urls = data.images.map((img: ImageUrls) => img.url);

        // Store in cache
        this.galleryCache.set(cacheKey, {
          urls,
          timestamp: Date.now(),
        });

        return urls;
      }

      console.log(`📷 No Freepik city gallery results for: "${destination}"`);
      return [];
    } catch (error) {
      console.error(`💥 Freepik city gallery error:`, error);
      return [];
    }
  }

  static async getActivityImage(
    activityName: string,
    activityAddress: string = "",
    destinationCity?: string
  ): Promise<string | null> {
    // Use the getFreepikImage method for individual activity searches
    const result = await this.getFreepikImage(
      activityName,
      activityAddress,
      destinationCity
    );
    return result ? result.url : null;
  }

  static distributeCityImages(
    cityImages: string[],
    activityCount: number
  ): string[] {
    if (cityImages.length === 0) return [];

    const distributed: string[] = [];

    // Distribute images evenly across activities
    for (let i = 0; i < activityCount; i++) {
      const imageIndex = i % cityImages.length;
      distributed.push(cityImages[imageIndex]);
    }

    console.log(
      `📸 Distributed ${distributed.length} images across ${activityCount} activities using ${cityImages.length} source images`
    );
    return distributed;
  }

  static optimizeSearchQuery(
    activityName: string,
    activityAddress: string = "",
    activityCategory?: string,
    userInterests?: string[],
    destinationCity?: string
  ): string {
    let cleanQuery = activityName.trim();

    // Remove content in parentheses (often translations or descriptions)
    cleanQuery = cleanQuery.replace(/\(.*?\)/g, "");

    // Clean up problematic adjectives that might relate to food instead of places
    cleanQuery = cleanQuery
      .replace(/\b(milanese|barcelonese|valencian|parisian)\b/gi, "")
      .replace(
        /\b(charm|charming|beautiful|stunning|amazing|wonderful|lovely|historic|traditional|authentic|local|famous|popular|best|top)\b/gi,
        ""
      )
      .replace(/\s+/g, " ")
      .trim();

    // Extract city name from address if provided, but prefer destinationCity parameter
    let cityName = destinationCity || "";
    if (!cityName && activityAddress) {
      // Use general city pattern - look for city before postal code
      const cityMatch = activityAddress.match(
        /,\s*([A-Za-z\u00C0-\u017F]+(?:\s+[A-Za-z\u00C0-\u017F]+)*),?\s*(?:\d{4,})/i
      );
      if (cityMatch) {
        cityName = cityMatch[1];
      }
    }

    // Context-aware optimization based on activity category and interests
    const categoryModifiers = this.getCategoryModifiers(
      activityCategory,
      userInterests
    );

    // PREFERRED: Keep specific landmark names with city
    // For example: "Central Sofia Market Hall" -> "Central Sofia Market Hall Sofia"
    // For example: "Louvre Museum" -> "Louvre Museum Paris"
    if (
      cityName &&
      !cleanQuery.toLowerCase().includes(cityName.toLowerCase())
    ) {
      return `${cleanQuery} ${cityName}`;
    }

    // If we have category modifiers but no city, use them as fallback
    if (categoryModifiers && !cityName) {
      const baseLocation = this.extractMainLocation(cleanQuery);
      return `${baseLocation} ${categoryModifiers}`;
    }

    // Only use generic landmark optimization as last resort for very generic names
    if (this.isVeryGenericLandmark(cleanQuery) && cityName) {
      return this.applyGenericLandmarkOptimization(cleanQuery, cityName);
    }

    // Default: add city name if available and not already included
    if (
      cityName &&
      !cleanQuery.toLowerCase().includes(cityName.toLowerCase())
    ) {
      return `${cleanQuery} ${cityName}`;
    }

    return cleanQuery;
  }

  private static getCategoryModifiers(
    activityCategory?: string,
    userInterests?: string[]
  ): string | null {
    // Primary category-based modifiers
    const categoryMap: Record<string, string> = {
      SIGHTSEEING: "architecture landmarks monuments tourist attractions",
      CULTURAL: "museum art culture heritage historic sites",
      FOOD: "restaurant cuisine local food dining",
      SHOPPING: "shops markets boutiques shopping district",
      NATURE: "park nature landscape outdoor scenic",
      ADVENTURE: "outdoor activities adventure sports",
      NIGHTLIFE: "bars clubs nightlife entertainment district",
      RELAXATION: "spa wellness peaceful quiet places",
    };

    // Interest-based modifiers (more specific)
    const interestMap: Record<string, string> = {
      Architecture: "architecture buildings design",
      History: "historic heritage monuments ancient",
      Art: "art gallery museum cultural",
      Food: "cuisine restaurant local food market",
      Nature: "nature park landscape outdoor",
      Photography: "scenic photogenic viewpoint landmark",
      Shopping: "shopping boutique market local stores",
      Nightlife: "nightlife bars entertainment district",
      Museums: "museum art culture exhibitions",
      Parks: "park garden green space nature",
    };

    // Check interests first (more specific)
    if (userInterests && userInterests.length > 0) {
      for (const interest of userInterests) {
        if (interestMap[interest]) {
          return interestMap[interest];
        }
      }
    }

    // Fall back to category
    if (activityCategory && categoryMap[activityCategory]) {
      return categoryMap[activityCategory];
    }

    return null;
  }

  static extractMainLocation(query: string): string {
    // Extract the main location/landmark name, removing descriptive words
    const words = query.split(" ");
    // Keep the first few meaningful words, usually the location name
    return words.slice(0, 2).join(" ");
  }

  static isVeryGenericLandmark(query: string): boolean {
    // Only apply generic optimization for very basic/generic terms
    const genericTerms = [
      "cathedral",
      "church",
      "museum",
      "market",
      "plaza",
      "square",
      "garden",
      "park",
      "beach",
      "palace",
      "castle",
      "tower",
      "bridge",
      "fountain",
      "restaurant",
      "bar",
      "café",
    ];

    const lowerQuery = query.toLowerCase().trim();

    // Only return true if the query is EXACTLY one of these generic terms
    // or is very short (less than 3 words)
    return genericTerms.includes(lowerQuery) || query.split(" ").length <= 2;
  }

  static applyGenericLandmarkOptimization(
    query: string,
    cityName: string
  ): string {
    const lowerQuery = query.toLowerCase();

    // Generic landmark type optimizations
    if (lowerQuery.includes("cathedral") || lowerQuery.includes("church")) {
      return `${cityName} cathedral church architecture`;
    }
    if (lowerQuery.includes("market") || lowerQuery.includes("mercado")) {
      return `${cityName} market food fresh local`;
    }
    if (lowerQuery.includes("museum") || lowerQuery.includes("museu")) {
      return `${cityName} museum art culture`;
    }
    if (lowerQuery.includes("plaza") || lowerQuery.includes("square")) {
      return `${cityName} plaza square historic`;
    }
    if (lowerQuery.includes("garden") || lowerQuery.includes("park")) {
      return `${cityName} park garden nature`;
    }
    if (
      lowerQuery.includes("restaurant") ||
      lowerQuery.includes("bar") ||
      lowerQuery.includes("café")
    ) {
      return `${cityName} restaurant food cuisine dining`;
    }

    // Default: add city name if available
    if (cityName && !lowerQuery.includes(cityName.toLowerCase())) {
      return `${query} ${cityName}`;
    }

    return query;
  }
}

/**
 * Freepik-Only Image Service - No fallback images, real API only
 */

export class ImageService {
  private static imageCache = new Map<string, string>();
  private static requestCount = 0;
  private static lastMinuteStart = Date.now();
  private static readonly MAX_REQUESTS_PER_MINUTE = 8; // Client-side limit: 8 per minute (below server limit of 10)

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
  ): Promise<string | null> {
    const searchQuery = this.optimizeSearchQuery(
      activityName,
      activityAddress,
      undefined,
      undefined,
      destinationCity
    );
    const cacheKey = searchQuery.toLowerCase();

    console.log(`🔍 Query optimization:`, {
      original: `${activityName} ${activityAddress}`.trim(),
      optimized: searchQuery,
    });

    if (this.imageCache.has(cacheKey)) {
      console.log(`🎯 Using cached Freepik image for: "${searchQuery}"`);
      return this.imageCache.get(cacheKey)!;
    }

    // Check rate limiting before making request
    if (!this.checkRateLimit()) {
      console.log(
        `🚫 Skipping Freepik request due to rate limiting: "${searchQuery}"`
      );
      return null;
    }

    try {
      console.log(`🔍 Server-side Freepik search for: "${searchQuery}"`);

      const response = await fetch("/api/images/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activityName: activityName,
          activityAddress: activityAddress,
          limit: 1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 429) {
          console.log(`⏳ Freepik rate limit exceeded for: "${searchQuery}"`);
        } else if (
          errorText.includes("rate limit") ||
          errorText.includes("Rate limit")
        ) {
          console.log(`⏳ Freepik rate limit error for: "${searchQuery}"`);
        } else {
          console.log(
            `❌ Freepik API error ${response.status} for: "${searchQuery}"`
          );
        }
        return null;
      }

      const data = await response.json();

      if (data.images && data.images.length > 0) {
        const imageUrl = data.images[0];
        console.log(`✅ Found real Freepik image for: "${searchQuery}"`);
        this.imageCache.set(cacheKey, imageUrl);
        return imageUrl;
      }

      console.log(`📷 No Freepik results for: "${searchQuery}"`);
      return null;
    } catch (error) {
      console.error(`💥 Freepik API error for "${searchQuery}":`, error);
      return null;
    }
  }

  static async getCityGallery(destination: string): Promise<string[]> {
    console.log(`🏙️ Getting Freepik gallery for: "${destination}"`);

    // Check rate limiting before making request
    if (!this.checkRateLimit()) {
      console.log(
        `🚫 Skipping Freepik city gallery request due to rate limiting: "${destination}"`
      );
      return [];
    }

    try {
      // Get a larger batch of city images - 15 to cover all activities
      const response = await fetch("/api/images/city-gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination,
          limit: 15, // Get more images to distribute across activities
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
        return data.images;
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
    return await this.getFreepikImage(
      activityName,
      activityAddress,
      destinationCity
    );
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

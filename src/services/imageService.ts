/**
 * Freepik-Only Image Service - No fallback images, real API only
 */

export class ImageService {
  private static imageCache = new Map<string, string>();

  static async getFreepikImage(
    activityName: string,
    activityAddress: string = ""
  ): Promise<string | null> {
    const searchQuery = this.optimizeSearchQuery(activityName, activityAddress);
    const cacheKey = searchQuery.toLowerCase();

    console.log(`🔍 Query optimization:`, {
      original: `${activityName} ${activityAddress}`.trim(),
      optimized: searchQuery,
    });

    if (this.imageCache.has(cacheKey)) {
      console.log(`🎯 Using cached Freepik image for: "${searchQuery}"`);
      return this.imageCache.get(cacheKey)!;
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
        console.log(
          `❌ Freepik API error ${response.status} for: "${searchQuery}"`
        );
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
        console.log(`❌ Freepik city gallery API error ${response.status}`);
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
    activityAddress: string = ""
  ): Promise<string | null> {
    // For now, don't search for individual activities
    // We'll use the city gallery distribution instead
    return null;
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
    activityAddress: string = ""
  ): string {
    let cleanQuery = activityName.trim();

    // Remove content in parentheses (often translations or descriptions)
    cleanQuery = cleanQuery.replace(/\(.*?\)/g, "");

    // Remove extra whitespace
    cleanQuery = cleanQuery.replace(/\s+/g, " ").trim();

    // Extract city name from address if provided
    let cityName = "";
    if (activityAddress) {
      // Use general city pattern - look for city before postal code
      const cityMatch = activityAddress.match(
        /,\s*([A-Za-z\u00C0-\u017F]+(?:\s+[A-Za-z\u00C0-\u017F]+)*),?\s*(?:\d{4,})/i
      );
      if (cityMatch) {
        cityName = cityMatch[1];
      }
    }

    // Generic landmark optimizations (work for any city)
    const landmarkPatterns = [
      // Cathedrals and churches
      {
        keywords: ["cathedral", "catedral", "church", "basilica"],
        replacement: "cathedral church architecture",
      },

      // Museums
      {
        keywords: ["museum", "museu", "museo"],
        replacement: "museum art culture",
      },

      // Markets
      {
        keywords: ["market", "mercado", "mercat"],
        replacement: "market food fresh local",
      },

      // Plazas and squares
      {
        keywords: ["plaza", "plaça", "square", "place"],
        replacement: "plaza square historic architecture",
      },

      // Parks and gardens
      {
        keywords: ["park", "garden", "jardín", "jardí"],
        replacement: "park garden green nature",
      },

      // Beaches
      {
        keywords: ["beach", "playa", "platja"],
        replacement: "beach mediterranean coast",
      },

      // Modern architecture
      {
        keywords: ["city of arts", "ciudad de las artes"],
        replacement: "modern architecture futuristic building",
      },

      // Historic buildings
      {
        keywords: ["palace", "palacio", "castell", "castle"],
        replacement: "palace historic architecture",
      },
      {
        keywords: ["silk exchange", "lonja"],
        replacement: "historic building architecture",
      },

      // Restaurants and dining
      {
        keywords: [
          "restaurant",
          "restaurante",
          "taberna",
          "bar ",
          "lunch at",
          "dinner at",
        ],
        replacement: "restaurant food cuisine dining",
      },
    ];

    // Apply pattern matching
    const lowerQuery = cleanQuery.toLowerCase();
    for (const pattern of landmarkPatterns) {
      if (pattern.keywords.some((keyword) => lowerQuery.includes(keyword))) {
        return pattern.replacement;
      }
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
}

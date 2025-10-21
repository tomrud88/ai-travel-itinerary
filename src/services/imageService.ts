/**
 * Freepik-Only Image Service - No fallback images, real API only
 */

export class ImageService {
  private static imageCache = new Map<string, string>();

  static async getFreepikImage(
    activityName: string,
    activityAddress: string = ""
  ): Promise<string | null> {
    const searchQuery = `${activityName} ${activityAddress}`.trim();
    const cacheKey = searchQuery.toLowerCase();

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
          query: searchQuery,
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
    console.log(`🏙️ Getting Freepik-only gallery for: "${destination}"`);

    try {
      const response = await fetch("/api/images/city-gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination,
        }),
      });

      if (!response.ok) {
        console.log(`❌ Freepik city gallery API error ${response.status}`);
        return [];
      }

      const data = await response.json();

      if (data.images && data.images.length > 0) {
        console.log(`✅ Found ${data.images.length} real Freepik city images`);
        return data.images.slice(0, 3);
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
    return await this.getFreepikImage(activityName, activityAddress);
  }

  static optimizeSearchQuery(
    activityName: string,
    activityAddress: string = ""
  ): string {
    let cleanQuery = activityName.trim();

    cleanQuery = cleanQuery.replace(/\(.*?\)/g, "");
    cleanQuery = cleanQuery.replace(/\s+/g, " ").trim();

    if (activityAddress) {
      const cityMatch = activityAddress.match(
        /,\s*(\w+(?:\s+\w+)*),?\s*(?:\d{4,})/i
      );
      if (cityMatch) {
        cleanQuery = `${cleanQuery} ${cityMatch[1]}`;
      }
    }

    if (cleanQuery.toLowerCase().includes("sagrada")) {
      cleanQuery = "Sagrada Familia Barcelona architecture Gaudi";
    } else if (cleanQuery.toLowerCase().includes("boqueria")) {
      cleanQuery = "La Boqueria market Barcelona food";
    } else if (cleanQuery.toLowerCase().includes("picasso")) {
      cleanQuery = "Picasso Museum Barcelona art";
    } else if (cleanQuery.toLowerCase().includes("gothic quarter")) {
      cleanQuery = "Gothic Quarter Barcelona medieval architecture";
    } else if (cleanQuery.toLowerCase().includes("park güell")) {
      cleanQuery = "Park Guell Barcelona Gaudi mosaic";
    }

    return cleanQuery;
  }
}

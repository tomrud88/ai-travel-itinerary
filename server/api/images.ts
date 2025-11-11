/**
 * Server-side API endpoint for Freepik image requests
 * This runs on the server and avoids CORS issues
 */

import * as fs from "fs";
import * as path from "path";

interface FreepikResponse {
  data: Array<{
    id: string;
    url: string;
    description?: string;
    thumbnails?: {
      webp?: string;
      jpg?: string;
    };
    image?: {
      preview_url?: string;
      url?: string;
      source?: {
        url?: string;
      };
    };
  }>;
}

// Simple in-memory cache to reduce API calls
interface ImageUrls {
  url: string;
}

const imageCache = new Map<string, { data: ImageUrls[]; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Request deduplication - prevent multiple simultaneous calls for same query
const pendingRequests = new Map<string, Promise<ImageUrls[]>>();

// Rate limiting for Freepik API - Budget: Max 5 EUR/month
class FreepikRateLimit {
  private static lastRequestTime = 0;
  private static requestCount = 0;
  private static dailyRequestCount = 0;
  private static monthlyRequestCount = 0;
  private static lastResetDate = new Date().getDate();
  private static lastResetMonth = new Date().getMonth();
  private static readonly MAX_REQUESTS_PER_MINUTE = 30; // Free tier: 30 requests per minute
  private static readonly MAX_DAILY_REQUESTS = 300; // Free tier: 300 requests per day
  private static readonly MAX_MONTHLY_REQUESTS = 3000; // Free tier: 3000 requests/month
  private static readonly MIN_INTERVAL = 500; // 0.5 second between requests - allows for burst capacity
  private static readonly STORAGE_KEY = "freepik_usage_tracking";
  private static isInitialized = false;

  /**
   * Initialize usage tracking from stored data
   */
  private static initializeFromStorage(): void {
    if (this.isInitialized) return;

    try {
      // For server-side, use a simple file-based storage approach
      try {
        // Store in a temp file that persists across restarts
        const storageFile = path.join(process.cwd(), ".freepik-usage.json");

        if (fs.existsSync(storageFile)) {
          const storedData = fs.readFileSync(storageFile, "utf8");
          const data = JSON.parse(storedData);
          const now = new Date();

          // Restore data if it's from the same month and day
          if (
            data.month === now.getMonth() &&
            data.year === now.getFullYear()
          ) {
            this.monthlyRequestCount = data.monthlyRequestCount || 0;
            this.lastResetMonth = data.month;

            if (data.date === now.getDate()) {
              this.dailyRequestCount = data.dailyRequestCount || 0;
              this.lastResetDate = data.date;
            } else {
              // New day, reset daily counter but keep monthly
              this.dailyRequestCount = 0;
              this.lastResetDate = now.getDate();
            }
          } else {
            // New month, reset all counters
            this.monthlyRequestCount = 0;
            this.dailyRequestCount = 0;
            this.lastResetMonth = now.getMonth();
            this.lastResetDate = now.getDate();
          }

          console.log("📊 Restored Freepik usage from file storage:", {
            monthly: this.monthlyRequestCount,
            daily: this.dailyRequestCount,
          });
        } else {
          console.log(
            "📊 No existing Freepik usage data found, starting fresh"
          );
        }
      } catch (error) {
        console.warn(
          "⚠️ File system not available, using memory-only tracking:",
          error
        );
      }

      // Fallback to localStorage for client-side environments
      if (typeof localStorage !== "undefined") {
        // Fallback to localStorage for client-side
        const storedData = localStorage.getItem(this.STORAGE_KEY);
        if (storedData) {
          const data = JSON.parse(storedData);
          const now = new Date();

          if (
            data.month === now.getMonth() &&
            data.year === now.getFullYear()
          ) {
            this.monthlyRequestCount = data.monthlyRequestCount || 0;
            this.lastResetMonth = data.month;

            if (data.date === now.getDate()) {
              this.dailyRequestCount = data.dailyRequestCount || 0;
              this.lastResetDate = data.date;
            } else {
              this.dailyRequestCount = 0;
              this.lastResetDate = now.getDate();
            }
          } else {
            this.monthlyRequestCount = 0;
            this.dailyRequestCount = 0;
            this.lastResetMonth = now.getMonth();
            this.lastResetDate = now.getDate();
          }

          console.log("📊 Restored Freepik usage from localStorage:", {
            monthly: this.monthlyRequestCount,
            daily: this.dailyRequestCount,
          });
        }
      }
    } catch (error) {
      console.warn("⚠️ Failed to load Freepik usage data from storage:", error);
      // Continue with default values if storage fails
    }

    this.isInitialized = true;
  }

  /**
   * Save current usage data to storage
   */
  private static saveToStorage(): void {
    try {
      const now = new Date();
      const data = {
        monthlyRequestCount: this.monthlyRequestCount,
        dailyRequestCount: this.dailyRequestCount,
        month: now.getMonth(),
        year: now.getFullYear(),
        date: now.getDate(),
        lastUpdated: now.toISOString(),
      };

      // Try file-based storage first (server-side)
      try {
        const storageFile = path.join(process.cwd(), ".freepik-usage.json");
        fs.writeFileSync(storageFile, JSON.stringify(data, null, 2));
      } catch (error) {
        // Fallback to localStorage if available (client-side)
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } else {
          console.warn("⚠️ No storage method available:", error);
        }
      }
    } catch (error) {
      console.warn("⚠️ Failed to save Freepik usage data to storage:", error);
    }
  }

  static async enforceLimit(): Promise<void> {
    // Initialize from storage on first call
    this.initializeFromStorage();

    const now = Date.now();
    const currentDate = new Date().getDate();
    const currentMonth = new Date().getMonth();

    // Reset monthly counter at start of new month
    if (currentMonth !== FreepikRateLimit.lastResetMonth) {
      FreepikRateLimit.monthlyRequestCount = 0;
      FreepikRateLimit.dailyRequestCount = 0;
      FreepikRateLimit.requestCount = 0;
      FreepikRateLimit.lastResetMonth = currentMonth;
      FreepikRateLimit.lastResetDate = currentDate;
      console.log("🔄 Freepik rate limit counters reset for new month");
    }

    // Reset daily counter at midnight
    if (currentDate !== FreepikRateLimit.lastResetDate) {
      FreepikRateLimit.dailyRequestCount = 0;
      FreepikRateLimit.requestCount = 0;
      FreepikRateLimit.lastResetDate = currentDate;
      console.log("🔄 Freepik daily counters reset");
    }

    // Check monthly free tier limit
    if (
      FreepikRateLimit.monthlyRequestCount >=
      FreepikRateLimit.MAX_MONTHLY_REQUESTS
    ) {
      throw new Error(
        `🚫 Monthly Freepik free tier limit reached (${FreepikRateLimit.MAX_MONTHLY_REQUESTS} requests). Please wait until next month.`
      );
    }

    // Check daily limit
    if (
      FreepikRateLimit.dailyRequestCount >= FreepikRateLimit.MAX_DAILY_REQUESTS
    ) {
      throw new Error(
        `Freepik daily API limit reached (${FreepikRateLimit.MAX_DAILY_REQUESTS} requests). Please try again tomorrow.`
      );
    }

    // Reset minute counter if more than a minute has passed
    if (now - FreepikRateLimit.lastRequestTime > 60000) {
      FreepikRateLimit.requestCount = 0;
    }

    // Check per-minute limit
    if (
      FreepikRateLimit.requestCount >= FreepikRateLimit.MAX_REQUESTS_PER_MINUTE
    ) {
      throw new Error(
        `Freepik rate limit exceeded (${FreepikRateLimit.MAX_REQUESTS_PER_MINUTE} requests per minute). Please wait before making more requests.`
      );
    }

    // Enforce minimum interval between requests
    const timeSinceLastRequest = now - FreepikRateLimit.lastRequestTime;
    if (timeSinceLastRequest < FreepikRateLimit.MIN_INTERVAL) {
      const waitTime = FreepikRateLimit.MIN_INTERVAL - timeSinceLastRequest;
      console.log(
        `⏳ Freepik rate limiting: waiting ${waitTime}ms before API call`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    FreepikRateLimit.lastRequestTime = Date.now();
    FreepikRateLimit.requestCount++;
    FreepikRateLimit.dailyRequestCount++;
    FreepikRateLimit.monthlyRequestCount++;

    // Save updated counters to storage

    FreepikRateLimit.saveToStorage();

    const remainingMonthly =
      FreepikRateLimit.MAX_MONTHLY_REQUESTS -
      FreepikRateLimit.monthlyRequestCount;

    console.log(`� Freepik Usage Tracking:`);
    console.log(
      `   Monthly: ${FreepikRateLimit.monthlyRequestCount}/${FreepikRateLimit.MAX_MONTHLY_REQUESTS} requests (Free Tier)`
    );
    console.log(
      `   Daily: ${FreepikRateLimit.dailyRequestCount}/${FreepikRateLimit.MAX_DAILY_REQUESTS} requests`
    );
    console.log(
      `   Per minute: ${FreepikRateLimit.requestCount}/${FreepikRateLimit.MAX_REQUESTS_PER_MINUTE} requests`
    );
    console.log(`   Remaining this month: ${remainingMonthly} requests`);
  }

  /**
   * Get current budget status for monitoring
   */
  static getBudgetStatus() {
    return {
      monthlyUsed: FreepikRateLimit.monthlyRequestCount,
      monthlyLimit: FreepikRateLimit.MAX_MONTHLY_REQUESTS,
      dailyUsed: FreepikRateLimit.dailyRequestCount,
      dailyLimit: FreepikRateLimit.MAX_DAILY_REQUESTS,
      percentageUsed:
        (FreepikRateLimit.monthlyRequestCount /
          FreepikRateLimit.MAX_MONTHLY_REQUESTS) *
        100,
      tier: "free",
    };
  }
}

export async function searchFreepikImages(
  query: string,
  limit: number = 3
): Promise<ImageUrls[]> {
  // Handle special cases for city names
  if (query.toLowerCase() === "nice" || query.toLowerCase() === "nice city") {
    query = "Nice France tourist attractions";
  }
  const cacheKey = `${query}-${limit}`;

  // Check cache first
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`🎯 Using cached images for: "${query}"`);
    return cached.data;
  }

  // Check if there's already a pending request for this query
  const pendingRequest = pendingRequests.get(cacheKey);
  if (pendingRequest) {
    console.log(
      `⏳ [DEDUPLICATION] Waiting for pending request for: "${query}"`
    );
    return pendingRequest;
  }

  // Create new request
  const requestPromise = makeFreepikRequest(query, limit, cacheKey);
  pendingRequests.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    // Clean up pending request
    pendingRequests.delete(cacheKey);
  }
}

async function makeFreepikRequest(
  query: string,
  limit: number,
  cacheKey: string
): Promise<ImageUrls[]> {
  // Clean up query by removing descriptive and unnecessary words first
  query = query
    .replace(
      /\b(?:relaxed|cultural|historic|beautiful|amazing|wonderful|exciting|authentic|traditional|best|top|local)\b/gi,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();

  const FREEPIK_API_KEY = process.env.VITE_FREEPIK_API_KEY;

  if (!FREEPIK_API_KEY) {
    console.log("⚠️ No Freepik API key available");
    return [];
  }

  try {
    // Use Promise.race to enforce rate limiting with a timeout
    await Promise.race([
      FreepikRateLimit.enforceLimit(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Rate limit timeout")), 5000)
      ),
    ]);

    console.log(
      `🔍 [NEW REQUEST] Server-side Freepik search for: "${query}" (limit: ${limit})`
    );
    console.log(`🔑 Using API key: ${FREEPIK_API_KEY.substring(0, 10)}...`);

    // Extract location name and optimize query
    function optimizeLocationQuery(searchQuery: string): string {
      const query = searchQuery.trim();

      // First, check if it's just a simple city name
      if (/^[A-Z][a-z]+$/.test(query)) {
        return `${query} city landmarks tourist attractions`;
      }

      // Extract location name from common patterns
      const patterns = [
        /^(\d+)\s+days?\s+in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i, // "N days in Location"
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:adventure|tour|trip|journey)/i, // "Location Adventure/Tour/Trip"
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i, // "Location" by itself
      ];

      for (const pattern of patterns) {
        const match = query.match(pattern);
        if (match) {
          // For the "N days in Location" pattern, the city is in the second capture group
          const location = (
            pattern.toString().includes("days") ? match[2] : match[1]
          ).trim();

          // Special handling for cities that could be misinterpreted
          if (location.toLowerCase() === "nice") {
            return "Nice France landmarks attractions";
          }

          // If we found a location and it looks like a proper city name
          if (location && location.length > 2 && /^[A-Z]/.test(location)) {
            // Add relevant search terms based on the query context
            const context = query.toLowerCase();
            if (context.includes("landmark") || context.includes("monument")) {
              return `${location} landmarks monuments architecture`;
            } else if (
              context.includes("restaurant") ||
              context.includes("food")
            ) {
              return `${location} restaurants cuisine`;
            } else if (
              context.includes("museum") ||
              context.includes("gallery")
            ) {
              return `${location} museums galleries`;
            } else if (context.includes("park") || context.includes("garden")) {
              return `${location} parks gardens nature`;
            } else {
              // Special handling for cities that could be misinterpreted
              if (location.toLowerCase() === "nice") {
                return "Nice France city";
              }
              return `${location} iconic landmark monument famous`;
            }
          }
        }
      }

      // If no location found or location doesn't look like a city name, use original query
      return query;
    }

    const optimizedQuery = optimizeLocationQuery(query);
    console.log(`Query optimization: "${query}" -> "${optimizedQuery}"`);

    // Build search parameters according to official API documentation
    // Special handling for Nice, France
    let searchTerm =
      query.toLowerCase() === "nice"
        ? "Nice France tourist attractions"
        : optimizedQuery;

    // Clean up search term by removing descriptive and unnecessary words
    searchTerm = searchTerm
      .replace(
        /\b(?:relaxed|cultural|historic|beautiful|amazing|wonderful|exciting|authentic|traditional|best|top|local)\b/gi,
        ""
      )
      .replace(/\s+/g, " ")
      .trim();

    const searchParams = new URLSearchParams({
      term: searchTerm,
      limit: limit.toString(),
      page: "1",
      order: "relevance",
      "filters[content_type][photo]": "1", // Only photos
      "filters[license][freemium]": "1", // Include freemium content
    });

    const fullUrl = `https://api.freepik.com/v1/resources?${searchParams}`;
    console.log(`🌐 Making request to: ${fullUrl}`);

    const fetchPromise = fetch(fullUrl, {
      headers: {
        "x-freepik-api-key": FREEPIK_API_KEY,
        "Accept-Language": "en-US",
      },
    });

    // Add a timeout for the fetch request
    const response = (await Promise.race([
      fetchPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      ),
    ])) as Response;

    console.log(`📡 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Freepik API error: ${response.status} - ${errorText}`);

      // Let's try a much simpler query if this fails
      if (query !== "valencia") {
        console.log(`🔄 Retrying with simple query: "valencia"`);
        return await makeFreepikRequest("valencia", limit, "valencia-fallback");
      }

      return [];
    }

    const data = (await response.json()) as FreepikResponse;
    console.log(`📊 API Response data:`, JSON.stringify(data, null, 2));

    const imageUrls = data.data
      .map((image) => {
        // Extract the real image URL from the response
        const imageUrl = image.image?.source?.url;
        if (!imageUrl) return null;

        console.log("Processing Freepik image:", { imageUrl });
        return imageUrl;
      })
      .filter((url): url is string => Boolean(url));

    // Convert to simple array of URLs, no high/low quality distinction needed
    const formattedUrls = imageUrls.map((url) => ({ url }));

    console.log(`✅ Found ${formattedUrls.length} Freepik images`);
    console.log(`🖼️ Image URLs:`, formattedUrls);

    // Cache the results
    imageCache.set(cacheKey, { data: formattedUrls, timestamp: Date.now() });

    return formattedUrls;
  } catch (error) {
    console.error("💥 Server-side Freepik error:", error);
    return [];
  }
}

export function optimizeSearchQuery(
  activityName: string,
  activityAddress: string = "",
  activityCategory?: string,
  userInterests?: string[],
  providedCity: string = ""
): string {
  let cleanQuery = activityName.trim();

  // First try to extract city from the activity name if it ends with a city name
  const cityMatch = cleanQuery.match(/\s+([A-Z][a-zA-Z\s]+)$/);
  const extractedCity = cityMatch ? cityMatch[1].trim() : "";

  // Use provided city name or extracted one
  const cityToUse = providedCity || extractedCity;

  // Remove the city name from the query if it appears at the end
  if (cityToUse) {
    cleanQuery = cleanQuery.replace(new RegExp(`\\s+${cityToUse}$`), "");
  }

  // Remove parentheses and extra spaces
  cleanQuery = cleanQuery
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+(?:A Day of|and|in the|at the|of the)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Always add the city name to the query
  if (cityToUse) {
    cleanQuery = `${cleanQuery} ${cityToUse}`;
  }

  // Context-aware optimization based on activity category and interests
  const categoryModifiers = getCategoryModifiers(
    activityCategory,
    userInterests
  );

  // Extract city name from address if no city is provided
  let addressCity = "";
  if (!cityToUse && activityAddress) {
    // General city pattern - look for city before postal code
    const cityMatch = activityAddress.match(
      /,\s*([A-Za-z\u00C0-\u017F]+(?:\s+[A-Za-z\u00C0-\u017F]+)*),?\s*(?:\d{4,})/i
    );
    if (cityMatch) {
      addressCity = cityMatch[1];
    }
  }

  // Get final city name from all possible sources
  const finalCity = cityToUse || addressCity;

  // PREFERRED: Keep specific landmark names with city
  // For example: "Central Sofia Market Hall" -> "Central Sofia Market Hall Sofia"
  // For example: "Louvre Museum" -> "Louvre Museum Paris"
  if (
    finalCity &&
    !cleanQuery.toLowerCase().includes(finalCity.toLowerCase())
  ) {
    return `${cleanQuery} ${finalCity}`;
  }

  // If we have category modifiers but no city, use them as fallback
  if (categoryModifiers && !finalCity) {
    const baseLocation = extractMainLocation(cleanQuery);
    return `${baseLocation} ${categoryModifiers}`;
  }

  // Only use generic landmark optimization as last resort for very generic names
  if (isVeryGenericLandmark(cleanQuery) && finalCity) {
    return applyLandmarkOptimizations(cleanQuery, finalCity);
  }

  return cleanQuery;
}

function getCategoryModifiers(
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

function extractMainLocation(query: string): string {
  // Extract the main location/landmark name, removing descriptive words
  const words = query.split(" ");
  // Keep the first few meaningful words, usually the location name
  return words.slice(0, 2).join(" ");
}

function isVeryGenericLandmark(query: string): boolean {
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

  // Check if the query consists of just one or two words
  // where one is a generic term
  const words = query.split(/\s+/);
  const hasGenericTerm = words.some((word) =>
    genericTerms.includes(word.toLowerCase())
  );

  return words.length <= 2 && hasGenericTerm;
}

function applyLandmarkOptimizations(query: string, cityName: string): string {
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
  if (lowerQuery.includes("beach") || lowerQuery.includes("playa")) {
    return `${cityName} beach seaside`;
  }
  if (lowerQuery.includes("palace") || lowerQuery.includes("palacio")) {
    return `${cityName} palace architecture historic`;
  }
  if (lowerQuery.includes("castle") || lowerQuery.includes("castillo")) {
    return `${cityName} castle fortress historic`;
  }

  // General restaurants/bars
  if (
    lowerQuery.includes("taberna") ||
    lowerQuery.includes("restaurante") ||
    lowerQuery.includes("restaurant") ||
    lowerQuery.includes("bar ") ||
    lowerQuery.includes("café") ||
    lowerQuery.includes("lunch at") ||
    lowerQuery.includes("dinner at")
  ) {
    return `${cityName} restaurant cuisine food`;
  }

  // Default: add city name if available
  if (cityName && !lowerQuery.includes(cityName.toLowerCase())) {
    return `${query} ${cityName}`;
  }

  return query;
}

/**
 * Export function to get Freepik budget status
 */
export function getFreepikBudgetStatus() {
  return FreepikRateLimit.getBudgetStatus();
}

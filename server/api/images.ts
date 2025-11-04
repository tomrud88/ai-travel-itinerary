/**
 * Server-side API endpoint for Freepik image requests
 * This runs on the server and avoids CORS issues
 */

interface FreepikResponse {
  data: Array<{
    id: string;
    url: string;
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
const imageCache = new Map<string, { data: string[]; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Request deduplication - prevent multiple simultaneous calls for same query
const pendingRequests = new Map<string, Promise<string[]>>();

// Rate limiting for Freepik API - Budget: Max 5 EUR/month
class FreepikRateLimit {
  private static lastRequestTime = 0;
  private static requestCount = 0;
  private static dailyRequestCount = 0;
  private static monthlyRequestCount = 0;
  private static lastResetDate = new Date().getDate();
  private static lastResetMonth = new Date().getMonth();
  private static readonly MAX_REQUESTS_PER_MINUTE = 20; // Increased rate for faster itinerary generation
  private static readonly MAX_DAILY_REQUESTS = 80; // 80 requests per day (4 complete itineraries @ 20 images each)
  private static readonly MAX_MONTHLY_REQUESTS = 2000; // 2000 requests/month (≈4.00 EUR @ 0.002 EUR/request, 100 itineraries)
  private static readonly MIN_INTERVAL = 3000; // 3 seconds between requests (20 per minute)

  static async enforceLimit(): Promise<void> {
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

    // Check monthly budget limit (MOST IMPORTANT)
    if (
      FreepikRateLimit.monthlyRequestCount >=
      FreepikRateLimit.MAX_MONTHLY_REQUESTS
    ) {
      throw new Error(
        `🚫 Monthly Freepik budget limit reached (${FreepikRateLimit.MAX_MONTHLY_REQUESTS} requests ≈ 5 EUR). Wait until next month or upgrade plan.`
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

    const remainingMonthly =
      FreepikRateLimit.MAX_MONTHLY_REQUESTS -
      FreepikRateLimit.monthlyRequestCount;
    const estimatedCost = FreepikRateLimit.monthlyRequestCount * 0.002; // Real cost: 0.002 EUR per request (103 requests = 0.206 EUR)

    console.log(`💰 Freepik Budget Tracking:`);
    console.log(
      `   Monthly: ${FreepikRateLimit.monthlyRequestCount}/${
        FreepikRateLimit.MAX_MONTHLY_REQUESTS
      } requests (≈${estimatedCost.toFixed(2)} EUR / 5.00 EUR)`
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
    const estimatedCost = FreepikRateLimit.monthlyRequestCount * 0.002;
    return {
      monthlyUsed: FreepikRateLimit.monthlyRequestCount,
      monthlyLimit: FreepikRateLimit.MAX_MONTHLY_REQUESTS,
      dailyUsed: FreepikRateLimit.dailyRequestCount,
      dailyLimit: FreepikRateLimit.MAX_DAILY_REQUESTS,
      estimatedCost: estimatedCost,
      remainingBudget: 5.0 - estimatedCost,
      percentageUsed:
        (FreepikRateLimit.monthlyRequestCount /
          FreepikRateLimit.MAX_MONTHLY_REQUESTS) *
        100,
    };
  }
}

export async function searchFreepikImages(
  query: string,
  limit: number = 3
): Promise<string[]> {
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
): Promise<string[]> {
  const FREEPIK_API_KEY = process.env.VITE_FREEPIK_API_KEY;

  if (!FREEPIK_API_KEY) {
    console.log("⚠️ No Freepik API key available");
    return [];
  }

  try {
    // Enforce rate limiting before making API call
    await FreepikRateLimit.enforceLimit();

    console.log(
      `🔍 [NEW REQUEST] Server-side Freepik search for: "${query}" (limit: ${limit})`
    );
    console.log(`🔑 Using API key: ${FREEPIK_API_KEY.substring(0, 10)}...`);

    // Build search parameters according to official API documentation
    const searchParams = new URLSearchParams({
      term: query,
      limit: limit.toString(),
      page: "1",
      order: "relevance",
      "filters[content_type][photo]": "1", // Only photos
      "filters[license][freemium]": "1", // Include freemium content
    });

    const fullUrl = `https://api.freepik.com/v1/resources?${searchParams}`;
    console.log(`🌐 Making request to: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      headers: {
        "x-freepik-api-key": FREEPIK_API_KEY,
        "Accept-Language": "en-US",
      },
    });

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
        // Extract the image URL from the actual API response structure
        return (
          image.image?.source?.url || // Main image source URL
          image.thumbnails?.webp || // Fallback options (if they exist)
          image.thumbnails?.jpg ||
          image.image?.preview_url ||
          image.image?.url ||
          ""
        );
      })
      .filter(Boolean);

    console.log(`✅ Found ${imageUrls.length} Freepik images`);
    console.log(`🖼️ Image URLs:`, imageUrls);

    // Cache the results
    imageCache.set(cacheKey, { data: imageUrls, timestamp: Date.now() });

    return imageUrls;
  } catch (error) {
    console.error("💥 Server-side Freepik error:", error);
    return [];
  }
}

export function optimizeSearchQuery(
  activityName: string,
  activityAddress: string = "",
  activityCategory?: string,
  userInterests?: string[]
): string {
  let cleanQuery = activityName.trim();

  // Remove content in parentheses (often translations or descriptions)
  cleanQuery = cleanQuery.replace(/\(.*?\)/g, "");

  // Remove extra whitespace
  cleanQuery = cleanQuery.replace(/\s+/g, " ").trim();

  // Clean up problematic adjectives that might relate to food or vague descriptions
  cleanQuery = cleanQuery
    .replace(/\b(milanese|barcelonese|valencian|parisian)\b/gi, "")
    .replace(
      /\b(charm|charming|beautiful|stunning|amazing|wonderful|lovely|historic|traditional|authentic|local|famous|popular|best|top)\b/gi,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();

  // Context-aware optimization based on activity category and interests
  const categoryModifiers = getCategoryModifiers(
    activityCategory,
    userInterests
  );

  // Extract city name from address if provided
  let cityName = "";
  if (activityAddress) {
    // General city pattern - look for city before postal code
    const cityMatch = activityAddress.match(
      /,\s*([A-Za-z\u00C0-\u017F]+(?:\s+[A-Za-z\u00C0-\u017F]+)*),?\s*(?:\d{4,})/i
    );
    if (cityMatch) {
      cityName = cityMatch[1];
    }
  }

  // PREFERRED: Keep specific landmark names with city
  // For example: "Central Sofia Market Hall" -> "Central Sofia Market Hall Sofia"
  // For example: "Louvre Museum" -> "Louvre Museum Paris"
  if (cityName && !cleanQuery.toLowerCase().includes(cityName.toLowerCase())) {
    return `${cleanQuery} ${cityName}`;
  }

  // If we have category modifiers but no city, use them as fallback
  if (categoryModifiers && !cityName) {
    const baseLocation = extractMainLocation(cleanQuery);
    return `${baseLocation} ${categoryModifiers}`;
  }

  // Only use generic landmark optimization as last resort for very generic names
  if (isVeryGenericLandmark(cleanQuery) && cityName) {
    return applyLandmarkOptimizations(cleanQuery, cityName);
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

  const lowerQuery = query.toLowerCase().trim();

  // Only return true if the query is EXACTLY one of these generic terms
  // or is very short (less than 3 words)
  return genericTerms.includes(lowerQuery) || query.split(" ").length <= 2;
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

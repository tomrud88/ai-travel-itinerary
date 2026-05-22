/**
 * Server-side API endpoint for Pexels image requests
 * This runs on the server and avoids CORS issues
 */

// Simple in-memory cache to reduce API calls
interface ImageUrls {
  url: string;
}

const imageCache = new Map<string, { data: ImageUrls[]; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Request deduplication - prevent multiple simultaneous calls for same query
const pendingRequests = new Map<string, Promise<ImageUrls[]>>();

export async function searchPexelsImages(
  query: string,
  limit: number = 3,
  orientation?: string
): Promise<ImageUrls[]> {
  console.log(`🎯 searchPexelsImages called with:`, { query, limit, orientation });

  const cacheKey = `${query}-${limit}-${orientation || "any"}`;

  // Check cache first
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`🎯 Using cached images for: "${query}"`);
    return cached.data;
  }

  // Check if there is already a pending request for this query
  const pendingRequest = pendingRequests.get(cacheKey);
  if (pendingRequest) {
    console.log(`⏳ [DEDUPLICATION] Waiting for pending request for: "${query}"`);
    return pendingRequest;
  }

  const requestPromise = makePexelsRequest(query, limit, cacheKey, orientation);
  pendingRequests.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

async function makePexelsRequest(
  query: string,
  limit: number,
  cacheKey: string,
  orientation?: string
): Promise<ImageUrls[]> {
  // Clean up query
  const cleanQuery = query
    .replace(
      /\b(?:relaxed|cultural|historic|beautiful|amazing|wonderful|exciting|authentic|traditional|best|top|local)\b/gi,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();

  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

  if (!PEXELS_API_KEY) {
    console.log("⚠️ No Pexels API key available");
    return [];
  }

  // Map orientation to Pexels format
  const pexelsOrientation =
    orientation === "horizontal" ? "landscape"
    : orientation === "vertical" ? "portrait"
    : "landscape";

  const doRequest = async (searchQuery: string): Promise<ImageUrls[] | null> => {
    const searchParams = new URLSearchParams({
      query: searchQuery,
      per_page: limit.toString(),
      orientation: pexelsOrientation,
    });

    const url = `https://api.pexels.com/v1/search?${searchParams}`;
    console.log(`🌐 Pexels request: ${url}`);

    const response = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY },
    });

    console.log(`📡 Pexels response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Pexels API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json() as { photos: Array<{ src: { large2x: string; large: string; original: string }; alt: string; photographer: string; url: string }> };
    return (data.photos || []).map((photo) => ({
      url: photo.src.large2x || photo.src.large || photo.src.original,
    }));
  };

  try {
    let results = await doRequest(cleanQuery);

    // Fallback: try without the last word (usually city name)
    if (results !== null && results.length === 0) {
      const words = cleanQuery.split(" ");
      if (words.length > 1) {
        const withoutLastWord = words.slice(0, -1).join(" ");
        console.log(`🔄 Fallback query (without last word): "${withoutLastWord}"`);
        results = await doRequest(withoutLastWord);
      }
    }

    // Fallback: try just the last word (city name)
    if (results !== null && results.length === 0) {
      const lastWord = cleanQuery.split(" ").pop() || cleanQuery;
      if (lastWord !== cleanQuery) {
        console.log(`🔄 Fallback query (city only): "${lastWord}"`);
        results = await doRequest(lastWord);
      }
    }

    const finalResults = results || [];
    console.log(`✅ Found ${finalResults.length} Pexels images for "${cleanQuery}"`);

    if (finalResults.length > 0) {
      imageCache.set(cacheKey, { data: finalResults, timestamp: Date.now() });
    }

    return finalResults;
  } catch (error) {
    console.error("💥 Server-side Pexels error:", error);
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

  // Extract city name from address if no city is provided
  let addressCity = "";
  if (!cityToUse && activityAddress) {
    const addrMatch = activityAddress.match(
      /,\s*([A-Za-z\u00C0-\u017F]+(?:\s+[A-Za-z\u00C0-\u017F]+)*),?\s*(?:\d{4,})/i
    );
    if (addrMatch) {
      addressCity = addrMatch[1];
    }
  }

  const finalCity = cityToUse || addressCity;

  if (finalCity && !cleanQuery.toLowerCase().includes(finalCity.toLowerCase())) {
    return `${cleanQuery} ${finalCity}`;
  }

  return cleanQuery;
}

/**
 * Export function to get Pexels budget status (rate limit info)
 */
export function getFreepikBudgetStatus() {
  return {
    monthlyUsed: 0,
    monthlyLimit: 20000,
    dailyUsed: 0,
    dailyLimit: 200,
    percentageUsed: 0,
    tier: "pexels-free",
  };
}

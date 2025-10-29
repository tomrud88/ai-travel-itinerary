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
  activityAddress: string = ""
): string {
  let cleanQuery = activityName.trim();

  // Remove content in parentheses (often translations or descriptions)
  cleanQuery = cleanQuery.replace(/\(.*?\)/g, "");

  // Remove extra whitespace
  cleanQuery = cleanQuery.replace(/\s+/g, " ").trim();

  // Valencia-specific optimizations (check first, before city extraction)
  if (
    cleanQuery.toLowerCase().includes("lonja de la seda") ||
    cleanQuery.toLowerCase().includes("silk exchange")
  ) {
    return "valencia architecture historic building";
  }

  if (
    cleanQuery.toLowerCase().includes("valencia cathedral") ||
    cleanQuery.toLowerCase().includes("catedral de valencia")
  ) {
    return "spain cathedral church architecture";
  }

  if (
    cleanQuery.toLowerCase().includes("mercado central") ||
    cleanQuery.toLowerCase().includes("central market")
  ) {
    return "spain market food fresh";
  }

  if (
    cleanQuery.toLowerCase().includes("ciudad de las artes") ||
    cleanQuery.toLowerCase().includes("city of arts and sciences")
  ) {
    return "modern architecture futuristic building";
  }

  if (cleanQuery.toLowerCase().includes("plaza de la virgen")) {
    return "spain plaza square historic";
  }

  if (
    cleanQuery.toLowerCase().includes("jardí del túria") ||
    cleanQuery.toLowerCase().includes("turia garden")
  ) {
    return "park garden green valencia";
  }

  if (
    cleanQuery.toLowerCase().includes("museu de belles arts") ||
    cleanQuery.toLowerCase().includes("museum of fine arts")
  ) {
    return "art museum paintings";
  }

  if (cleanQuery.toLowerCase().includes("albufera")) {
    return "lake nature valencia";
  }

  if (cleanQuery.toLowerCase().includes("malvarrosa beach")) {
    return "beach spain mediterranean";
  }

  if (cleanQuery.toLowerCase().includes("el carmen")) {
    return "valencia old town historic";
  }

  // Clean up problematic adjectives that might relate to food
  cleanQuery = cleanQuery
    .replace(/\b(milanese|barcelonese|valencian|parisian)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Extract city name from address if provided
  let cityName = "";
  if (activityAddress) {
    // Look for Valencia/València specifically first
    if (
      activityAddress.toLowerCase().includes("valència") ||
      activityAddress.toLowerCase().includes("valencia")
    ) {
      cityName = "Valencia";
    } else {
      // General city pattern - look for city before postal code
      const cityMatch = activityAddress.match(
        /,\s*([A-Za-z\u00C0-\u017F]+(?:\s+[A-Za-z\u00C0-\u017F]+)*),?\s*(?:\d{4,})/i
      );
      if (cityMatch) {
        cityName = cityMatch[1];
      }
    }
  }

  // Barcelona-specific optimizations (keeping existing ones)
  if (cleanQuery.toLowerCase().includes("sagrada")) {
    return "Sagrada Familia Barcelona architecture Gaudi";
  } else if (cleanQuery.toLowerCase().includes("boqueria")) {
    return "La Boqueria market Barcelona food";
  } else if (cleanQuery.toLowerCase().includes("picasso")) {
    return "Picasso Museum Barcelona art";
  } else if (cleanQuery.toLowerCase().includes("gothic quarter")) {
    return "Gothic Quarter Barcelona medieval architecture";
  } else if (cleanQuery.toLowerCase().includes("park güell")) {
    return "Park Guell Barcelona Gaudi mosaic";
  }

  // General optimizations for restaurants/bars
  if (
    cleanQuery.toLowerCase().includes("taberna") ||
    cleanQuery.toLowerCase().includes("restaurante") ||
    cleanQuery.toLowerCase().includes("bar ") ||
    cleanQuery.toLowerCase().includes("lunch at") ||
    cleanQuery.toLowerCase().includes("dinner at")
  ) {
    // For restaurants, use more generic terms
    return "spanish food restaurant cuisine";
  }

  // Default: just add city name if available
  if (cityName && !cleanQuery.toLowerCase().includes(cityName.toLowerCase())) {
    return `${cleanQuery} ${cityName}`;
  }

  return cleanQuery;
}

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

    console.log(
      `🌐 Making request to: https://api.freepik.com/v1/resources?${searchParams}`
    );

    const response = await fetch(
      `https://api.freepik.com/v1/resources?${searchParams}`,
      {
        headers: {
          "x-freepik-api-key": FREEPIK_API_KEY,
          "Accept-Language": "en-US",
        },
      }
    );

    console.log(`📡 Response status: ${response.status}`);
    console.log(
      `📡 Response headers:`,
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Freepik API error: ${response.status} - ${errorText}`);
      return [];
    }

    const data = (await response.json()) as FreepikResponse;

    const imageUrls = data.data
      .map((image) => {
        return (
          image.thumbnails?.webp ||
          image.thumbnails?.jpg ||
          image.image?.preview_url ||
          image.image?.url ||
          ""
        );
      })
      .filter(Boolean);

    console.log(`✅ Found ${imageUrls.length} Freepik images`);

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

  // Barcelona-specific optimizations
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

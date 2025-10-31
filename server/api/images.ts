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
  activityAddress: string = "",
  activityCategory?: string,
  userInterests?: string[]
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

  // Clean up problematic adjectives that might relate to food or vague descriptions
  cleanQuery = cleanQuery
    .replace(/\b(milanese|barcelonese|valencian|parisian)\b/gi, "")
    .replace(
      /\b(charm|charming|beautiful|stunning|amazing|wonderful|lovely|historic|traditional|authentic|local|famous|popular|best|top)\b/gi,
      ""
    )
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

  // Context-aware optimization based on activity category and interests
  const categoryModifiers = getCategoryModifiers(
    activityCategory,
    userInterests
  );

  // If we have category modifiers, use them
  if (categoryModifiers) {
    const baseLocation = cityName || extractMainLocation(cleanQuery);
    return `${baseLocation} ${categoryModifiers}`;
  }

  // Legacy specific optimizations for known patterns
  if (isSpecificLandmark(cleanQuery)) {
    return applyLandmarkOptimizations(cleanQuery, cityName);
  }

  // Default: add city name if available and not already included
  if (cityName && !cleanQuery.toLowerCase().includes(cityName.toLowerCase())) {
    return `${cleanQuery} ${cityName}`;
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

function isSpecificLandmark(query: string): boolean {
  const landmarks = [
    "lonja de la seda",
    "silk exchange",
    "valencia cathedral",
    "catedral de valencia",
    "mercado central",
    "central market",
    "ciudad de las artes",
    "city of arts",
    "plaza de la virgen",
    "jardí del túria",
    "turia garden",
    "museu de belles arts",
    "albufera",
    "malvarrosa beach",
    "el carmen",
    "sagrada",
    "boqueria",
    "picasso",
    "gothic quarter",
    "park güell",
  ];

  const lowerQuery = query.toLowerCase();
  return landmarks.some((landmark) => lowerQuery.includes(landmark));
}

function applyLandmarkOptimizations(query: string, cityName: string): string {
  const lowerQuery = query.toLowerCase();

  // Valencia-specific optimizations
  if (
    lowerQuery.includes("lonja de la seda") ||
    lowerQuery.includes("silk exchange")
  ) {
    return "valencia architecture historic building";
  }
  if (
    lowerQuery.includes("valencia cathedral") ||
    lowerQuery.includes("catedral de valencia")
  ) {
    return "spain cathedral church architecture";
  }
  if (
    lowerQuery.includes("mercado central") ||
    lowerQuery.includes("central market")
  ) {
    return "spain market food fresh";
  }
  if (
    lowerQuery.includes("ciudad de las artes") ||
    lowerQuery.includes("city of arts and sciences")
  ) {
    return "modern architecture futuristic building";
  }
  if (lowerQuery.includes("plaza de la virgen")) {
    return "spain plaza square historic";
  }
  if (
    lowerQuery.includes("jardí del túria") ||
    lowerQuery.includes("turia garden")
  ) {
    return "park garden green valencia";
  }
  if (
    lowerQuery.includes("museu de belles arts") ||
    lowerQuery.includes("museum of fine arts")
  ) {
    return "art museum paintings";
  }
  if (lowerQuery.includes("albufera")) {
    return "lake nature valencia";
  }
  if (lowerQuery.includes("malvarrosa beach")) {
    return "beach spain mediterranean";
  }
  if (lowerQuery.includes("el carmen")) {
    return "valencia old town historic";
  }

  // Barcelona-specific optimizations
  if (lowerQuery.includes("sagrada")) {
    return "Sagrada Familia Barcelona architecture Gaudi";
  }
  if (lowerQuery.includes("boqueria")) {
    return "La Boqueria market Barcelona food";
  }
  if (lowerQuery.includes("picasso")) {
    return "Picasso Museum Barcelona art";
  }
  if (lowerQuery.includes("gothic quarter")) {
    return "Gothic Quarter Barcelona medieval architecture";
  }
  if (lowerQuery.includes("park güell")) {
    return "Park Guell Barcelona Gaudi mosaic";
  }

  // General restaurants/bars
  if (
    lowerQuery.includes("taberna") ||
    lowerQuery.includes("restaurante") ||
    lowerQuery.includes("bar ") ||
    lowerQuery.includes("lunch at") ||
    lowerQuery.includes("dinner at")
  ) {
    return "spanish food restaurant cuisine";
  }

  // Default: add city name if available
  if (cityName && !lowerQuery.includes(cityName.toLowerCase())) {
    return `${query} ${cityName}`;
  }

  return query;
}

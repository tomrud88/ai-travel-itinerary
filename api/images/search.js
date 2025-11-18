// Vercel Serverless Function for Freepik Image Search

// Rate limiting for Freepik API - Budget: Max 5 EUR/month
class FreepikRateLimit {
  static lastRequestTime = 0;
  static requestCount = 0;
  static dailyRequestCount = 0;
  static monthlyRequestCount = 0;
  static lastResetDate = new Date().getDate();
  static lastResetMonth = new Date().getMonth();
  static MAX_REQUESTS_PER_MINUTE = 30;
  static MAX_DAILY_REQUESTS = 300;
  static MAX_MONTHLY_REQUESTS = 3000;
  static MIN_INTERVAL = 500;

  static async enforceLimit() {
    const now = Date.now();
    const currentDate = new Date().getDate();
    const currentMonth = new Date().getMonth();

    // Reset monthly counter at start of new month
    if (currentMonth !== this.lastResetMonth) {
      this.monthlyRequestCount = 0;
      this.dailyRequestCount = 0;
      this.requestCount = 0;
      this.lastResetMonth = currentMonth;
      this.lastResetDate = currentDate;
      console.log("🔄 Freepik rate limit counters reset for new month");
    }

    // Reset daily counter at midnight
    if (currentDate !== this.lastResetDate) {
      this.dailyRequestCount = 0;
      this.requestCount = 0;
      this.lastResetDate = currentDate;
      console.log("🔄 Freepik daily counters reset");
    }

    // Check monthly free tier limit
    if (this.monthlyRequestCount >= this.MAX_MONTHLY_REQUESTS) {
      throw new Error(
        `🚫 Monthly Freepik free tier limit reached (${this.MAX_MONTHLY_REQUESTS} requests). Please wait until next month.`
      );
    }

    // Check daily limit
    if (this.dailyRequestCount >= this.MAX_DAILY_REQUESTS) {
      throw new Error(
        `Freepik daily API limit reached (${this.MAX_DAILY_REQUESTS} requests). Please try again tomorrow.`
      );
    }

    // Reset minute counter if more than a minute has passed
    if (now - this.lastRequestTime > 60000) {
      this.requestCount = 0;
    }

    // Check per-minute limit
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      throw new Error(
        `Freepik rate limit exceeded (${this.MAX_REQUESTS_PER_MINUTE} requests per minute). Please wait before making more requests.`
      );
    }

    // Enforce minimum interval between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_INTERVAL) {
      const waitTime = this.MIN_INTERVAL - timeSinceLastRequest;
      console.log(
        `⏳ Freepik rate limiting: waiting ${waitTime}ms before API call`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
    this.dailyRequestCount++;
    this.monthlyRequestCount++;

    console.log(`📊 Freepik Usage Tracking:`);
    console.log(
      `   Monthly: ${this.monthlyRequestCount}/${this.MAX_MONTHLY_REQUESTS} requests`
    );
    console.log(
      `   Daily: ${this.dailyRequestCount}/${this.MAX_DAILY_REQUESTS} requests`
    );
  }
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔧 Freepik API handler started");
    console.log("📋 Request body:", req.body);

    const { activityName, limit = 1, orientation = "horizontal" } = req.body;

    if (!activityName) {
      console.log("❌ No activity name provided");
      return res.status(400).json({ error: "Activity name is required" });
    }

    const FREEPIK_API_KEY = process.env.VITE_FREEPIK_API_KEY;
    console.log("🔑 API Key check:", FREEPIK_API_KEY ? "Present" : "Missing");

    if (!FREEPIK_API_KEY) {
      console.log("⚠️ No Freepik API key available");
      return res.status(200).json({ query: query, images: [], count: 0 });
    }

    // Clean up query
    let query = activityName
      .replace(
        /\b(?:relaxed|cultural|historic|beautiful|amazing|wonderful|exciting|authentic|traditional|best|top|local)\b/gi,
        ""
      )
      .replace(/\s+/g, " ")
      .trim();

    console.log(`🔍 Cleaned query: "${query}"`);

    // Enforce rate limiting before API call
    await FreepikRateLimit.enforceLimit();

    console.log(`🔍 Making Freepik API request for: "${query}"`);

    // Build search parameters - try to get image data with preview URLs
    const searchParams = new URLSearchParams({
      term: query,
      limit: limit.toString(),
      page: "1",
      order: "relevance",
      "filters[content_type][photo]": "1", // Only photos
      "filters[license][freemium]": "1", // Include freemium content
    });

    console.log(`🔍 Trying to get preview/download URLs for Freepik images`);

    // Add orientation filter if specified
    if (orientation === "horizontal") {
      searchParams.set("filters[orientation][horizontal]", "1");
      console.log(`🔄 Applied horizontal orientation filter for: "${query}"`);
    } else if (orientation === "vertical") {
      searchParams.set("filters[orientation][vertical]", "1");
      console.log(`🔄 Applied vertical orientation filter for: "${query}"`);
    }

    const fullUrl = `https://api.freepik.com/v1/resources?${searchParams}`;
    console.log(`🌐 Making request to: ${fullUrl}`);

    // Make the actual Freepik API request using fetch instead of axios
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
      return res.status(200).json({ query: query, images: [], count: 0 });
    }

    const data = await response.json();
    console.log(`📊 API Response structure check:`);
    console.log(`   - Response keys: [${Object.keys(data || {}).join(", ")}]`);
    console.log(`   - data field type: ${typeof data.data}`);
    console.log(`   - data field is array: ${Array.isArray(data.data)}`);
    console.log(`   - data length: ${data.data ? data.data.length : "N/A"}`);
    console.log(`📊 Full API Response:`, JSON.stringify(data, null, 2));

    // Log first item structure in detail if available
    if (data.data && data.data.length > 0) {
      console.log(`🔍 First item structure:`, {
        id: data.data[0].id,
        url: data.data[0].url,
        image: data.data[0].image,
        thumbnails: data.data[0].thumbnails,
        allKeys: Object.keys(data.data[0]),
      });
    }

    // Handle the response structure from Freepik API v1
    const images = data.data || [];

    if (!Array.isArray(images)) {
      console.log("❌ No valid data array in response structure");
      console.log("   Available fields:", Object.keys(data || {}));
      return res.status(200).json({ query: query, images: [], count: 0 });
    }

    if (images.length === 0) {
      console.log(`❌ Empty results from Freepik for query: "${query}"`);

      // Try a simplified fallback query
      const fallbackQuery = query.split(" ")[0]; // Just use first word
      if (fallbackQuery !== query && fallbackQuery.length > 3) {
        console.log(`🔄 Trying fallback query: "${fallbackQuery}"`);

        const fallbackParams = new URLSearchParams({
          term: fallbackQuery,
          limit: limit.toString(),
          page: "1",
          order: "relevance",
          "filters[content_type][photo]": "1",
          "filters[license][freemium]": "1",
        });

        const fallbackUrl = `https://api.freepik.com/v1/resources?${fallbackParams}`;
        console.log(`🌐 Fallback request to: ${fallbackUrl}`);

        try {
          const fallbackResponse = await fetch(fallbackUrl, {
            headers: {
              "x-freepik-api-key": FREEPIK_API_KEY,
              "Accept-Language": "en-US",
            },
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            console.log(
              `📊 Fallback response length: ${
                fallbackData.data ? fallbackData.data.length : 0
              }`
            );
            if (fallbackData.data && fallbackData.data.length > 0) {
              console.log(`✅ Using fallback results for: "${fallbackQuery}"`);
              const fallbackImages = fallbackData.data;
              // Use same logic for fallback too
              const fallbackImageUrls = fallbackData.data
                .map((image) => {
                  const imageUrl = image.image?.source?.url;
                  if (!imageUrl) return null;

                  return {
                    id: image.id || Math.random().toString(),
                    url: imageUrl,
                    thumbnail: imageUrl,
                    title: image.title || image.description || "Travel Image",
                    tags: image.tags || [],
                  };
                })
                .filter((item) => Boolean(item));

              const processedFallback = fallbackImageUrls;

              if (processedFallback.length > 0) {
                console.log(
                  `✅ Returning ${processedFallback.length} fallback images`
                );
                const fallbackResponse = {
                  query: fallbackQuery,
                  images: processedFallback,
                  count: processedFallback.length,
                };
                return res.status(200).json(fallbackResponse);
              }
            }
          }
        } catch (fallbackError) {
          console.log(`❌ Fallback query failed:`, fallbackError.message);
        }
      }

      return res.status(200).json({ query: query, images: [], count: 0 });
    }

    // Test accessibility of the first URL
    if (images.length > 0 && images[0].url) {
      console.log(
        `🔗 Testing accessibility of first image URL: ${images[0].url}`
      );
      try {
        const testResponse = await fetch(images[0].url, {
          method: "HEAD",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        console.log(
          `📡 Image URL test response: ${testResponse.status} - ${testResponse.statusText}`
        );
        console.log(
          `📡 Image headers:`,
          Object.fromEntries(testResponse.headers.entries())
        );
      } catch (testError) {
        console.log(`❌ Image URL test failed:`, testError.message);
      }
    }

    // Use exact same logic as working local version: extract from image.image?.source?.url
    const imageUrls = data.data
      .map((image) => {
        // Extract the real image URL from the response - same as local version
        const imageUrl = image.image?.source?.url;
        if (!imageUrl) {
          console.log(`No image.image.source.url for item ${image.id}`);
          return null;
        }

        console.log("Processing Freepik image:", {
          id: image.id,
          imageUrl: imageUrl,
          title: image.title,
        });
        return {
          id: image.id || Math.random().toString(),
          url: imageUrl,
          thumbnail: imageUrl,
          title: image.title || image.description || "Travel Image",
          tags: image.tags || [],
        };
      })
      .filter((item) => Boolean(item));

    console.log(`✅ Found ${imageUrls.length} Freepik images with direct URLs`);
    console.log(
      `🖼️ Image URLs:`,
      imageUrls.map((img) => ({ id: img.id, url: img.url }))
    );

    const processedImages = imageUrls;

    console.log(
      `✅ Found ${processedImages.length} valid images for "${query}"`
    );

    // Return in the format expected by frontend: { images: [...], query: "...", count: N }
    const responseData = {
      query: query,
      images: processedImages,
      count: processedImages.length,
    };

    console.log(`📤 Returning response:`, responseData);
    return res.status(200).json(responseData);
  } catch (error) {
    console.error("💥 Freepik API error:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params,
        headers: error.config?.headers,
      },
    });

    if (error.response?.status === 429) {
      return res.status(200).json({ query: query || "", images: [], count: 0 });
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error("🔑 API Key issue - check VITE_FREEPIK_API_KEY");
      return res.status(200).json({ query: query || "", images: [], count: 0 });
    }

    // For any other error, return empty array to prevent breaking the UI
    return res.status(200).json({ query: query || "", images: [], count: 0 });
  }
};

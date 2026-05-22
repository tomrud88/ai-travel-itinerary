// Vercel Serverless Function for Pexels Image Search
// Docs: https://www.pexels.com/api/documentation/
// Rate limit: 200 requests/hour, 20,000 requests/month

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
    const { activityName, limit = 1, orientation = "horizontal" } = req.body;

    if (!activityName) {
      return res.status(400).json({ error: "Activity name is required" });
    }

    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

    if (!PEXELS_API_KEY) {
      console.log("No Pexels API key available");
      return res
        .status(200)
        .json({ query: activityName, images: [], count: 0 });
    }

    // Clean up query
    const query = activityName
      .replace(
        /\b(?:relaxed|cultural|historic|beautiful|amazing|wonderful|exciting|authentic|traditional|best|top|local)\b/gi,
        "",
      )
      .replace(/\s+/g, " ")
      .trim();

    console.log(`Pexels search for: "${query}"`);

    // Pexels uses: landscape | portrait | square
    const pexelsOrientation =
      orientation === "horizontal"
        ? "landscape"
        : orientation === "vertical"
          ? "portrait"
          : "landscape";

    const makeRequest = async (searchQuery) => {
      const searchParams = new URLSearchParams({
        query: searchQuery,
        per_page: limit.toString(),
        orientation: pexelsOrientation,
      });

      const url = `https://api.pexels.com/v1/search?${searchParams}`;
      console.log(`Requesting: ${url}`);

      const response = await fetch(url, {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      });

      console.log(`Pexels response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Pexels API error: ${response.status} - ${errorText}`);
        return null;
      }

      const data = await response.json();
      return data.photos || [];
    };

    let photos = await makeRequest(query);

    // Fallback to first keyword if no results
    if (photos !== null && photos.length === 0) {
      const fallbackQuery = query.split(" ")[0];
      if (
        fallbackQuery &&
        fallbackQuery !== query &&
        fallbackQuery.length > 3
      ) {
        console.log(`Trying fallback query: "${fallbackQuery}"`);
        photos = await makeRequest(fallbackQuery);
      }
    }

    if (!photos || photos.length === 0) {
      console.log(`No Pexels results for: "${query}"`);
      return res.status(200).json({ query, images: [], count: 0 });
    }

    const images = photos.map((photo) => ({
      id: photo.id.toString(),
      url: photo.src.large2x || photo.src.large || photo.src.original,
      thumbnail: photo.src.medium,
      title: photo.alt || query,
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      pexels_url: photo.url,
    }));

    console.log(`Found ${images.length} Pexels images for "${query}"`);
    return res.status(200).json({ query, images, count: images.length });
  } catch (error) {
    console.error("Pexels API error:", error.message);
    return res.status(200).json({ query: "", images: [], count: 0 });
  }
};

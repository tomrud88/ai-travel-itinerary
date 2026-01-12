const { GoogleGenerativeAI } = require("@google/generative-ai");

// Rate limiting storage (in-memory for serverless)
const requestLog = new Map();

// Clean up old entries periodically
function cleanupOldEntries() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  for (const [key, timestamp] of requestLog.entries()) {
    if (timestamp < oneHourAgo) {
      requestLog.delete(key);
    }
  }
}

// Simple rate limiting - allow multiple models to try
function checkRateLimit(ip) {
  cleanupOldEntries();

  const now = Date.now();
  const requestTimes = requestLog.get(ip) || [];

  // Allow max 10 requests per minute per IP
  const oneMinuteAgo = now - 60000;
  const recentRequests = requestTimes.filter((time) => time > oneMinuteAgo);

  if (recentRequests.length >= 10) {
    return {
      allowed: false,
      waitTime: 60000,
    };
  }

  recentRequests.push(now);
  requestLog.set(ip, recentRequests);
  return { allowed: true };
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
    // Rate limiting check
    const clientIp =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown";
    const rateLimit = checkRateLimit(clientIp);

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: `Please wait ${Math.ceil(
          rateLimit.waitTime / 1000
        )} seconds before making another request`,
        retryAfter: Math.ceil(rateLimit.waitTime / 1000),
      });
    }

    // Get API key from environment variable (NEVER expose to client)
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      console.error(
        "❌ GOOGLE_AI_API_KEY not configured in environment variables"
      );
      return res.status(500).json({
        error: "API key not configured",
        message:
          "The server is not properly configured. Please contact the administrator.",
      });
    }

    // Get request body
    const { prompt, modelName = "gemini-2.0-flash-lite" } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: "Missing required field",
        message: "Prompt is required",
      });
    }

    console.log(`🤖 Generating itinerary with model: ${modelName}`);
    console.log(`📝 Prompt length: ${prompt.length} characters`);

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    const response = await result.response;
    const text = response.text();

    console.log(`✅ Successfully generated itinerary (${text.length} chars)`);

    // Return the generated text
    return res.status(200).json({
      success: true,
      text,
      model: modelName,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error generating itinerary:", error);

    // Check for specific error types
    if (error.message?.includes("API key not valid")) {
      return res.status(401).json({
        error: "Invalid API key",
        message:
          "The API key is invalid or has been revoked. Please check your configuration.",
      });
    }

    if (
      error.message?.includes("quota") ||
      error.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      return res.status(429).json({
        error: "Quota exceeded",
        message: "The API quota has been exceeded. Please try again later.",
      });
    }

    if (error.message?.includes("suspended")) {
      return res.status(403).json({
        error: "API key suspended",
        message:
          "The API key has been suspended. Please generate a new API key.",
      });
    }

    // Generic error response
    return res.status(500).json({
      error: "Internal server error",
      message:
        error.message ||
        "An unexpected error occurred while generating the itinerary",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

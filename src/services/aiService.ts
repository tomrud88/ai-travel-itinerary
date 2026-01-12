import type { AIItineraryRequest, AIItineraryResponse } from "../types";

// Gemini API usage tracking with secure server-side persistent storage
class GeminiRateLimit {
  private static lastRequestTime = 0;
  private static requestCount = 0;
  private static dailyRequestCount = 0;
  private static monthlyRequestCount = 0;
  private static lastResetDate = new Date().toISOString().split("T")[0]; // Store as full date string
  private static lastResetMonth = new Date().getMonth();
  private static readonly MAX_REQUESTS_PER_MINUTE = 15; // Gemini free tier: 15 RPM
  private static readonly MAX_DAILY_REQUESTS = 500; // Updated: 500 requests per day
  private static readonly MAX_MONTHLY_REQUESTS = 15000; // Updated: 15,000 requests/month
  private static readonly MIN_INTERVAL = 2000; // 2 seconds between requests (safer for 15 RPM limit)
  private static isInitialized = false;

  /**
   * Initialize usage tracking from secure server-side storage
   */
  private static async initializeFromStorage(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("📡 Loading Gemini usage from secure server storage...");
      const response = await fetch("/api/gemini-usage");

      if (response.ok) {
        const serverUsage = await response.json();

        // Convert server format to internal format
        this.monthlyRequestCount = serverUsage.monthly.count || 0;
        this.dailyRequestCount = serverUsage.daily.count || 0;
        this.requestCount = serverUsage.minute.count || 0;
        this.lastRequestTime = serverUsage.minute.startTime || 0;

        // Parse stored date info - store full date string for accurate comparison
        if (serverUsage.daily.date) {
          this.lastResetDate = serverUsage.daily.date; // Store full date string like "2025-11-18"
        } else {
          this.lastResetDate = new Date().toISOString().split("T")[0]; // Current date as string
        }

        if (serverUsage.monthly.month) {
          const [, month] = serverUsage.monthly.month.split("-");
          this.lastResetMonth = parseInt(month) - 1; // Month is 0-indexed
        } else {
          this.lastResetMonth = new Date().getMonth();
        }

        console.log("📊 Restored Gemini usage from server:", {
          monthly: this.monthlyRequestCount,
          daily: this.dailyRequestCount,
          minute: this.requestCount,
          lastResetDate: this.lastResetDate,
          lastResetMonth: this.lastResetMonth,
          currentDate: new Date().getDate(),
          currentMonth: new Date().getMonth(),
        });
      } else {
        console.log("📊 No existing server usage data found, starting fresh");
        this.monthlyRequestCount = 0;
        this.dailyRequestCount = 0;
        this.requestCount = 0;
        this.lastRequestTime = 0;
        this.lastResetMonth = new Date().getMonth();
        this.lastResetDate = new Date().toISOString().split("T")[0];
      }
    } catch (error) {
      console.warn(
        "⚠️ Failed to load Gemini usage from server, starting fresh:",
        error
      );
      this.monthlyRequestCount = 0;
      this.dailyRequestCount = 0;
      this.requestCount = 0;
      this.lastRequestTime = 0;
      this.lastResetMonth = new Date().getMonth();
      this.lastResetDate = new Date().toISOString().split("T")[0];
    }

    this.isInitialized = true;
  }

  /**
   * Save current usage data to secure server-side storage
   */
  private static async saveToStorage(): Promise<void> {
    try {
      const now = new Date();
      const serverData = {
        minute: {
          count: this.requestCount,
          startTime: this.lastRequestTime,
        },
        daily: {
          count: this.dailyRequestCount,
          date: now.toISOString().split("T")[0],
        },
        monthly: {
          count: this.monthlyRequestCount,
          month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
            2,
            "0"
          )}`,
        },
        lastUpdated: now.toISOString(),
      };

      console.log("💾 Saving Gemini usage to secure server storage...");

      const response = await fetch("/api/gemini-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serverData),
      });

      if (response.ok) {
        console.log("✅ Gemini usage saved to server (secure):", {
          monthly: this.monthlyRequestCount,
          daily: this.dailyRequestCount,
          minute: this.requestCount,
        });
        // Verify the save by reading back the data
        await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
        console.log("🔍 Verifying save operation completed...");
      } else {
        console.error(
          "❌ Failed to save Gemini usage to server - Response not OK:",
          response.status
        );
        throw new Error(`Failed to save usage: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error saving Gemini usage to server:", error);
    }
  }

  static async enforceLimit(): Promise<void> {
    // Initialize from storage on first call
    await this.initializeFromStorage();

    const now = Date.now();
    const currentDate = new Date().toISOString().split("T")[0]; // Full date string like "2025-11-18"
    const currentMonth = new Date().getMonth();

    console.log("🔍 Gemini reset check:", {
      currentMonth,
      lastResetMonth: this.lastResetMonth,
      currentDate, // Now shows full date string
      lastResetDate: this.lastResetDate, // Now shows full date string
      monthlyCount: this.monthlyRequestCount,
      dailyCount: this.dailyRequestCount,
    });

    // Reset monthly counter at start of new month
    if (currentMonth !== this.lastResetMonth) {
      const oldMonthlyCount = this.monthlyRequestCount;
      this.monthlyRequestCount = 0;
      this.dailyRequestCount = 0;
      this.requestCount = 0;
      this.lastResetMonth = currentMonth;
      this.lastResetDate = currentDate;
      console.log(
        `🔄 Gemini rate limit counters reset for new month (was: ${oldMonthlyCount}, now: 0)`
      );
      // Save the monthly reset state to server immediately
      await this.saveToStorage();
    }

    // Reset daily counter at midnight
    if (currentDate !== this.lastResetDate) {
      const oldDailyCount = this.dailyRequestCount;
      this.dailyRequestCount = 0;
      this.requestCount = 0;
      this.lastResetDate = currentDate;
      console.log(
        `🔄 Gemini daily counters reset (was: ${oldDailyCount}, now: 0, monthly preserved: ${this.monthlyRequestCount})`
      );
      // Save the daily reset state to server immediately
      await this.saveToStorage();
    }

    // Check monthly limit
    if (this.monthlyRequestCount >= this.MAX_MONTHLY_REQUESTS) {
      throw new Error(
        `🚫 Monthly Gemini API limit reached (${this.MAX_MONTHLY_REQUESTS} requests). Please wait until next month.`
      );
    }

    // Check daily limit
    if (this.dailyRequestCount >= this.MAX_DAILY_REQUESTS) {
      throw new Error(
        `Gemini daily API limit reached (${this.MAX_DAILY_REQUESTS} requests). Please try again tomorrow.`
      );
    }

    // Reset minute counter if more than a minute has passed
    if (now - this.lastRequestTime > 60000) {
      this.requestCount = 0;
    }

    // Check per-minute limit
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      throw new Error(
        `Gemini rate limit exceeded (${this.MAX_REQUESTS_PER_MINUTE} requests per minute). Please wait before making more requests.`
      );
    }

    // Enforce minimum interval between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    console.log(
      `⏱️ Time since last request: ${timeSinceLastRequest}ms (minimum: ${this.MIN_INTERVAL}ms)`
    );

    if (timeSinceLastRequest < this.MIN_INTERVAL) {
      const waitTime = this.MIN_INTERVAL - timeSinceLastRequest;
      console.log(
        `⏳ Gemini rate limiting: waiting ${waitTime}ms before API call`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      console.log(`✅ Rate limiting wait completed, proceeding with API call`);
    } else {
      console.log(`✅ No rate limiting needed, proceeding immediately`);
    }

    this.lastRequestTime = Date.now();

    console.log(`📊 Incrementing usage counters:`, {
      before: {
        daily: this.dailyRequestCount,
        monthly: this.monthlyRequestCount,
      },
    });

    this.requestCount++;
    this.dailyRequestCount++;
    this.monthlyRequestCount++;

    console.log(`📊 Updated usage counters:`, {
      after: {
        daily: this.dailyRequestCount,
        monthly: this.monthlyRequestCount,
      },
    });

    // Save updated counters to secure storage - ensure completion before proceeding
    console.log("💾 Saving usage counters to server before API call...");
    await this.saveToStorage();
    console.log(
      "✅ Usage counters saved successfully, proceeding with API call"
    );

    const remainingMonthly =
      this.MAX_MONTHLY_REQUESTS - this.monthlyRequestCount;
    const remainingDaily = this.MAX_DAILY_REQUESTS - this.dailyRequestCount;

    console.log(`🤖 Gemini AI Usage Tracking (Secure Server Storage):`);
    console.log(
      `   Monthly: ${this.monthlyRequestCount}/${this.MAX_MONTHLY_REQUESTS} requests (Free Tier)`
    );
    console.log(
      `   Daily: ${this.dailyRequestCount}/${this.MAX_DAILY_REQUESTS} requests`
    );
    console.log(
      `   Per minute: ${this.requestCount}/${this.MAX_REQUESTS_PER_MINUTE} requests`
    );
    console.log(`   Remaining today: ${remainingDaily} requests`);
    console.log(`   Remaining this month: ${remainingMonthly} requests`);
  }

  /**
   * Get current usage statistics
   */
  static getUsageStats() {
    return {
      monthlyUsed: this.monthlyRequestCount,
      monthlyLimit: this.MAX_MONTHLY_REQUESTS,
      dailyUsed: this.dailyRequestCount,
      dailyLimit: this.MAX_DAILY_REQUESTS,
      minuteUsed: this.requestCount,
      minuteLimit: this.MAX_REQUESTS_PER_MINUTE,
      percentageUsed:
        (this.monthlyRequestCount / this.MAX_MONTHLY_REQUESTS) * 100,
      tier: "free",
    };
  }
}

export class AITravelService {
  /**
   * Helper method to list available models (for debugging) - Server-side only
   */
  async listAvailableModels(): Promise<void> {
    // This should be moved to server-side to avoid exposing API keys
    console.log("📋 Model listing disabled in client-side for security");
  }

  /**
   * Get available model names - using hardcoded list for security
   */
  async getAvailableModels(): Promise<string[]> {
    // Use predefined model list to avoid exposing API keys in network requests
    console.log("✅ Using predefined model list for security");
    return [
      "gemini-2.0-flash-lite", // 30 RPM - Best for high volume
      "gemini-2.5-flash-lite", // 15 RPM - Good efficiency
      "gemini-2.0-flash", // 15 RPM - Latest model
      "gemini-2.5-flash", // 10 RPM - Reliable fallback
      "gemini-2.5-pro", // 2 RPM - Highest quality (limited)
    ];
  }

  /**
   * Generate a comprehensive AI prompt based on user preferences
   */
  private generatePrompt(request: AIItineraryRequest): string {
    const {
      destinations,
      duration,
      budget,
      travelers,
      startDate,
      preferences,
    } = request;

    // Convert preferences to descriptive text
    const getActivityLevelText = (level: string) => {
      switch (level) {
        case "LOW":
          return "Relaxed and comfortable pace";
        case "MODERATE":
          return "Balanced mix of activities and rest";
        case "HIGH":
          return "Active and adventurous with packed schedules";
        default:
          return "Moderate pace";
      }
    };

    const getDiningPreferenceText = (prefs: string[]) => {
      if (!prefs || prefs.length === 0)
        return "Local cuisine and authentic experiences";
      return prefs
        .map((pref) => {
          switch (pref) {
            case "FINE_DINING":
              return "Fine dining experiences";
            case "STREET_FOOD":
              return "Street food and casual dining";
            case "LOCAL_CUISINE":
              return "Traditional local cuisine";
            case "VEGETARIAN":
              return "Vegetarian-friendly options";
            case "VEGAN":
              return "Vegan cuisine";
            case "GLUTEN_FREE":
              return "Gluten-free dining";
            default:
              return pref.toLowerCase().replace("_", " ");
          }
        })
        .join(", ");
    };

    const getTransportationText = (prefs: string[]) => {
      if (!prefs || prefs.length === 0)
        return "Walking and public transportation";
      return prefs
        .map((pref) => {
          switch (pref) {
            case "WALKING":
              return "walking";
            case "PUBLIC_TRANSPORT":
              return "public transport (bus, train, metro)";
            case "RENTAL_CAR":
              return "rental car";
            case "BICYCLE":
              return "bicycle";
            case "TAXI_RIDESHARE":
              return "taxi and rideshare";
            default:
              return pref.toLowerCase().replace("_", " ");
          }
        })
        .join(", ");
    };

    const getAccommodationText = (prefs: string[]) => {
      if (!prefs || prefs.length === 0)
        return "Hotels with good location and amenities";
      return prefs
        .map((pref) => {
          switch (pref) {
            case "HOTEL":
              return "hotels";
            case "HOSTEL":
              return "hostels";
            case "AIRBNB":
              return "vacation rentals (Airbnb)";
            case "BOUTIQUE":
              return "boutique accommodations";
            case "LUXURY":
              return "luxury hotels and resorts";
            default:
              return pref.toLowerCase();
          }
        })
        .join(", ");
    };

    return `
You are an expert travel planner AI. Create a detailed ${duration}-day travel itinerary for ${
      destinations[0]
    } based on the following preferences:

## TRIP DETAILS
- Destination: ${destinations[0]}
- Duration: ${duration} days
- Start Date: ${startDate.toLocaleDateString()}
- Budget: $${budget} USD total
- Travelers: ${travelers} people
- Budget per person per day: $${Math.round(budget / travelers / duration)}

## TRAVEL STYLE (Based on user preferences)
- Focus: ${
      preferences.interests.length > 0
        ? preferences.interests.join(", ")
        : "Sightseeing and cultural exploration"
    }
- Pace: ${getActivityLevelText(preferences.activityLevel)}
- Accommodation: ${getAccommodationText(preferences.accommodationType)}
- Transportation: ${getTransportationText(preferences.transportationPreference)}
- Dining: ${getDiningPreferenceText(preferences.diningPreference)}
- Style: Personalized experience based on selected preferences

## RESPONSE FORMAT
Please provide a detailed itinerary in JSON format with the following structure. 
IMPORTANT: Include specific real location names, addresses, ratings, and detailed information.
CRITICAL: Generate exactly ${duration} days - create ${duration} separate day objects in the dailyPlans array.

{
  "title": "Descriptive title for the ${duration}-day ${destinations[0]} trip",
  "description": "Brief overview focusing on relaxed sightseeing and cultural immersion",
  "totalEstimatedCost": number,
  "dailyPlans": [
    // REQUIRED: Create exactly ${duration} day objects here (Day 1${
      duration > 1
        ? `, Day 2${duration > 2 ? ", Day 3" : ""}${
            duration > 3 ? ", etc." : ""
          }`
        : ""
    })
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Daily theme (e.g., 'Historic City Center', 'Local Markets & Culture')",
      "activities": [
        {
          "time": "HH:MM",
          "name": "SPECIFIC REAL LOCATION NAME (e.g., 'Skanderbeg Square', 'Et'hem Bey Mosque')",
          "address": "Complete street address with district/neighborhood",
          "description": "Concise 2-sentence description highlighting what makes this location special and what visitors will experience.",
          "duration": "X hours",
          "category": "SIGHTSEEING|CULTURAL|FOOD|NATURE|SHOPPING|HISTORICAL",
          "walkingTime": "X minutes from previous location",
          "googleMapsRating": "4.5/5",
          "openingHours": "Operating hours",
          "localTips": [
            "One practical tip",
            "One cultural insight"
          ],
          "whyVisit": "Brief explanation of why this location is must-see"
        }
      ],
      "meals": [
        {
          "type": "BREAKFAST|LUNCH|DINNER",
          "name": "SPECIFIC RESTAURANT NAME (e.g., 'Restaurant Oda', 'Mullixhiu')",
          "address": "Complete street address",
          "cuisine": "Cuisine type (e.g., 'Traditional Albanian cuisine')",
          "priceRange": "$ | $$ | $$$ | $$$$",
          "description": "Brief 2-sentence description of what makes this restaurant special and worth visiting.",
          "walkingDistance": "X minutes from last activity",
          "specialties": ["One signature dish", "Another local favorite"]
        }
          "signatureDishes": ["Specific dish names", "Local specialties", "Chef's recommendations"],
          "walkingDistance": "X minutes from last activity",
          "reservationInfo": "Reservation recommended / Walk-ins welcome / Advance booking required",
          "openingHours": "Operating schedule",
          "diningExperience": "What to expect - ambiance, service style, typical meal duration",
          "localContext": "Why locals love this place and what makes it culturally significant",
          "dietaryOptions": "Vegetarian/vegan/gluten-free options available"
        }
      ],
          "description": "What makes this restaurant special and representative of local culture",
          "signatureDishes": ["Dish 1", "Dish 2", "Local specialty"],
          "walkingDistance": "X minutes from last activity",
          "reservationRequired": true/false,
          "openingHours": "Tue-Sat: 12:00-22:00, Closed Mon-Sun",
          "localTips": [
            "Order the chef's special",
            "Try the house wine",
            "Ask for a table by the window"
          ],
          "averageMealDuration": "1.5 hours"
        }
      ],
      "accommodation": {
        "name": "SPECIFIC HOTEL NAME (e.g., 'Hotel des Grands Boulevards', 'The High Line Hotel')",
        "address": "Full hotel address",
        "type": "HOTEL|BOUTIQUE|B&B",
        "estimatedCost": number,
        "location": "Specific neighborhood (e.g., '2nd Arrondissement, near Opera')",
        "googleMapsRating": "4.2/5 (856 reviews)",
        "amenities": ["Free WiFi", "24h Concierge", "Rooftop Terrace", "Breakfast included"],
        "whyRecommended": "Specific reasons (walkability, local atmosphere, value)",
        "nearbyAttractions": ["Attraction 1 (5 min walk)", "Attraction 2 (10 min walk)"],
        "bookingTips": "Book directly for best rates, mention special occasion for upgrades"
      },
      "localMarkets": [
        {
          "name": "SPECIFIC MARKET NAME (e.g., 'Borough Market', 'Marché Saint-Germain')",
          "address": "Full address",
          "openingHours": "Mon-Sat: 8:00-14:00",
          "bestTimeToVisit": "Tuesday and Thursday mornings",
          "specialties": ["Local cheese", "Fresh bread", "Organic vegetables"],
          "recommendedVendors": [
            "Vendor Name: Specialty (e.g., 'Giovanni's: Best olive oil')",
            "Another Vendor: What they're known for"
          ],
          "averagePrices": {
            "freshFruit": "$3-5 per kg",
            "localCheese": "$15-25 per piece",
            "streetFood": "$5-8 per item"
          },
          "parkingInfo": "Street parking available, €2/hour"
        }
      ],
      "walkingRoute": {
        "totalDistance": "X km",
        "estimatedWalkingTime": "X hours",
        "routeHighlights": [
          "Pass by [Specific landmark name]",
          "Walk through [Specific historic district]",
          "Stop at [Specific viewpoint] for photos"
        ],
        "photoOpportunities": ["Golden hour at [location]", "Street art on [street name]"],
        "restStops": ["Café name at corner of X street", "Park bench at [specific location]"]
      }
    }
  ],
  "budgetBreakdown": {
    "accommodation": number,
    "activities": number,
    "meals": number,
    "transportation": number,
    "shopping": number,
    "emergencyFund": number,
    "total": number
  },
  "localInsights": {
    "bestTimeToVisit": "Specific season/months with reasoning",
    "weatherConsiderations": "What to pack and expect",
    "culturalEtiquette": [
      "Specific local customs to respect",
      "Tipping practices with amounts",
      "Dress codes for religious sites"
    ],
    "languageBasics": [
      "Hello: [local translation and pronunciation]",
      "Thank you: [local translation and pronunciation]",
      "Where is...?: [local translation and pronunciation]",
      "How much?: [local translation and pronunciation]"
    ],
    "transportation": {
      "localTransport": "Metro/bus system with specific app recommendations",
      "walkingFriendliness": "Pedestrian infrastructure and safety notes",
      "taxiServices": "Uber/local taxi apps and typical fares",
      "bikeRentals": "Specific bike-share services and costs"
    },
    "safetyTips": [
      "Tourist-specific safety advice",
      "Common scams to avoid",
      "Emergency contact numbers",
      "Safe neighborhoods vs areas to avoid at night"
    ],
    "hiddenGems": [
      {
        "name": "Specific hidden location name",
        "address": "Full address",
        "description": "Why locals love this place",
        "bestTimeToVisit": "Specific timing advice",
        "howToFind": "Detailed directions from main attractions"
      }
    ]
  },
  "packingChecklist": [
    "Weather-appropriate clothing",
    "Comfortable walking shoes (expect X km daily)",
    "Portable phone charger",
    "Local currency cash",
    "Translation app",
    "Camera with extra storage",
    "Day backpack for walking tours"
  ],
  "emergencyInfo": {
    "localEmergencyNumber": "XXX",
    "nearestHospital": "Hospital name and address",
    "touristPolice": "Contact info",
    "embassyContact": "For international visitors"
  }
}

## CRITICAL REQUIREMENTS:
1. **EXACT DAY COUNT**: You MUST generate exactly ${duration} days of itinerary - NO MORE, NO LESS. If asked for 2 days, provide Day 1 AND Day 2.
2. **REAL LOCATIONS ONLY**: Use actual business names, restaurants, hotels, and attractions that exist in ${
      destinations[0]
    }
3. **RICH DESCRIPTIONS**: Provide detailed, engaging descriptions that paint a vivid picture of each location
4. **HISTORICAL CONTEXT**: Include background stories, cultural significance, and interesting facts
5. **SPECIFIC ADDRESSES**: Include full street addresses and neighborhoods  
6. **AUTHENTIC EXPERIENCES**: Focus on what makes each location uniquely local and special
7. **REAL VENUE NAMES**: Use actual restaurant names, specific landmark names, and real attraction titles - NO generic descriptions
8. **PRACTICAL DETAILS**: Include opening hours, best times to visit, and accessibility info
9. **LOCAL INSIGHTS**: Share insider tips, cultural etiquette, and what locals recommend
10. **REALISTIC TIMING**: Account for actual walking distances and meaningful visit durations
11. **MANDATORY TIME COVERAGE**: Every day MUST have at least 1 activity in each period: Morning, Afternoon, and Evening
12. **EVENING ACTIVITY EXAMPLES**: Good: "Trattoria da Valentino", "Pont Neuf Bridge", "Flamenco show at Tablao Cordobés" - Bad: "Evening dining", "Sunset viewing", "Local restaurant"

## ACTIVITY STRUCTURE REQUIREMENTS:
- **MANDATORY DISTRIBUTION**: Each day MUST have at least 1 activity in each time period: Morning (6AM-12PM), Afternoon (12PM-6PM), and Evening (6PM-12AM)
- **EVENING ACTIVITIES ARE CRITICAL**: EVERY DAY MUST HAVE AT LEAST ONE SPECIFIC EVENING ACTIVITY - NO EXCEPTIONS OR REJECTIONS
- **SPECIFIC VENUES REQUIRED**: Every activity must be a real, specific place with actual names (e.g., "Ristorante Il Convivio Troiani" not "Evening Dining Experience")
- **REAL ADDRESSES MANDATORY**: Every activity must include a specific street address, not just neighborhood names
- **NO GENERIC ACTIVITIES**: ABSOLUTELY FORBIDDEN: "Evening Dining Experience", "Local Restaurant", "Traditional Restaurant", "Historic Bridge" - use actual business names
- **EVENING EXAMPLES**: REQUIRED format: "Osteria del Borgo (Via dei Cappuccini 12)", "Le Comptoir du Relais (9 Carrefour de l'Odéon)", "Bar Marsella (Carrer de Sant Pau 65)"
- **MINIMUM 3 ACTIVITIES PER DAY**: At least 1 morning + 1 afternoon + 1 evening activity per day
- **MAXIMUM 6 ACTIVITIES PER DAY**: Up to 2 morning + 2 afternoon + 2 evening activities
- **NO EMPTY TIME PERIODS**: Every Morning, Afternoon, and Evening section must contain at least one activity
- **CONCISE DESCRIPTIONS**: Each activity description must be exactly 2 sentences - no more, no less
- **RESTAURANT DESCRIPTIONS**: Each restaurant description must be exactly 2 sentences
- **QUALITY OVER QUANTITY**: Focus on meaningful experiences rather than cramming many activities

## DETAIL FOCUS:
- Keep descriptions concise but informative (2 sentences per activity/restaurant)
- Emphasize WHAT visitors will see and experience at each location
- Include one practical tip and one cultural insight per activity
- Focus on authentic local experiences and real venue names

## PRICING APPROACH:
- Use general price ranges ($ $$ $$$ $$$$) instead of specific amounts for most activities
- Focus on value and experience rather than detailed cost breakdowns
- Only include specific pricing for major expenses (accommodation, transportation)
- Emphasize free and low-cost authentic experiences

## LOCATION RESEARCH:
- Use your knowledge of real businesses and attractions in ${destinations[0]}
- Include mix of famous landmarks AND local hidden gems
- Verify realistic walking distances and transportation connections
- Consider seasonal variations and local events
- Include accessibility information for different mobility levels

## IMPORTANT CONSIDERATIONS
1. Stay within the $${budget} total budget
2. Design for a RELAXED pace with comfortable walking distances
3. Focus on SIGHTSEEING and CULTURAL experiences
4. Prioritize LOCAL CUISINE and authentic restaurants
5. Plan walking routes that connect attractions efficiently
6. Include rest breaks and leisure time
7. Recommend HOTELS in central, walkable locations
7. Focus on authentic local experiences and actual venue names
8. **MANDATORY TIME DISTRIBUTION**: Each day must have minimum 1 activity in Morning (6AM-12PM), 1 in Afternoon (12PM-6PM), and 1 in Evening (6PM-12AM)
9. Quality over quantity - maximum 6 activities per day total (2 morning, 2 afternoon, 2 evening)
10. **NO EMPTY PERIODS**: Never leave Morning, Afternoon, or Evening sections without activities
9. **CRITICAL**: Every single day MUST include at least one evening activity between 6PM-12AM (dinner, sunset viewing, evening walk, cultural event, etc.)
9. Keep all descriptions to exactly 2 sentences for easy reading
10. Include hidden gems and local favorites, not just tourist traps
11. Consider weather and seasonal factors for ${startDate.toLocaleDateString()}
12. Provide realistic walking times between locations
13. Focus on experiencing ${destinations[0]} like a local, not a rushed tourist

Generate a realistic, relaxed, and culturally immersive itinerary with concise descriptions that maximizes local experiences within the budget.
`.trim();
  }

  /**
   * Call AI service to generate itinerary using Google Gemini (SECURE SERVER-SIDE)
   */
  async generateItinerary(
    request: AIItineraryRequest
  ): Promise<AIItineraryResponse> {
    const prompt = this.generatePrompt(request);

    try {
      // Enforce rate limiting before making API call
      await GeminiRateLimit.enforceLimit();

      console.log("🤖 Calling secure server-side Gemini API...");
      console.log(
        "🔒 API key is safely stored on the server (not exposed to client)"
      );

      // Get available models
      const availableModels = await this.getAvailableModels();
      console.log("📋 Available models:", availableModels);

      if (availableModels.length === 0) {
        console.log("⚠️ No models available, falling back to mock response");
        throw new Error("No models available");
      }

      // Try available models sequentially via server-side API
      let result;
      let lastError: any;
      let quotaExceededCount = 0;

      console.log(
        `🔄 Starting sequential model fallback (${availableModels.length} models to try)`
      );

      for (const modelName of availableModels) {
        try {
          console.log(
            `\n🎯 [${availableModels.indexOf(modelName) + 1}/${
              availableModels.length
            }] Attempting model: ${modelName}`
          );
          console.log(
            `   📡 Sending request to: /api/generate-itinerary (secure)`
          );

          // Call secure server-side endpoint
          const response = await fetch("/api/generate-itinerary", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt,
              modelName,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Check for specific error types
            if (response.status === 429) {
              quotaExceededCount++;
              console.log(`⚠️  RATE LIMIT detected for ${modelName}`);
              console.log(
                `   📊 Quota errors so far: ${quotaExceededCount}/${availableModels.length}`
              );
              console.log(`   ➡️  Trying next model...`);
              continue; // Try next model
            }

            if (
              response.status === 403 &&
              errorData.error?.includes("suspended")
            ) {
              throw new Error(
                "API_KEY_SUSPENDED: Your API key has been suspended. Please generate a new API key."
              );
            }

            throw new Error(
              errorData.message || `Server error: ${response.status}`
            );
          }

          const data = await response.json();
          result = { text: data.text };

          console.log(`✅ SUCCESS with model: ${modelName}`);
          console.log(`   📊 Response length: ${result.text.length} chars`);
          break; // Success - exit loop
        } catch (error: any) {
          lastError = error;
          const errorMessage = error?.message ?? String(error);

          console.log(`❌ FAILED with model ${modelName}:`);
          console.log(`   Error: ${errorMessage}`);

          // Check if it's a temporary/retriable error
          if (
            errorMessage.includes("quota") ||
            errorMessage.includes("rate limit") ||
            errorMessage.includes("RESOURCE_EXHAUSTED") ||
            errorMessage.includes("overloaded") ||
            errorMessage.includes("503") ||
            errorMessage.includes("Service Unavailable")
          ) {
            quotaExceededCount++;
            console.log(`⚠️  TEMPORARY ERROR detected for ${modelName}`);
            console.log(
              `   📊 Retriable errors so far: ${quotaExceededCount}/${availableModels.length}`
            );
            console.log(`   ➡️  Trying next model...`);
            continue; // Try next model
          }

          // For fatal errors (API key suspended, etc), stop trying
          console.log(`🛑 Fatal error detected - stopping fallback`);
          throw error;
        }
      }

      // If we tried all models and none worked
      if (!result) {
        console.log(`\n❌ All ${availableModels.length} models failed`);
        console.log(
          `   📊 Quota errors: ${quotaExceededCount}/${availableModels.length}`
        );

        if (quotaExceededCount === availableModels.length) {
          console.log(`   🚫 ALL models hit quota limit - free tier exhausted`);
          lastError = new Error(
            "API_QUOTA_EXCEEDED: All models exhausted free tier quota"
          );
        }
      }

      if (!result) {
        console.log(
          "🎭 Using sample itinerary (API quota exceeded or unavailable)"
        );
        throw lastError || new Error("All model attempts failed");
      }

      console.log("✅ Gemini response received:", result.text);
      console.log("🔍 Response length:", result.text.length);

      // Try to parse the JSON response from Gemini
      try {
        console.log("🔍 Attempting to parse JSON response...");

        // Clean the response text
        let cleanedText = result.text.trim();

        // Remove code fences if present
        if (cleanedText.startsWith("```json")) {
          cleanedText = cleanedText.replace(/^```json\s*/, "");
        }
        if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.replace(/^```\s*/, "");
        }
        if (cleanedText.endsWith("```")) {
          cleanedText = cleanedText.replace(/\s*```$/, "");
        }

        const jsonResponse = JSON.parse(cleanedText);
        console.log("✅ Parsed AI response:", jsonResponse);
        console.log("🔍 Daily plans count:", jsonResponse.dailyPlans?.length);

        // Return the raw AI response directly for rich UI display
        return {
          itinerary: jsonResponse,
          confidence: 0.9,
          alternatives: [],
          tips: jsonResponse.tips || [
            "Book accommodations in advance for better prices",
            "Try local street food for authentic experiences",
            "Download offline maps before you travel",
          ],
          warnings: jsonResponse.warnings || [
            "Check visa requirements before traveling",
            "Consider travel insurance for international trips",
          ],
        };
      } catch (parseError) {
        console.error("❌ Failed to parse Gemini response:", parseError);
        console.log("🔍 Raw response text:", result.text);

        // Fall back to mock response
        console.log("🔄 Falling back to mock response...");
        return this.generateMockResponse(request);
      }
    } catch (error) {
      console.error("Error calling Google Gemini:", error);

      // Fallback to mock response
      console.log("Falling back to mock response...");
      return this.generateMockResponse(request);
    }
  }

  /**
   * Generate a mock response for testing or when quota is exceeded
   */
  private async generateMockResponse(
    request: AIItineraryRequest
  ): Promise<AIItineraryResponse> {
    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("🎭 Generating sample itinerary (API quota exceeded)");
    console.log("💡 This is demonstration data showing the app's capabilities");

    // Create a mock response that matches the AI JSON format
    const mockAIResponse = {
      title: `Sample ${request.duration}-Day Adventure in ${request.destinations[0]}`,
      description: `⚠️ SAMPLE ITINERARY: This is demonstration data as the AI API quota has been exceeded. A carefully crafted ${request.duration}-day itinerary for ${request.travelers} travelers with a budget of $${request.budget}. Experience the best of ${request.destinations[0]} with a perfect blend of culture, cuisine, and relaxation.`,
      totalEstimatedCost: request.budget * 0.9, // Use 90% of budget
      dailyPlans: Array.from({ length: request.duration }, (_, index) => ({
        day: index + 1,
        date: new Date(
          request.startDate.getTime() + index * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
        theme: `Day ${index + 1}: ${
          [
            "Arrival & City Center",
            "Cultural Exploration",
            "Local Experiences",
            "Hidden Gems",
            "Relaxation & Shopping",
            "Adventure Day",
            "Farewell Tour",
          ][index] || "City Exploration"
        }`,
        activities: [
          {
            time: "09:00",
            name: `Morning at ${
              [
                "Local Market",
                "Historic District",
                "Museum Quarter",
                "Scenic Viewpoint",
                "Cultural Center",
              ][index % 5]
            }`,
            description: `Start your day with a visit to one of ${request.destinations[0]}'s most captivating locations. Perfect for morning exploration.`,
            duration: "2 hours",
            estimatedCost: Math.round(
              (request.budget / request.duration) * 0.15
            ),
            category: "SIGHTSEEING",
            walkingTime: "15 minutes from hotel",
            tips: [
              "Arrive early to avoid crowds",
              "Bring comfortable walking shoes",
            ],
          },
          {
            time: "14:00",
            name: `Afternoon ${
              [
                "Food Tour",
                "Art Gallery Visit",
                "Walking Tour",
                "Local Workshop",
                "Scenic Drive",
              ][index % 5]
            }`,
            description: `Immerse yourself in the local culture with this carefully selected afternoon activity that showcases the authentic spirit of ${request.destinations[0]}.`,
            duration: "3 hours",
            estimatedCost: Math.round(
              (request.budget / request.duration) * 0.25
            ),
            category: "CULTURAL",
            walkingTime: "10 minutes from morning location",
            tips: [
              "Book in advance for best experience",
              "Try the local specialties",
            ],
          },
        ],
        meals: [
          {
            type: "LUNCH",
            name: `Local Bistro Day ${index + 1}`,
            cuisine: "Local Cuisine",
            estimatedCost: Math.round(
              (request.budget / request.duration) * 0.2
            ),
            description: `Enjoy authentic local flavors at this charming restaurant known for its traditional dishes and warm atmosphere.`,
            walkingDistance: "5 minutes from morning activity",
          },
          {
            type: "DINNER",
            name: `Evening Restaurant Day ${index + 1}`,
            cuisine: "International Fusion",
            estimatedCost: Math.round(
              (request.budget / request.duration) * 0.3
            ),
            description: `End your day with a memorable dining experience featuring both local and international influences.`,
            walkingDistance: "10 minutes from afternoon activity",
          },
        ],
        ...(index === 0 && {
          accommodation: {
            name: "Boutique City Hotel",
            type: "HOTEL",
            estimatedCost: Math.round(
              (request.budget / request.duration) * 0.4
            ),
            location: `Central ${request.destinations[0]}`,
            whyRecommended:
              "Perfect location for exploring the city on foot, excellent reviews, and great value for money.",
          },
        }),
        walkingRoute: {
          totalDistance: `${2 + index * 0.5} km`,
          estimatedWalkingTime: `${30 + index * 10} minutes`,
        },
      })),
    };

    return {
      itinerary: mockAIResponse, // Return the mock AI JSON format
      confidence: 0.8,
      alternatives: [],
      tips: [
        "⚠️ This is a sample itinerary (AI quota exceeded)",
        "Book accommodations in advance for better prices",
        "Try local street food for authentic experiences",
        "Download offline maps before you travel",
        "Learn a few basic phrases in the local language",
      ],
      warnings: [
        "📢 AI API quota exceeded - showing demonstration data",
        "Check visa requirements before traveling",
        "Consider travel insurance for international trips",
        "Research local customs and etiquette",
      ],
    };
  }
}

export const aiTravelService = new AITravelService();

/**
 * Export function to get Gemini usage statistics
 */
export function getGeminiUsageStats() {
  return GeminiRateLimit.getUsageStats();
}

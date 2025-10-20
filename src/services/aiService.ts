import type { AIItineraryRequest, AIItineraryResponse } from "../types";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export class AITravelService {
  /**
   * Helper method to list available models (for debugging)
   */
  async listAvailableModels(): Promise<void> {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
      if (!apiKey) {
        console.error("❌ No API key available");
        return;
      }

      // Try to list models using the Google AI API directly
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      const data = await response.json();

      if (data.models) {
        console.log("📋 Available models:");
        data.models.forEach((model: { name: string; displayName: string }) => {
          console.log(`  - ${model.name} (${model.displayName})`);
        });
      } else {
        console.log("❌ Could not fetch models:", data);
      }
    } catch (error) {
      console.error("❌ Error listing models:", error);
    }
  }

  /**
   * Get available model names that support generateContent
   */
  async getAvailableModels(apiKey: string): Promise<string[]> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      const data = await response.json();

      if (data.models) {
        // Filter models that support generateContent and prioritize faster/cheaper models
        const allModels = data.models
          .filter((model: { supportedGenerationMethods: string[] }) =>
            model.supportedGenerationMethods?.includes("generateContent")
          )
          .map((model: { name: string }) => model.name);

        // Prioritize models by speed and efficiency (Flash models first, then Pro models)
        const prioritizedModels = allModels.sort((a: string, b: string) => {
          // Flash models are faster and use fewer tokens
          const aIsFlash = a.includes("flash");
          const bIsFlash = b.includes("flash");
          const aIsLite = a.includes("lite");
          const bIsLite = b.includes("lite");

          // Priority order: flash-lite > flash > others
          if (aIsLite && !bIsLite) return -1;
          if (!aIsLite && bIsLite) return 1;
          if (aIsFlash && !bIsFlash) return -1;
          if (!aIsFlash && bIsFlash) return 1;
          return 0;
        });

        console.log(
          "✅ Models prioritized by efficiency:",
          prioritizedModels.slice(0, 5)
        );
        return prioritizedModels;
      } else {
        console.error("❌ Could not fetch models:", data);
        return [];
      }
    } catch (error) {
      console.error("❌ Error fetching available models:", error);
      // Fallback to common model names
      return [
        "gemini-1.5-flash-8b",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
      ];
    }
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
      // preferences are used implicitly through smart defaults in the prompt template
    } = request;

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

## TRAVEL STYLE (Optimized for local exploration)
- Focus: Sightseeing and cultural exploration (primary interest)
- Pace: Relaxed and comfortable (LOW activity level)
- Accommodation: Hotels with good location and amenities
- Transportation: Walking, train, bus, car, or bike for local exploration (no flights within destination)
- Dining: Local cuisine and authentic local experiences
- Style: Immersive local experience rather than rushed tourism

## RESPONSE FORMAT
Please provide a detailed itinerary in JSON format with the following structure. 
IMPORTANT: Include specific real location names, addresses, ratings, and detailed information:

{
  "title": "Descriptive title for the ${duration}-day ${destinations[0]} trip",
  "description": "Brief overview focusing on relaxed sightseeing and cultural immersion",
  "totalEstimatedCost": number,
  "dailyPlans": [
    {
      "day": number,
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
1. **REAL LOCATIONS ONLY**: Use actual business names, restaurants, hotels, and attractions that exist in ${
      destinations[0]
    }
2. **RICH DESCRIPTIONS**: Provide detailed, engaging descriptions that paint a vivid picture of each location
3. **HISTORICAL CONTEXT**: Include background stories, cultural significance, and interesting facts
4. **SPECIFIC ADDRESSES**: Include full street addresses and neighborhoods  
5. **AUTHENTIC EXPERIENCES**: Focus on what makes each location uniquely local and special
6. **PRACTICAL DETAILS**: Include opening hours, best times to visit, and accessibility info
7. **LOCAL INSIGHTS**: Share insider tips, cultural etiquette, and what locals recommend
8. **REALISTIC TIMING**: Account for actual walking distances and meaningful visit durations

## ACTIVITY STRUCTURE REQUIREMENTS:
- **MAXIMUM 6 ACTIVITIES PER DAY**: 2 morning (6AM-12PM) + 2 afternoon (12PM-6PM) + 2 evening (6PM-12AM)
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
8. Avoid rushed schedules - quality over quantity (MAX 6 activities per day: 2 morning, 2 afternoon, 2 evening)
9. Keep all descriptions to exactly 2 sentences for easy reading
10. Include hidden gems and local favorites, not just tourist traps
11. Consider weather and seasonal factors for ${startDate.toLocaleDateString()}
12. Provide realistic walking times between locations
13. Focus on experiencing ${destinations[0]} like a local, not a rushed tourist

Generate a realistic, relaxed, and culturally immersive itinerary with concise descriptions that maximizes local experiences within the budget.
`.trim();
  }

  /**
   * Call AI service to generate itinerary using Google Gemini
   */
  async generateItinerary(
    request: AIItineraryRequest
  ): Promise<AIItineraryResponse> {
    const prompt = this.generatePrompt(request);

    try {
      console.log("🤖 Calling Google Gemini with prompt...");

      // Check if API key is available
      const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
      if (!apiKey) {
        console.error(
          "❌ Google AI API key not found. Please set VITE_GOOGLE_AI_API_KEY in your .env file"
        );
        throw new Error("API key not configured");
      }

      // First, let's see what models are actually available
      console.log("🔍 Checking available models...");
      const availableModels = await this.getAvailableModels(apiKey);
      console.log("📋 Available models:", availableModels);

      if (availableModels.length === 0) {
        console.log("⚠️ No models available, falling back to mock response");
        throw new Error("No models available");
      }

      // Create Google AI instance with API key
      const google = createGoogleGenerativeAI({ apiKey });

      // Try available models that support generateContent
      let result;
      let lastError;

      for (const modelName of availableModels) {
        try {
          console.log(`🔄 Trying model: ${modelName}`);
          result = await generateText({
            model: google(modelName),
            prompt: prompt,
            temperature: 0.7,
          });
          console.log(`✅ Success with model: ${modelName}`);
          break;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.log(`❌ Failed with model ${modelName}:`, errorMessage);

          // Check if it's a rate limit error - if so, stop trying more models
          if (
            errorMessage.includes("quota") ||
            errorMessage.includes("rate limit") ||
            errorMessage.includes("Too Many Requests")
          ) {
            console.log(
              "⚠️ Rate limit detected, skipping remaining models and using mock response"
            );
            lastError = error;
            break;
          }

          lastError = error;
          continue;
        }
      }

      if (!result) {
        console.error("🚫 All model attempts failed, using mock response");
        throw lastError || new Error("All model attempts failed");
      }

      console.log("✅ Gemini response received:", result.text);
      console.log("🔍 Response length:", result.text.length);
      console.log("🔍 Response ends with:", result.text.slice(-100));

      // Try to parse the JSON response from Gemini
      try {
        console.log("🔍 Attempting to parse JSON response...");
        console.log(
          "🔍 Raw response text (first 500 chars):",
          result.text.substring(0, 500)
        );
        console.log(
          "🔍 Raw response text (last 500 chars):",
          result.text.substring(result.text.length - 500)
        );

        // Clean the response text
        let cleanedText = result.text.trim();

        // Check if the response starts with ``` and remove it
        if (cleanedText.startsWith("```json")) {
          cleanedText = cleanedText.replace(/^```json\s*/, "");
        }
        if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.replace(/^```\s*/, "");
        }
        if (cleanedText.endsWith("```")) {
          cleanedText = cleanedText.replace(/\s*```$/, "");
        }

        console.log(
          "🧹 Cleaned text (first 200 chars):",
          cleanedText.substring(0, 200)
        );
        console.log(
          "🧹 Cleaned text (last 200 chars):",
          cleanedText.substring(cleanedText.length - 200)
        );

        const jsonResponse = JSON.parse(cleanedText);
        console.log("✅ Parsed AI response:", jsonResponse);
        console.log("🔍 Daily plans count:", jsonResponse.dailyPlans?.length);
        console.log(
          "🔍 First activity name:",
          jsonResponse.dailyPlans?.[0]?.activities?.[0]?.name
        );

        // Return the raw AI response directly for rich UI display
        return {
          itinerary: jsonResponse, // Return raw AI JSON instead of transformed
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
   * Generate a mock response for testing
   */
  private async generateMockResponse(
    request: AIItineraryRequest
  ): Promise<AIItineraryResponse> {
    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create a mock response that matches the AI JSON format
    const mockAIResponse = {
      title: `Amazing ${request.duration}-Day Adventure in ${request.destinations[0]}`,
      description: `A carefully crafted ${request.duration}-day itinerary for ${request.travelers} travelers with a budget of $${request.budget}. Experience the best of ${request.destinations[0]} with a perfect blend of culture, cuisine, and relaxation.`,
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
        "Book accommodations in advance for better prices",
        "Try local street food for authentic experiences",
        "Download offline maps before you travel",
        "Learn a few basic phrases in the local language",
      ],
      warnings: [
        "Check visa requirements before traveling",
        "Consider travel insurance for international trips",
        "Research local customs and etiquette",
      ],
    };
  }
}

export const aiTravelService = new AITravelService();

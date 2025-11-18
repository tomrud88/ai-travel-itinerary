// Vercel Serverless Function for Freepik Budget Status

const { kv } = require("@vercel/kv");

const FREEPIK_USAGE_KEY = "freepik-usage-global";

async function loadFreepikUsage() {
  try {
    console.log("📡 Loading Freepik usage from Vercel KV for budget status...");
    const usage = await kv.get(FREEPIK_USAGE_KEY);

    if (usage) {
      console.log("📊 Found Freepik usage data in KV:", {
        monthly: usage.monthlyRequestCount,
        daily: usage.dailyRequestCount,
      });
      return usage;
    }

    console.log("📊 No Freepik usage data in KV, returning defaults");
  } catch (error) {
    console.error("Error loading Freepik usage from KV:", error);
  }

  // Default data if no data exists in KV
  return {
    monthlyRequestCount: 0,
    dailyRequestCount: 0,
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    date: new Date().getDate(),
    lastUpdated: new Date().toISOString(),
  };
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const usage = await loadFreepikUsage();
    const now = new Date();
    const currentMonth = now.getMonth();

    const currentDate = now.getDate();

    // Reset daily counter if it's a new day (similar to Gemini logic)
    if (currentDate !== usage.date) {
      usage.dailyRequestCount = 0;
      usage.date = currentDate;
    }

    // Reset monthly counter if it's a new month
    if (currentMonth !== usage.month) {
      usage.monthlyRequestCount = 0;
      usage.dailyRequestCount = 0;
      usage.month = currentMonth;
      usage.year = now.getFullYear();
      usage.date = currentDate;
    }

    if (req.method === "GET") {
      // Return usage statistics in expected format
      const budgetStatus = {
        monthlyUsed: usage.monthlyRequestCount,
        monthlyLimit: 3000,
        dailyUsed: usage.dailyRequestCount,
        dailyLimit: 300,
        estimatedCost: (usage.monthlyRequestCount / 3000) * 5, // 5 EUR budget
        percentageUsed: (usage.monthlyRequestCount / 3000) * 100,
      };

      return res.status(200).json(budgetStatus);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Budget Status API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

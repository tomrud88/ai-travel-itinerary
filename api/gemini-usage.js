const { kv } = require("@vercel/kv");

const GEMINI_USAGE_KEY = "gemini-usage-global";

class GeminiUsageTracker {
  static getDefaultUsage() {
    return {
      minute: { count: 0, startTime: Date.now() },
      daily: { count: 0, date: new Date().toISOString().split("T")[0] },
      monthly: {
        count: 0,
        month: `${new Date().getFullYear()}-${String(
          new Date().getMonth() + 1
        ).padStart(2, "0")}`,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  static async loadUsage() {
    try {
      console.log("📡 Loading Gemini usage from Vercel KV (global storage)...");
      const usage = await kv.get(GEMINI_USAGE_KEY);

      if (usage) {
        // Only reset minute counter if more than 1 minute has passed
        if (Date.now() - usage.minute.startTime > 60000) {
          usage.minute = { count: 0, startTime: Date.now() };
        }

        console.log("📊 Loaded Gemini usage from Vercel KV:", {
          monthly: usage.monthly.count,
          daily: usage.daily.count,
          date: usage.daily.date,
          month: usage.monthly.month,
        });

        return usage;
      }

      console.log("📊 No existing Gemini usage in KV, creating fresh data");
    } catch (error) {
      console.error("Error loading Gemini usage from KV:", error);
    }

    return this.getDefaultUsage();
  }

  static async saveUsage(usage) {
    try {
      usage.lastUpdated = new Date().toISOString();
      await kv.set(GEMINI_USAGE_KEY, usage);
      console.log("💾 Gemini usage saved to Vercel KV (persistent):", {
        monthly: usage.monthly.count,
        daily: usage.daily.count,
        lastUpdated: usage.lastUpdated,
      });
    } catch (error) {
      console.error("Error saving Gemini usage to KV:", error);
    }
  }
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
    if (req.method === "GET") {
      // Return current usage with auto-reset logic
      let usage = await GeminiUsageTracker.loadUsage();

      // Reset logic for new day/month
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;
      let hasChanges = false;

      // Reset daily if it's a new day
      if (usage.daily.date !== today) {
        console.log(
          `🔄 Resetting daily Gemini counter (${usage.daily.date} → ${today})`
        );
        usage.daily = { count: 0, date: today };
        hasChanges = true;
      }

      // Reset monthly if it's a new month
      if (usage.monthly.month !== currentMonth) {
        console.log(
          `🔄 Resetting monthly Gemini counter (${usage.monthly.month} → ${currentMonth})`
        );
        usage.monthly = { count: 0, month: currentMonth };
        usage.daily = { count: 0, date: today };
        hasChanges = true;
      }

      // Save changes if any resets occurred
      if (hasChanges) {
        await GeminiUsageTracker.saveUsage(usage);
      }

      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify(usage));
      return;
    }

    if (req.method === "POST") {
      // Read POST body
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const newUsage = JSON.parse(body);
          await GeminiUsageTracker.saveUsage(newUsage);

          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true }));
        } catch (parseError) {
          console.error("Error parsing POST body:", parseError);
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
      return;
    }

    // Method not allowed
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
  } catch (error) {
    console.error("Gemini usage API error:", error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
};

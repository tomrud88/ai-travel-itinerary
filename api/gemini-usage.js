const fs = require("fs");
const path = require("path");

const USAGE_FILE_PATH = path.join(process.cwd(), ".gemini-usage.json");

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

  static loadUsage() {
    try {
      if (fs.existsSync(USAGE_FILE_PATH)) {
        const data = fs.readFileSync(USAGE_FILE_PATH, "utf8");
        const usage = JSON.parse(data);

        // Only reset minute counter if more than 1 minute has passed
        if (Date.now() - usage.minute.startTime > 60000) {
          usage.minute = { count: 0, startTime: Date.now() };
        }

        console.log("📊 Loaded Gemini usage from file (no auto-reset):", {
          monthly: usage.monthly.count,
          daily: usage.daily.count,
          date: usage.daily.date,
          month: usage.monthly.month,
        });

        return usage;
      }
    } catch (error) {
      console.error("Error loading Gemini usage:", error);
    }

    return this.getDefaultUsage();
  }

  static saveUsage(usage) {
    try {
      usage.lastUpdated = new Date().toISOString();
      fs.writeFileSync(USAGE_FILE_PATH, JSON.stringify(usage, null, 2));
      console.log("💾 Gemini usage saved to file:", usage);
    } catch (error) {
      console.error("Error saving Gemini usage:", error);
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
      // Return current usage
      const usage = GeminiUsageTracker.loadUsage();
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

      req.on("end", () => {
        try {
          const newUsage = JSON.parse(body);
          GeminiUsageTracker.saveUsage(newUsage);

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

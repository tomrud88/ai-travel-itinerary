import * as fs from "fs";
import * as path from "path";

interface GeminiUsage {
  minute: { count: number; startTime: number };
  daily: { count: number; date: string };
  monthly: { count: number; month: string };
  lastUpdated: string;
}

const USAGE_FILE_PATH = path.join(process.cwd(), ".gemini-usage.json");

class GeminiUsageTracker {
  private static getDefaultUsage(): GeminiUsage {
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

  static loadUsage(): GeminiUsage {
    try {
      if (fs.existsSync(USAGE_FILE_PATH)) {
        const data = fs.readFileSync(USAGE_FILE_PATH, "utf8");
        const usage = JSON.parse(data) as GeminiUsage;

        // Reset counters if needed
        const now = new Date();
        const today = now.toISOString().split("T")[0];
        const currentMonth = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}`;

        // Reset daily if it's a new day
        if (usage.daily.date !== today) {
          usage.daily = { count: 0, date: today };
        }

        // Reset monthly if it's a new month
        if (usage.monthly.month !== currentMonth) {
          usage.monthly = { count: 0, month: currentMonth };
          usage.daily = { count: 0, date: today }; // Also reset daily for new month
        }

        // Reset minute counter if more than 1 minute has passed
        if (Date.now() - usage.minute.startTime > 60000) {
          usage.minute = { count: 0, startTime: Date.now() };
        }

        return usage;
      }
    } catch (error) {
      console.error("Error loading Gemini usage:", error);
    }

    return this.getDefaultUsage();
  }

  static saveUsage(usage: GeminiUsage): void {
    try {
      usage.lastUpdated = new Date().toISOString();
      fs.writeFileSync(USAGE_FILE_PATH, JSON.stringify(usage, null, 2));
      console.log("💾 Gemini usage saved to file:", usage);
    } catch (error) {
      console.error("Error saving Gemini usage:", error);
    }
  }
}

export default async function handler(req: any, res: any) {
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
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        try {
          const newUsage = JSON.parse(body) as GeminiUsage;
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
}

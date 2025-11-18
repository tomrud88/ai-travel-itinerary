// Vercel Serverless Function for Freepik Budget Status

let budgetData = {
  monthlyUsed: 0,
  monthlyLimit: 3000,
  dailyUsed: 0,
  dailyLimit: 300,
  estimatedCost: 0,
  lastReset: new Date().toISOString().split("T")[0],
  lastMonthReset: new Date().getMonth(),
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentMonth = now.getMonth();

    // Reset daily counter if it's a new day
    if (budgetData.lastReset !== today) {
      budgetData.dailyUsed = 0;
      budgetData.lastReset = today;
    }

    // Reset monthly counter if it's a new month
    if (budgetData.lastMonthReset !== currentMonth) {
      budgetData.monthlyUsed = 0;
      budgetData.dailyUsed = 0;
      budgetData.estimatedCost = 0;
      budgetData.lastMonthReset = currentMonth;
      budgetData.lastReset = today;
    }

    if (req.method === "GET") {
      return res.status(200).json(budgetData);
    }

    if (req.method === "POST") {
      // Update budget data (when an API call is made)
      budgetData.monthlyUsed += 1;
      budgetData.dailyUsed += 1;
      budgetData.estimatedCost =
        (budgetData.monthlyUsed / budgetData.monthlyLimit) * 5; // 5 EUR budget

      return res.status(200).json({ success: true, newUsage: budgetData });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Budget Status API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

import type { Plugin } from "vite";
import { searchFreepikImages, optimizeSearchQuery } from "../server/api/images";

export function apiPlugin(): Plugin {
  return {
    name: "api-routes",
    configureServer(server) {
      // API endpoint for searching images
      server.middlewares.use("/api/images/search", async (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        try {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk.toString();
          });

          req.on("end", async () => {
            try {
              const {
                query,
                activityName,
                activityAddress,
                limit = 3,
              } = JSON.parse(body);

              // Support both old format (query) and new format (activityName + activityAddress)
              let optimizedQuery: string;
              if (activityName !== undefined) {
                const originalQuery = `${activityName} ${
                  activityAddress || ""
                }`.trim();
                optimizedQuery = optimizeSearchQuery(
                  activityName,
                  activityAddress || ""
                );
                console.log(`🔍 Server query optimization:`, {
                  activityName,
                  activityAddress,
                  original: originalQuery,
                  optimized: optimizedQuery,
                });
              } else if (query) {
                optimizedQuery = optimizeSearchQuery(query);
                console.log(`🔍 Server query optimization (legacy):`, {
                  original: query,
                  optimized: optimizedQuery,
                });
              } else {
                res.statusCode = 400;
                res.end(
                  JSON.stringify({
                    error: "Query or activityName parameter required",
                  })
                );
                return;
              }

              const images = await searchFreepikImages(optimizedQuery, limit);

              res.setHeader("Content-Type", "application/json");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
              res.setHeader("Access-Control-Allow-Headers", "Content-Type");

              res.end(
                JSON.stringify({
                  query: optimizedQuery,
                  images,
                  count: images.length,
                })
              );
            } catch (error) {
              console.error("API Error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Internal server error" }));
            }
          });
        } catch (error) {
          console.error("API Error:", error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      });

      // Handle CORS preflight
      server.middlewares.use("/api/images/search", (req, res, next) => {
        if (req.method === "OPTIONS") {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");
          res.statusCode = 200;
          res.end();
          return;
        }
        next();
      });

      // Batch endpoint for city galleries
      server.middlewares.use(
        "/api/images/city-gallery",
        async (req, res, next) => {
          if (req.method !== "POST") {
            return next();
          }

          try {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk.toString();
            });

            req.on("end", async () => {
              try {
                const { destination, limit = 15 } = JSON.parse(body);

                if (!destination) {
                  res.statusCode = 400;
                  res.end(
                    JSON.stringify({ error: "Destination parameter required" })
                  );
                  return;
                }

                console.log(
                  `🏙️ Server-side city gallery for: "${destination}" (limit: ${limit})`
                );

                // Specific search terms for city images (avoid person names)
                const searchTerms = [
                  `${destination} city`,
                  `${destination} skyline`,
                  `${destination} architecture`,
                  `${destination} landmarks`,
                  `${destination} tourist attractions`,
                ];

                const allImages: string[] = [];
                const usedUrls = new Set<string>();

                for (const term of searchTerms) {
                  if (allImages.length >= limit) break;

                  const remainingNeeded = limit - allImages.length;
                  const images = await searchFreepikImages(
                    term,
                    Math.min(remainingNeeded, 5)
                  );

                  for (const imageUrl of images) {
                    if (allImages.length >= limit) break;
                    if (!usedUrls.has(imageUrl)) {
                      allImages.push(imageUrl);
                      usedUrls.add(imageUrl);
                    }
                  }

                  // Small delay between requests
                  await new Promise((resolve) => setTimeout(resolve, 200));
                }

                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
                res.setHeader("Access-Control-Allow-Headers", "Content-Type");

                res.end(
                  JSON.stringify({
                    destination,
                    images: allImages,
                    count: allImages.length,
                  })
                );
              } catch (error) {
                console.error("City Gallery API Error:", error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Internal server error" }));
              }
            });
          } catch (error) {
            console.error("City Gallery API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
        }
      );

      // Budget status endpoint
      server.middlewares.use(
        "/api/images/budget-status",
        async (req, res, next) => {
          if (req.method !== "GET") {
            return next();
          }

          try {
            // Import the budget status from images.ts
            const { getFreepikBudgetStatus } = await import(
              "../server/api/images"
            );
            const budgetStatus = getFreepikBudgetStatus();

            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type");

            res.end(JSON.stringify(budgetStatus));
          } catch (error) {
            console.error("Budget Status API Error:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
        }
      );
    },
  };
}

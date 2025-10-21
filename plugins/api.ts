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
              const { query, limit = 3 } = JSON.parse(body);

              if (!query) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Query parameter required" }));
                return;
              }

              const optimizedQuery = optimizeSearchQuery(query);
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
                const { destination } = JSON.parse(body);

                if (!destination) {
                  res.statusCode = 400;
                  res.end(
                    JSON.stringify({ error: "Destination parameter required" })
                  );
                  return;
                }

                console.log(
                  `🏙️ Server-side city gallery for: "${destination}"`
                );

                const searchTerms = [
                  `${destination} cityscape architecture`,
                  `${destination} landmarks tourist attractions`,
                  `${destination} skyline panorama`,
                ];

                const allImages: string[] = [];
                const usedUrls = new Set<string>();

                for (const term of searchTerms) {
                  if (allImages.length >= 3) break;

                  const images = await searchFreepikImages(term, 2);
                  for (const imageUrl of images) {
                    if (allImages.length >= 3) break;
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
    },
  };
}

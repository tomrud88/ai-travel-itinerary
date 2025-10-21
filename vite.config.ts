import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { apiPlugin } from "./plugins/api";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  // Make sure the API key is available in process.env for server-side code
  process.env.VITE_FREEPIK_API_KEY = env.VITE_FREEPIK_API_KEY;

  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    ssr: {
      // Enable SSR for our image service
      noExternal: ["@ai-sdk/google", "ai"],
    },
    build: {
      rollupOptions: {
        input: {
          app: "./index.html",
          ssr: "./src/entry-server.tsx",
        },
      },
    },
    define: {
      // Make sure environment variables are available in SSR
      __FREEPIK_API_KEY__: JSON.stringify(env.VITE_FREEPIK_API_KEY || ""),
    },
  };
});

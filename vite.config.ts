import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
function localApi(): Plugin {
  return {
    name: "biznesbola-local-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      for (const key of [
        "ANTHROPIC_API_KEY",
        "ANTHROPIC_MODEL",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_ANON_KEY",
        "AI_PROVIDER",
        "AI_MODEL",
        "APP_ORIGIN",
        "UPSTASH_REDIS_REST_URL",
        "UPSTASH_REDIS_REST_TOKEN",
      ])
        if (env[key]) process.env[key] = env[key];
      const routes: Record<string, string> = {
        "/api/products": "api/router.ts",
        "/api/status": "api/router.ts",
        "/api/auth": "api/router.ts",
        "/api/data": "api/router.ts",
        "/api/simulation": "api/router.ts",
        "/api/admin": "api/router.ts",
        "/api/adult": "api/router.ts",
        "/api/invitations": "api/router.ts",
        "/api/import": "api/router.ts",
        "/api/lessons": "api/router.ts",
        "/api/conversation": "api/router.ts",
        "/api/showcase": "api/router.ts",
        "/api/ai/chat": "api/router.ts",
        "/api/parent/login": "api/router.ts",
        "/api/parent/stores": "api/router.ts",
        "/api/storefront/public": "api/router.ts",
      };
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost");
        const file = routes[url.pathname];
        if (!file) return next();
        try {
          const module = await server.ssrLoadModule("/" + file);
          await module.default(req, res);
        } catch {
          res.statusCode = 503;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "server_unavailable" }));
        }
      });
    },
  };
}
export default defineConfig({
  server: {
    watch: {
      ignored: [
        "**/reports/**",
        "**/test-results/**",
        "**/playwright-report/**",
        "**/.npm-cache/**",
      ],
    },
  },
  plugins: [react(), tailwind(), localApi()],
  build: { chunkSizeWarningLimit: 700 },
});

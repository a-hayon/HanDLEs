import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import app from "./app.js";

// Next.js loaded .env.local automatically; here we do it by hand (if the file exists).
try {
  process.loadEnvFile(".env.local");
} catch {
  /* no file: use the system environment variables */
}

// In production, the same server also serves the front end built by `vite build`.
if (process.env.NODE_ENV === "production") {
  app.use("/*", serveStatic({ root: "./dist" }));
}

const port = Number(process.env.PORT ?? 3210);
serve({ fetch: app.fetch, port }, () => console.log(`HanDLEs API on http://localhost:${port}`));

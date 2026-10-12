import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import app from "./app.js";

// Next.js chargeait .env.local tout seul ; ici on le fait à la main (s'il existe).
try {
  process.loadEnvFile(".env.local");
} catch {
  /* pas de fichier : variables d'environnement du système */
}

// En production, ce même serveur sert aussi le front compilé par `vite build`.
if (process.env.NODE_ENV === "production") {
  app.use("/*", serveStatic({ root: "./dist" }));
}

const port = Number(process.env.PORT ?? 3210);
serve({ fetch: app.fetch, port }, () => console.log(`API HanDLEs sur http://localhost:${port}`));

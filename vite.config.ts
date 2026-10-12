import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  server: {
    // En dev, Vite (port 5173) sert le front et renvoie /api vers le serveur Hono (port 3210).
    proxy: { "/api": "http://localhost:3210" },
  },
});

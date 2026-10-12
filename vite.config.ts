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
    // In dev, Vite (port 5173) serves the front end and proxies /api to the Hono server (port 3210).
    proxy: { "/api": "http://localhost:3210" },
  },
});

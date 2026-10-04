import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/health": "http://localhost:3000",
      "/visits": "http://localhost:3000",
      "/timetables": "http://localhost:3000",
      "/classes": "http://localhost:3000",
      "/students": "http://localhost:3000",
      "/teachers": "http://localhost:3000",
      "/grids": "http://localhost:3000",
      "/api": "http://localhost:3000",
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});

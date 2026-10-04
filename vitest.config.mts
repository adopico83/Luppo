import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    environment: "jsdom",
    setupFiles: ["tests/setup-jsdom.ts", "tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // Arrancar PGlite (Postgres en WASM) en varios ficheros a la vez puede pasar de los 10 s por defecto.
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});

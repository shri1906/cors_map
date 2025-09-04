import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ["@arcgis/core"] }, // prevent pre-bundling
  build: { sourcemap: true }, // easier debugging
  server: { port: 5173 },
});

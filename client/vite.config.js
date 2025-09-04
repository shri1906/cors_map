import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/@arcgis/core/assets",
          dest: "arcgis"  // will be copied into dist/arcgis
        }
      ]
    })
  ],
  optimizeDeps: {
    exclude: ["@arcgis/core"]
  }
});

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        content: "src/content/index.ts",
        background: "src/background/service_worker.ts",
        options: "src/options/index.html"
      },
      output: { entryFileNames: "[name].js", assetFileNames: "[name][extname]" }
    }
  }
});

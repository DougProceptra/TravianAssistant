import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname),
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: {
        content: path.resolve(__dirname, "src/content/index.ts"),
        background: path.resolve(__dirname, "src/background.ts"),
        options: path.resolve(__dirname, "src/options/index.ts"),
        popup: path.resolve(__dirname, "src/popup.ts")
      },
      formats: ["es"],
      name: "tla"
    },
    rollupOptions: {
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "content") return "content.js";
          if (chunk.name === "background") return "background.js";
          if (chunk.name === "options") return "options.js";
          if (chunk.name === "popup") return "popup.js";
          return "[name].js";
        }
      }
    }
  }
});

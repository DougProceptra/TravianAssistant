import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
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
        options: path.resolve(__dirname, "src/options/index.ts")
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
          return "[name].js";
        }
      }
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: "manifest.json", dest: "." },
        { src: "src/options/index.html", dest: "src/options" }
      ]
    })
  ]
});

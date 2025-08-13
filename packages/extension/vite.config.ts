import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    viteStaticCopy({ targets: [{ src: "manifest.json", dest: "." }] })
  ],
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

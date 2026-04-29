import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig(({ mode }) => {
  const isDevBuild = mode === "dev";
  const outputDir = isDevBuild ? "../web_version/dev" : "../web_version/v1";

  return {
    base: "./",
    plugins: [vue(), cssInjectedByJsPlugin()],
    build: {
      emptyOutDir: true,
      minify: isDevBuild ? false : "terser",
      outDir: outputDir,
      rollupOptions: {
        external: ["/scripts/app.js"],
        input: fileURLToPath(new URL("./src/main.js", import.meta.url)),
        output: {
          entryFileNames: "alice-tools.js",
          chunkFileNames: "chunks/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
      },
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});

import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/admin/",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@demo/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      "@demo/shop": fileURLToPath(new URL("../../packages/shop/src/index.ts", import.meta.url)),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5174,
    fs: {
      allow: [fileURLToPath(new URL("../..", import.meta.url))],
    },
  },
});

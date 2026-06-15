import { defineConfig } from "vite";
import { createSyncMiddleware } from "./sync-store.js";

export default defineConfig({
  server: {
    host: "0.0.0.0",
  },
  plugins: [
    {
      name: "librepos-lan-sync",
      configureServer(server) {
        server.middlewares.use(createSyncMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(createSyncMiddleware());
      },
    },
  ],
});

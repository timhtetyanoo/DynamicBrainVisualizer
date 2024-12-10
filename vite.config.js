import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [nodePolyfills(), react(), ,],
  server: {
    port: 3000,
  },
  alias: {
    "source-map-js": "source-map",
  },
});

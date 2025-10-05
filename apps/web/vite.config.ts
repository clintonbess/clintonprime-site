import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/media": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), tailwindcss()],
  define: {
    __DEFINES__: "{}",
    __HMR_CONFIG_NAME__: '""',
    __BASE__: '"/"',
    __VITE_PRELOAD_EXCLUDE__: "[]",
    __VITE_PUBLIC_PATH__: '"/"',
    __VITE_PLUGINS__: "[]",
  },
  build: {
    outDir: "dist",
  },
});

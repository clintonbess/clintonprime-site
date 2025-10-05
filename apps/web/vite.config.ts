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
    __VITE_BUILD_INFO__: "{}",
    __SERVER__: "false",
    __VITE_BASE_URL__: '"/"',
    __VITE_APP_ENV__: '"development"',
    __VITE_APP_NAME__: '"clintonprime-site"',
    __VITE_APP_VERSION__: '"0.0.1"',
    __VITE_APP_BUILD_TIME__: `"${new Date().toISOString()}"`,
    __VITE_APP_BUILD_NUMBER__: '"1"',
  },
  build: {
    outDir: "dist",
  },
});

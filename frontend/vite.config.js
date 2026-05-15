import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
      "/ws": {
        target: "ws://localhost:3002",
        ws: true,
        changeOrigin: true,
      },
      "/grafana": {
        target: "http://localhost:3003",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/grafana/, ""),
      },
      "/prometheus": {
        target: "http://localhost:9090",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/prometheus/, ""),
      },
      "/metrics": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/metrics/, "/metrics"),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: process.env.NODE_ENV === "development",
    minify: "esbuild",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom")
          ) {
            return "vendor";
          }
          if (id.includes("node_modules/recharts")) {
            return "recharts";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "lucide";
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ["@tanstack/react-table"],
    oxc: {
      drop: ["console"],
    },
  },
});

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [TanStackRouterVite(), react(), tailwindcss()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
      cors: true,
      headers: {
        "Content-Security-Policy": "frame-ancestors 'self' https://web.telegram.org https://t.me https://*.telegram.org https://*.google.com https://*.run.app https://ais-pre-iycvwkbdk2nfogeohjrobv-237278842798.us-east5.run.app https://ais-dev-iycvwkbdk2nfogeohjrobv-237278842798.us-east5.run.app",
        "X-Frame-Options": "ALLOWALL",
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
    },
    preview: {
      host: "0.0.0.0",
      port: 3000,
    },
  };
});

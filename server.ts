import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for CORS and CSP headers required for Telegram Web App
  app.use((req, res, next) => {
    // Basic CORS for Telegram
    res.setHeader("Access-Control-Allow-Origin", "*"); // Or "https://web.telegram.org"
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // allow framing by Telegram and self
    res.setHeader(
      "Content-Security-Policy",
      "frame-ancestors 'self' https://web.telegram.org https://t.me https://ais-pre-iycvwkbdk2nfogeohjrobv-237278842798.us-east5.run.app",
    );

    // Also set X-Frame-Options to allow framing (CSP frame-ancestors takes precedence in modern browsers)
    res.removeHeader("X-Frame-Options");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});

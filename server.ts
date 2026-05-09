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
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    
    // CSP specifically for Telegram Web (Desktop and Mobile) and AI Studio
    // We include self, all telegram versions, and Google domains from the logs.
    const csp = [
      "frame-ancestors",
      "'self'",
      "https://web.telegram.org",
      "https://*.telegram.org",
      "https://t.me",
      "https://*.t.me",
      "https://web.tlgrm.app",
      "https://*.tlgrm.app",
      "https://*.google.com",
      "https://localhost.corp.google.com:26001",
      "https://*.run.app",
      "https://*.googleusercontent.com",
      "https://*.lovable.app",
      "https://ais-pre-*.run.app", // AI Studio Shared link
      "https://ais-dev-*.run.app"  // AI Studio Dev link
    ].join(" ");
    
    res.setHeader("Content-Security-Policy", csp);
    
    // Completely remove X-Frame-Options to favor CSP
    res.removeHeader("X-Frame-Options");    
    // Disable caching of security headers during development/debug
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

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
    
    // Serve static assets
    app.use(express.static(distPath));
    
    // Fallback all routes to index.html for SPA (Catch-all middleware)
    app.use((req, res) => {
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) {
          console.error("Error sending index.html:", err);
          res.status(500).send("Server Error");
        }
      });
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

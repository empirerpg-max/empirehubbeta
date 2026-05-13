import express from "express";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configura o timezone do servidor para o fuso de Brasília (GMT-3)
  process.env.TZ = "America/Sao_Paulo";

  // Middleware para configurar headers básicos e CORS (essencial para Telegram Mini Apps)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (origin.includes("telegram.org") || origin.includes("run.app") || origin.includes("localhost"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    // Essencial para Telegram Mini Apps: permitir iFrame
    res.removeHeader("X-Frame-Options");
    
    const csp = [
      "frame-ancestors 'self'",
      "https://web.telegram.org",
      "https://*.web.telegram.org",
      "https://telegram.org",
      "https://*.telegram.org",
      "https://*.google.com",
      "https://*.run.app"
    ].join(" ");
    
    res.setHeader("Content-Security-Policy", csp);
    res.setHeader("X-Content-Type-Options", "nosniff");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    
    next();
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files and fallback to index.html
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

startServer();

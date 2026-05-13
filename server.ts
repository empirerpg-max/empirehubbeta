import express from "express";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configura o timezone do servidor para o fuso de Brasília (GMT-3)
  process.env.TZ = "America/Sao_Paulo";

  // Middleware para configurar headers básicos e CORS
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Permite qualquer origin do Telegram ou do próprio app para evitar erros de fetch
    if (origin && (origin.includes("telegram.org") || origin.includes("run.app") || origin.includes("localhost"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    // Essencial para Telegram Mini Apps: remover restrições de iFrame que o Google impõe por padrão
    res.removeHeader("X-Frame-Options");
    
    // Esta CSP é a que permite o jogo abrir dentro do iFrame do Telegram (Web e App)
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

  if (process.env.NODE_ENV !== "production") {
    // Import dinâmico do Vite para não quebrar em produção onde o vite pode não estar instalado
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const base = "/empirehubbeta";
    
    // Serve arquivos estáticos de ambos: raiz e caminho do GitHub para compatibilidade
    app.use(base, express.static(distPath));
    app.use(express.static(distPath));
    
    // Rota de saúde para monitoramento
    app.get("/api/health", (req, res) => res.json({ status: "ok" }));
    
    // Fallback para SPA - usando middleware genérico para evitar erros de regex no Express 5
    app.use((req, res, next) => {
      if (req.method === "GET" && (req.accepts("html") || !req.accepts("json"))) {
        return res.sendFile(path.join(distPath, "index.html"));
      }
      next();
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();

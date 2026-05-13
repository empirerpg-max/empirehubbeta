import express from "express";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware para configurar headers básicos
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    
    // Header necessário para o Telegram Mini Apps funcionar em iFrames e Preview
    // Incluindo domínios do Google e Telegram para evitar erros de frame-ancestors
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://web.telegram.org https://*.web.telegram.org https://telegram.org https://*.telegram.org https://*.google.com https://*.run.app;");
    res.setHeader("X-Content-Type-Options", "nosniff");
    
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
    // Usamos o caminho base sem barra final para pegar tanto /base quanto /base/
    app.use(base, express.static(distPath));
    app.use(express.static(distPath));
    
    // Fallback para SPA - serve o index.html para qualquer rota não encontrada
    // Usando a sintaxe correta do Express 5 (* seguido de um nome)
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();

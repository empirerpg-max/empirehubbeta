import { useEffect, useState } from "react";

// Tipos mínimos pro Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        setHeaderColor?: (c: string) => void;
        setBackgroundColor?: (c: string) => void;
        initDataUnsafe?: { user?: { id: number; first_name?: string; username?: string } };
      };
    };
  }
}

export interface TgUser {
  id: string;
  name?: string;
  isTest: boolean;
}

export function useTelegramUser(): { user: TgUser | null; ready: boolean } {
  const [user, setUser] = useState<TgUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1) Procure por IDs comuns na URL (id, tg_id, user_id, uid, telegram_id)
    const params = new URLSearchParams(window.location.search);
    console.log("DEBUG URL Params:", window.location.search);

    const urlId =
      params.get("id") ||
      params.get("tg_id") ||
      params.get("user_id") ||
      params.get("uid") ||
      params.get("telegram_id") ||
      params.get("tgid") ||
      params.get("tgid");

    const nameFromUrl =
      params.get("name") ||
      params.get("username") ||
      params.get("first_name") ||
      params.get("user_name");

    if (urlId) {
      console.log("Usuário detectado via URL:", urlId);
      const newUser = {
        id: urlId,
        name: nameFromUrl || "Usuário",
        isTest: urlId.startsWith("test"),
      };
      setUser(newUser);
      localStorage.setItem("tg_user_cache", JSON.stringify(newUser));
      setReady(true);
      return;
    }

    // 2) Tentar Telegram WebApp SDK ou Hash (comum em web.telegram.org)
    const tg = window.Telegram?.WebApp;
    let sdkUser = tg?.initDataUnsafe?.user;
    let rawInitData = tg?.initData;

    // Função auxiliar para tentar pegar usuario de uma string de initData
    const userFromInitData = (str: string) => {
      try {
        const p = new URLSearchParams(str);
        const u = p.get("user");
        if (u) return JSON.parse(u);
      } catch (e) { return null; }
    };

    // Se o SDK não entregou o usuário, tentamos parsear a URL manualmente
    if (!sdkUser) {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash.includes("?") 
        ? window.location.hash.split("?")[1] 
        : window.location.hash.slice(1);
      const hashParams = new URLSearchParams(hash);
      
      const webAppDataStr = hashParams.get("tgWebAppData") || searchParams.get("tgWebAppData") || searchParams.get("initData");
      
      if (webAppDataStr) {
        rawInitData = webAppDataStr;
        sdkUser = userFromInitData(webAppDataStr);
        if (sdkUser) console.log("Usuário detectado manual via URL:", sdkUser.id);
      }
    }

    if (sdkUser) {
      if (tg) tg.ready();
      const newUser = {
        id: String(sdkUser.id),
        name: sdkUser.first_name || sdkUser.username || "Usuário",
        isTest: false,
      };
      setUser(newUser);
      localStorage.setItem("tg_user_cache", JSON.stringify(newUser));
      if (tg) tg.expand();
      setReady(true);
      return;
    }

    // 3) Tentar recuperar do localStorage (persitência entre páginas)
    const cached = localStorage.getItem("tg_user_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        console.log("Usuário recuperado do cache:", parsed.id);
        setUser(parsed);
        setReady(true);
        return;
      } catch (e) {
        console.error("Erro ao ler cache de usuário:", e);
      }
    }

    // 4) Fallback final
    console.warn("Nenhum ID detectado. Usando Guest.");
    setUser({ id: "guest", name: "Guest", isTest: true });
    setReady(true);
  }, []);

  return { user, ready };
}

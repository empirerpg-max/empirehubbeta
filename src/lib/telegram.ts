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

    // 2) Tentar Telegram WebApp SDK
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      const u = tg.initDataUnsafe?.user;
      if (u) {
        console.log("Usuário detectado via SDK:", u.id);
        const newUser = {
          id: String(u.id),
          name: u.first_name || u.username || "Usuário",
          isTest: false,
        };
        setUser(newUser);
        localStorage.setItem("tg_user_cache", JSON.stringify(newUser));
        tg.expand();
        setReady(true);
        return;
      } else {
        console.log("SDK detectado mas sem dados de usuário.");
      }
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

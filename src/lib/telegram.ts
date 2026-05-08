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

    // 1) Modo de teste via querystring
    const params = new URLSearchParams(window.location.search);
    const testId = params.get("tg_id");
    if (testId) {
      setUser({ id: testId, name: "Teste", isTest: true });
      setReady(true);
      return;
    }

    // 2) Telegram WebApp real
    const tg = window.Telegram?.WebApp;
    console.log("Telegram WebApp object:", tg);
    
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        tg.setHeaderColor?.("#000000");
        tg.setBackgroundColor?.("#0a0a0a");
      } catch (err) {
        console.error("Telegram WebApp init failed:", err);
      }
      
      const u = tg.initDataUnsafe?.user;
      console.log("Telegram user data:", u);
      
      if (u) {
        setUser({
          id: String(u.id),
          name: u.first_name || u.username || "Usuario",
          isTest: false,
        });
        setReady(true);
        return;
      }
    }

    // 3) Fallback para desenvolvimento local ou fora do Telegram
    console.warn("Nenhum usuário do Telegram detectado. Usando fallback.");
    setUser({ id: "anon_guest", name: "Guest", isTest: true });
    setReady(true);
  }, []);

  return { user, ready };
}

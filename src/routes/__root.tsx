import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import { Home, Crown, Library, Radio, Disc3, ListMusic, ShoppingBag, Star, Mic2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#000000" },
      { title: "Empire Hub" },
      {
        name: "description",
        content: "Gerencie seus artistas, suba nos charts e construa um império musical.",
      },
      { name: "author", content: "Empire RPG" },
      { property: "og:title", content: "Empire Hub" },
      {
        property: "og:description",
        content: "Gerencie seus artistas, suba nos charts e construa um império musical.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Empire Hub" },
      {
        name: "twitter:description",
        content: "Gerencie seus artistas, suba nos charts e construa um império musical.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/130c3ca4-e5a2-42b6-b630-b40d622d345c/id-preview-b6ad8193--6634bb87-7b09-47bf-82c3-5047e8bc7caa.lovable.app-1777495380913.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/130c3ca4-e5a2-42b6-b630-b40d622d345c/id-preview-b6ad8193--6634bb87-7b09-47bf-82c3-5047e8bc7caa.lovable.app-1777495380913.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
      },
    ],
    scripts: [{ src: "https://telegram.org/js/telegram-web-app.js" }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeadContent />
      {children}
      <Scripts />
    </>
  );
}

function RootComponent() {
  return (
    <div className="min-h-screen flex flex-col bg-background pb-24">
      {/* Filtro SVG global para o efeito charcoal-sketch configurado no index.css */}
      <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
        <filter id="charcoal-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
        </filter>
      </svg>
      
      <Outlet />
      <BottomNav />
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

function BottomNav() {
  const { pathname } = useLocation();
  const items = [
    { to: "/", label: "Hub", icon: Home },
    { to: "/artistas", label: "Artistas", icon: Library },
    { to: "/albuns", label: "Álbuns", icon: Disc3 },
    { to: "/tours", label: "Tours", icon: Mic2 },
    { to: "/market", label: "Market", icon: ShoppingBag },
    { to: "/charts", label: "Rankings", icon: Star },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto max-w-2xl flex items-center justify-around px-1 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((it) => {
          const active = pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to));
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon
                className={`size-5 ${active ? "scale-110" : ""}`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="text-[9px] font-bold uppercase tracking-wider">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

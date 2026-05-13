import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Radio,
  Library,
  Star,
  Sparkles,
  AlertTriangle,
  Crown,
  Building2,
  ShoppingBag,
  Film,
  HandHeart,
  Dice5,
  Gavel,
  Swords,
  Megaphone,
  HelpCircle,
  Gamepad2,
  Disc3,
  ListMusic,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { useTelegramUser } from "@/lib/telegram";
import { api, fmtEC, fmtMoney, driveImg, type Artist, type RadarItem, invalidateCache } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, ready } = useTelegramUser();
  const [artists, setArtists] = useState<Artist[] | null>(null);
  const [radar, setRadar] = useState<RadarItem[]>([]);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 6) setGreeting("Boa madrugada");
    else if (h < 12) setGreeting("Bom dia");
    else if (h < 18) setGreeting("Boa tarde");
    else setGreeting("Boa noite");
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (user && user.id !== "guest") {
      api
        .meusArtistas(user.id)
        .then(setArtists)
        .catch((err) => {
          console.error("Erro ao carregar artistas:", err);
          setArtists([]);
          toast.error("Erro de conexão", {
            description: "Não foi possível carregar seus artistas.",
          });
        });
    } else if (user?.id === "guest") {
      setArtists([]);
    }
    api
      .radar()
      .then((r) => setRadar(r.slice(0, 6)))
      .catch(() => {});
  }, [ready, user]);

  const handleSync = () => {
    invalidateCache();
    toast.success("Sincronizando...", {
      description: "Buscando dados mais recentes do Império.",
    });
    // Trigger re-fetch
    if (user && user.id !== "guest") {
      api.meusArtistas(user.id).then(setArtists);
    }
    api.radar().then((r) => setRadar(r.slice(0, 6)));
  };

  return (
    <main
      className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6 pb-12"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Filtro SVG para efeito Carvão/Sketch */}
      <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
        <filter id="charcoal-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
        </filter>
      </svg>

      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-black mb-1 px-1"
          >
            Soberania Musical
          </p>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight leading-tight">
              {greeting}
              {user?.name && user.id !== "guest" ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <button 
              onClick={handleSync}
              className="p-2 rounded-xl bg-white/5 active:bg-white/10 active:scale-90 transition-all text-muted-foreground/50 hover:text-primary mt-1"
              title="Sincronizar"
            >
              <RotateCw className="size-4" />
            </button>
          </div>
        </div>
        {user && (
          <div className="size-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center font-black shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] charcoal-sketch border-2 border-primary/20">
            {(user.name?.[0] || "U").toUpperCase()}
          </div>
        )}
      </header>

      {/* Meus artistas — Destaque Horizontal */}
      {user && (
        <section className="mb-10">
          <SectionHeader title="Meu Plantel" linkTo="/artistas" />
          {artists === null ? (
            <Skeleton h={160} />
          ) : artists.length === 0 ? (
            <EmptyCard>Você ainda não recrutou talentos para sua dinastia.</EmptyCard>
          ) : (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-4">
              {artists.map((a) => (
                <Link
                  key={a.nome}
                  to="/artistas/$nome/"
                  params={{ nome: a.nome }}
                  className="shrink-0 w-32 group"
                >
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-secondary mb-3 shadow-xl transition-transform group-active:scale-95 border border-white/5 relative">
                    <img
                      src={driveImg(a.foto, 300)}
                      alt={a.nome}
                      loading="lazy"
                      className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                       <p className="font-bold text-xs truncate leading-none mb-1">{a.nome}</p>
                       <p className="text-[10px] font-black text-primary uppercase">{fmtEC(a.saldo)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Hubs de Gestão Criativa */}
      <div className="space-y-10">
        <Category
          title="Empire Studio"
          description="Gestão de Talentos e Lançamentos"
          items={[
            {
              to: "/artistas",
              search: { filter: "all" },
              label: "Empire Artists",
              icon: <Library className="size-5" />,
            },
            { to: "/incubadora", label: "Empire Corp", icon: <Building2 className="size-5" /> },
            { to: "/albuns", label: "Empire Albums", icon: <Disc3 className="size-5" /> },
            { to: "/playlists", label: "Empire Playlists", icon: <ListMusic className="size-5" /> },
          ]}
        />

        <Category
          title="Empire Market"
          description="Investimentos e Transações"
          items={[
            { to: "/market", label: "Empire Market", icon: <ShoppingBag className="size-5" /> },
            { to: "/leiloes", label: "Empire Auctions", icon: <Gavel className="size-5" /> },
            { to: "/payola", label: "Empire Payola", icon: <Megaphone className="size-5" /> },
            { to: "/filantropia", label: "Empire Philanthropy", icon: <HandHeart className="size-5" /> },
          ]}
        />

        <Category
          title="Empire Coliseum"
          description="Dominação e Competitividade"
          items={[
            { to: "/charts", label: "Empire Rankings", icon: <Star className="size-5" /> },
            { to: "/duelo", label: "Empire Duels", icon: <Swords className="size-5" /> },
            { to: "/hall", label: "Empire Hall", icon: <Crown className="size-5" /> },
          ]}
        />

        <Category
          title="Empire Extras"
          description="Sorte, Entretenimento e Suporte"
          items={[
            { to: "/bet", label: "Empire Bet", icon: <Dice5 className="size-5" /> },
            { to: "/games", label: "Empire Games", icon: <Gamepad2 className="size-5" /> },
            { to: "/radar", label: "Empire Radar", icon: <Radio className="size-5" /> },
            { to: "/tutorial", label: "Empire Guide", icon: <HelpCircle className="size-5" /> },
          ]}
        />
      </div>

      {/* Radar feed simplificado */}
      <section className="mt-12 mb-8">
        <SectionHeader title="Flashes da Indústria" linkTo="/radar" />
        <div className="grid grid-cols-1 gap-2">
          {radar.slice(0, 4).map((r, i) => (
             <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 active:bg-white/[0.05] transition-colors">
                <div className="size-10 rounded-lg overflow-hidden shrink-0 border border-white/10 charcoal-sketch">
                   <img src={driveImg(r.foto, 100)} alt={r.nome} className="w-full h-full object-cover grayscale" />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-xs font-bold truncate">{r.nome}</p>
                   <p className="text-[10px] text-muted-foreground truncate italic">{r.acao}</p>
                </div>
                <div className="text-[9px] font-bold text-muted-foreground/50">{r.timestamp.split(" ")[1]}</div>
             </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 flex items-center justify-center gap-2">
           EST. 2026 • EMPIRE HUB • CONSTRUA SEU LEGADO
        </p>
      </footer>
    </main>
  );
}

type CategoryItem = {
  to?: string;
  search?: any;
  label: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
};

function Category({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: CategoryItem[];
}) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-lg font-black tracking-tight">{title}</h3>
        <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
          {description}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => (
          <ShortcutTile key={i} {...item} />
        ))}
      </div>
    </section>
  );
}

function ShortcutTile({
  to,
  search,
  label,
  icon,
  comingSoon,
}: {
  to?: string;
  search?: any;
  label: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}) {
  if (comingSoon || !to) {
    return (
      <button
        onClick={() =>
          toast(label + " — em breve", { description: "Estamos trabalhando nessa tela." })
        }
        className="flex items-center gap-3 p-3 rounded-xl bg-card/60 hover:bg-secondary transition-colors text-left relative overflow-hidden"
      >
        <div className="size-12 rounded-lg bg-muted/40 text-muted-foreground grid place-items-center">
          {icon}
        </div>
        <div className="min-w-0">
          <span className="block font-bold text-sm truncate">{label}</span>
          <span className="block text-[9px] uppercase font-bold tracking-wider text-muted-foreground/70">
            Em breve
          </span>
        </div>
      </button>
    );
  }
  return (
    <Link
      to={to}
      search={search}
      className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-secondary transition-colors group"
    >
      <div className="size-12 rounded-lg bg-primary/15 text-primary grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <span className="font-bold text-sm">{label}</span>
    </Link>
  );
}

function SectionHeader({ title, linkTo }: { title: string; linkTo?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="text-lg font-extrabold">{title}</h2>
      {linkTo && (
        <Link
          to={linkTo}
          className="text-xs uppercase tracking-wider text-muted-foreground font-bold hover:text-foreground"
        >
          Ver tudo
        </Link>
      )}
    </div>
  );
}

function Skeleton({ h }: { h: number }) {
  return <div className="rounded-xl bg-card animate-pulse" style={{ height: h }} />;
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

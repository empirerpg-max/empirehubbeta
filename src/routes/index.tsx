import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { toast } from "sonner";
import { useTelegramUser } from "@/lib/telegram";
import { api, fmtEC, fmtMoney, driveImg, type Artist, type RadarItem } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, ready, setUserManually } = useTelegramUser();
  const [artists, setArtists] = useState<Artist[] | null>(null);
  const [radar, setRadar] = useState<RadarItem[]>([]);
  const [greeting, setGreeting] = useState("");
  const [manualId, setManualId] = useState("");

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
          setArtists([]); // Fallback para lista vazia se falhar
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

  return (
    <main
      className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <p
            className="text-xs uppercase tracking-widest text-muted-foreground font-bold group cursor-help"
            onClick={() => {
              const params = new URLSearchParams(window.location.search).toString();
              toast.info("Debug Info", {
                description: `ID: ${user?.id} | Name: ${user?.name}`,
                action: {
                  label: "Reset",
                  onClick: () => {
                    localStorage.removeItem("tg_user_cache");
                    window.location.reload();
                  },
                },
              });
            }}
          >
            Empire Hub <Sparkles className="inline size-2 opacity-50" />
          </p>
          <h1 className="text-2xl font-extrabold mt-1">
            {greeting}
            {user?.name && user.id !== "guest" ? `, ${user.name}` : ""}
          </h1>
        </div>
        {user && (
          <div className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center font-black text-sm">
            {(user.name?.[0] || "U").toUpperCase()}
          </div>
        )}
      </header>

      {user?.id === "guest" && ready && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-500">
          <Sparkles className="size-8 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-2">Bem-vindo ao Império!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Não conseguimos detectar seu ID do Telegram automaticamente. 
            Insira-o abaixo para continuar.
          </p>
          <div className="flex gap-2 max-w-xs mx-auto">
            <input
              type="text"
              placeholder="Digite seu ID ou Nome"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              onKeyDown={(e) => e.key === "Enter" && manualId && setUserManually(manualId)}
            />
            <button
              onClick={() => manualId && setUserManually(manualId)}
              className="h-10 px-4 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
            >
              Entrar
            </button>
          </div>
        </div>
      )}

      {/* Quick grid — Spotify-style shortcut tiles */}
      <section className="grid grid-cols-2 gap-3 mb-8">
        <ShortcutTile to="/artistas" label="Meus Artistas" icon={<Library className="size-5" />} />
        <ShortcutTile to="/charts" label="Império" icon={<Crown className="size-5" />} />
        <ShortcutTile
          to="/market"
          label="Market & Mural"
          icon={<ShoppingBag className="size-5" />}
        />
        <ShortcutTile to="/ranking" label="Ranking" icon={<Star className="size-5" />} />
        <ShortcutTile to="/gravadoras" label="Gravadoras" icon={<Building2 className="size-5" />} />
        <ShortcutTile to="/radar" label="Acontecendo" icon={<Radio className="size-5" />} />
        <ShortcutTile to="/hall" label="Hall da Fama" icon={<Star className="size-5" />} />
        <ShortcutTile to="/games" label="Games" icon={<Gamepad2 className="size-5" />} />
        <ShortcutTile to="/duelo" label="Duelo" icon={<Swords className="size-5" />} />
        <ShortcutTile to="/bet" label="Empire Bets" icon={<Dice5 className="size-5" />} />
        <ShortcutTile to="/leiloes" label="Leilões" icon={<Gavel className="size-5" />} />
        <ShortcutTile to="/payola" label="Central Payola" icon={<Megaphone className="size-5" />} />
        <ShortcutTile
          to="/filantropia"
          label="Filantropia"
          icon={<HandHeart className="size-5" />}
        />
        <ShortcutTile to="/incubadora" label="Incubadora" icon={<Building2 className="size-5" />} />
        <ShortcutTile to="/tutorial" label="Tutorial" icon={<HelpCircle className="size-5" />} />
      </section>

      {/* Meus artistas — horizontal */}
      {user && (
        <section className="mb-8">
          <SectionHeader title="Seus artistas" linkTo="/artistas" />
          {artists === null ? (
            <Skeleton h={150} />
          ) : artists.length === 0 ? (
            <EmptyCard>Você ainda não gerencia nenhum artista.</EmptyCard>
          ) : (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
              {artists.map((a) => (
                <Link
                  key={a.nome}
                  to="/artistas/$nome"
                  params={{ nome: a.nome }}
                  className="shrink-0 w-36"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-secondary mb-2 shadow-lg">
                    <img
                      src={driveImg(a.foto, 300)}
                      alt={a.nome}
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-bold text-sm truncate">{a.nome}</p>
                  <p className="text-xs text-muted-foreground">{fmtEC(a.saldo)}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Radar mini-feed */}
      <section className="mb-8">
        <SectionHeader title="Acontecendo agora" linkTo="/radar" />
        {radar.length === 0 ? (
          <Skeleton h={80} />
        ) : (
          <ul className="space-y-2">
            {radar.map((r, i) => (
              <li key={i} className="flex items-center gap-3 p-2 rounded-xl bg-card">
                <img
                  src={driveImg(r.foto, 120)}
                  alt={r.nome}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                  }}
                  className="size-12 rounded-lg object-cover bg-secondary"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{r.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.acao}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/70 shrink-0">
                  {r.timestamp.split(" ")[1]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground/60 py-6 flex items-center justify-center gap-1">
        <Sparkles className="size-3" /> Empire RPG • Music Industry Game
      </p>
    </main>
  );
}

function ShortcutTile({
  to,
  label,
  icon,
  comingSoon,
}: {
  to?: string;
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

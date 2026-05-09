import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ShoppingBag,
  Loader2,
  X,
  Music,
  Building2,
  Briefcase,
  Sparkles,
  Plane,
} from "lucide-react";
import { useTelegramUser } from "@/lib/telegram";
import { api, fmtEC, type MarketItem, type MuralItem, type Artist } from "@/lib/api";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/market")({
  component: MarketPage,
});

const CAT_META: Record<string, { label: string; icon: React.ReactNode; gradient: string }> = {
  MARKET: {
    label: "Boosts & Eventos",
    icon: <Sparkles className="size-4" />,
    gradient: "linear-gradient(135deg, oklch(0.55 0.2 280), oklch(0.4 0.15 280))",
  },
  IMOVEIS: {
    label: "Imóveis",
    icon: <Building2 className="size-4" />,
    gradient: "linear-gradient(135deg, oklch(0.55 0.2 145), oklch(0.4 0.15 145))",
  },
  CARREIRA: {
    label: "Carreira",
    icon: <Briefcase className="size-4" />,
    gradient: "linear-gradient(135deg, oklch(0.55 0.2 60), oklch(0.4 0.15 60))",
  },
  TOURS: {
    label: "Tours",
    icon: <Plane className="size-4" />,
    gradient: "linear-gradient(135deg, oklch(0.55 0.2 30), oklch(0.4 0.15 30))",
  },
  MURAL: {
    label: "Composições",
    icon: <Music className="size-4" />,
    gradient: "linear-gradient(135deg, oklch(0.55 0.2 200), oklch(0.4 0.15 200))",
  },
};

// Categorias do CONFIG_SISTEMA que viram catálogo de compra direta
const VISIBLE_CATS = ["MARKET", "IMOVEIS", "CARREIRA"];

function MarketPage() {
  const { user, ready } = useTelegramUser();
  const [tab, setTab] = useState<"catalogo" | "mural">("catalogo");
  const [cat, setCat] = useState<string>("ALL");
  const [items, setItems] = useState<MarketItem[] | null>(null);
  const [mural, setMural] = useState<MuralItem[] | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [buying, setBuying] = useState<
    { kind: "market"; item: MarketItem } | { kind: "mural"; item: MuralItem } | null
  >(null);

  useEffect(() => {
    api.listarMarket().then(setItems);
    api.listarMural().then(setMural);
  }, []);
  useEffect(() => {
    if (!ready || !user) return;
    api.meusArtistas(user.id).then(setArtists);
  }, [ready, user]);

  const cats = useMemo(() => {
    if (!items) return VISIBLE_CATS;
    const fromData = Array.from(new Set(items.map((i) => i.categoria))).filter((c) =>
      VISIBLE_CATS.includes(c),
    );
    return fromData.length ? fromData : VISIBLE_CATS;
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return (
      items
        .filter((i) => VISIBLE_CATS.includes(i.categoria))
        .filter((i) => cat === "ALL" || i.categoria === cat)
        // remove linhas-config que não são "compráveis" (preço < 1000 normalmente são taxas)
        .filter((i) => i.preco >= 1000)
    );
  }, [items, cat]);

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl">
      <div
        className="px-4 pt-4 pb-6"
        style={{ background: "linear-gradient(180deg, oklch(0.32 0.16 280 / 0.55), transparent)" }}
      >
        <Link to="/" className="inline-flex items-center gap-1 text-foreground/80 mb-4">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="size-12 rounded-xl bg-primary/15 text-primary grid place-items-center">
            <ShoppingBag className="size-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              Loja
            </p>
            <h1 className="text-2xl font-black">Empire Market</h1>
          </div>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-4">
        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-card">
          <TabBtn active={tab === "catalogo"} onClick={() => setTab("catalogo")}>
            Catálogo
          </TabBtn>
          <TabBtn active={tab === "mural"} onClick={() => setTab("mural")}>
            Composições
          </TabBtn>
        </div>

        {tab === "catalogo" && (
          <>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
              <CatChip active={cat === "ALL"} onClick={() => setCat("ALL")} label="Tudo" />
              {cats.map((c) => (
                <CatChip
                  key={c}
                  active={cat === c}
                  onClick={() => setCat(c)}
                  label={CAT_META[c]?.label || c}
                  icon={CAT_META[c]?.icon}
                />
              ))}
            </div>

            {items === null ? (
              <Skeleton h={300} />
            ) : filtered.length === 0 ? (
              <EmptyCard>Nenhum item disponível nessa categoria.</EmptyCard>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((it, i) => (
                  <button
                    key={`${it.categoria}-${it.item}-${i}`}
                    onClick={() => setBuying({ kind: "market", item: it })}
                    className="text-left rounded-xl overflow-hidden bg-card hover:scale-[1.02] transition-transform"
                  >
                    <div
                      className="aspect-video grid place-items-center text-white"
                      style={{
                        background:
                          CAT_META[it.categoria]?.gradient || "linear-gradient(135deg, #555, #222)",
                      }}
                    >
                      <div className="size-12 rounded-full bg-white/15 grid place-items-center backdrop-blur">
                        {CAT_META[it.categoria]?.icon || <ShoppingBag className="size-5" />}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        {CAT_META[it.categoria]?.label || it.categoria}
                      </p>
                      <p className="font-extrabold text-sm leading-tight mt-0.5 line-clamp-2">
                        {it.item}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{it.efeito}</p>
                      <p className="text-sm font-black text-primary mt-2">{fmtEC(it.preco)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "mural" && (
          <>
            {mural === null ? (
              <Skeleton h={200} />
            ) : mural.length === 0 ? (
              <EmptyCard>Nenhuma composição à venda no momento.</EmptyCard>
            ) : (
              <div className="space-y-2">
                {mural.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setBuying({ kind: "mural", item: m })}
                    className="w-full text-left p-4 rounded-xl bg-card hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="font-extrabold text-sm">{m.titulo}</p>
                      <span className="text-sm font-black text-primary shrink-0">
                        {fmtEC(m.preco)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">por {m.vendedor}</p>
                    {m.teaser && (
                      <p className="text-xs mt-2 line-clamp-2 italic text-foreground/80">
                        "{m.teaser}"
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {buying && (
        <BuyModal
          buying={buying}
          artists={artists}
          onClose={() => setBuying(null)}
          onSuccess={() => {
            setBuying(null);
            // refresh
            api.listarMural().then(setMural);
          }}
        />
      )}
    </main>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2 rounded-lg text-sm font-extrabold uppercase tracking-wider transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
    >
      {children}
    </button>
  );
}
function CatChip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
    >
      {icon} {label}
    </button>
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

function BuyModal({
  buying,
  artists,
  onClose,
  onSuccess,
}: {
  buying: { kind: "market"; item: MarketItem } | { kind: "mural"; item: MuralItem };
  artists: Artist[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nome, setNome] = useState<string>(artists[0]?.nome || "");
  const [submitting, setSubmitting] = useState(false);

  const titulo = buying.kind === "market" ? buying.item.item : buying.item.titulo;
  const preco = buying.kind === "market" ? buying.item.preco : buying.item.preco;
  const sub = buying.kind === "market" ? buying.item.efeito : `por ${buying.item.vendedor}`;

  const artist = artists.find((a) => a.nome === nome);
  const podeComprar = artist ? artist.saldo >= preco : false;

  async function go() {
    if (!nome) return;
    setSubmitting(true);
    const r = (buying.kind === "market"
      ? await api.comprarMarket({
          nome,
          categoria: buying.item.categoria,
          item: buying.item.item,
        })
      : await api.comprarMural({ nome, id: buying.item.id })) as string;
    const { ok } = notify(r, { successFallback: "Compra confirmada!" });
    setSubmitting(false);
    if (ok) onSuccess();
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-5 border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold">Comprar item</h3>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-secondary grid place-items-center"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4 rounded-xl bg-background mb-4">
          <p className="font-extrabold text-base">{titulo}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          <p className="text-xl font-black text-primary mt-2">{fmtEC(preco)}</p>
        </div>

        <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
          Comprar com
        </label>
        {artists.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-1">Você não gerencia nenhum artista.</p>
        ) : (
          <select
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm mt-1 mb-2"
          >
            {artists.map((a) => (
              <option key={a.nome} value={a.nome}>
                {a.nome} — {fmtEC(a.saldo)}
              </option>
            ))}
          </select>
        )}
        {artist && !podeComprar && (
          <p className="text-xs text-destructive mb-2">
            Saldo insuficiente. Falta {fmtEC(preco - artist.saldo)}.
          </p>
        )}

        <button
          onClick={go}
          disabled={submitting || !nome || !podeComprar}
          className="w-full py-3 rounded-full bg-primary text-primary-foreground font-extrabold uppercase tracking-wider text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 mt-2"
        >
          {submitting && <Loader2 className="size-4 animate-spin" />} Confirmar compra
        </button>
      </div>
    </div>
  );
}

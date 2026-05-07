import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, HandHeart, Loader2, Heart, Sparkles, Star } from "lucide-react";
import { api, fmtEC, type Artist } from "@/lib/api";
import { useTelegramUser } from "@/lib/telegram";
import { notify } from "@/lib/notify";
import { Field, Input } from "./acoes.tour";

export const Route = createFileRoute("/filantropia")({
  component: FilantropiaPage,
});

const CAUSAS = [
  { id: "nature", label: "Preservação da Amazônia", icon: "🌳" },
  { id: "hunger", label: "Combate à Fome", icon: "🍛" },
  { id: "children", label: "Educação Infantil", icon: "📚" },
  { id: "health", label: "Saúde Pública", icon: "🏥" },
  { id: "arts", label: "Fomento às Artes", icon: "🎨" },
];

function FilantropiaPage() {
  const { user, ready } = useTelegramUser();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [selectedArtist, setSelectedArtist] = useState("");
  const [causa, setCausa] = useState(CAUSAS[0].label);
  const [valor, setValor] = useState("100000");

  useEffect(() => {
    if (!ready || !user) return;
    api.meusArtistas(user.id).then((a) => {
      setArtists(a);
      if (a.length > 0) setSelectedArtist(a[0].nome);
      setLoading(false);
    });
  }, [ready, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const vNum = parseFloat(valor);
    if (!selectedArtist || !causa || vNum < 100000) {
        notify({ erro: "Valor mínimo: EC 100.000" });
        return;
    }
    setSubmitting(true);
    const r = await api.filantropia(selectedArtist, causa, valor);
    notify(r, { successFallback: "Doação realizada! Seu prestígio aumentou." });
    setSubmitting(false);
    if (r) setValor("100000");
  }

  const artist = artists.find(a => a.nome === selectedArtist);
  const vNum = parseFloat(valor) || 0;
  const prestigioEstimado = Math.min(50, Math.floor(vNum / 10000));

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6 pb-20">
      <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground mb-4">
        <ChevronLeft className="size-4" /> Voltar
      </Link>

      <header className="mb-8">
        <div className="size-12 rounded-xl bg-red-500/15 text-red-500 grid place-items-center mb-4">
          <HandHeart className="size-6" />
        </div>
        <h1 className="text-3xl font-black">Filantropia</h1>
        <p className="text-muted-foreground mt-2">Doe para causas sociais e aumente seu prestígio e reputação.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <Field label="Doador">
            <select
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm"
              disabled={loading}
            >
              {artists.map((a) => (
                <option key={a.nome} value={a.nome}>
                  {a.nome} ({fmtEC(a.saldo)})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Escolher Causa">
            <select
              value={causa}
              onChange={(e) => setCausa(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm"
            >
              {CAUSAS.map((c) => (
                <option key={c.id} value={c.label}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Valor da Doação (Mín EC 100k)">
            <Input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="100000"
              required
            />
          </Field>
        </div>

        <div className="flex gap-3">
            <div className="flex-1 p-4 rounded-2xl bg-secondary border border-border text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Gasto</p>
                <p className="text-sm font-black text-destructive">{fmtEC(vNum)}</p>
            </div>
            <div className="flex-1 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                <p className="text-[10px] uppercase font-bold text-primary mb-1">Prestígio</p>
                <div className="flex items-center justify-center gap-1">
                    <Star className="size-3 text-primary" fill="currentColor" />
                    <p className="text-sm font-black text-primary">+{prestigioEstimado}</p>
                </div>
            </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed italic flex items-start gap-2">
            <Sparkles className="size-4 text-yellow-500 shrink-0" />
            Empresas fundações próprias ou entrar em existentes melhoram o legado do artista e sua chance de ganhar prêmios.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedArtist || vNum < 100000}
          className="w-full py-4 rounded-full bg-red-500 text-white font-extrabold shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Heart className="size-4" />}
          Realizar Doação
        </button>
      </form>
    </main>
  );
}

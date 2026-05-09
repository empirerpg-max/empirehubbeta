import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Dice5,
  Loader2,
  Info,
  Trophy,
} from "lucide-react";
import { api, fmtEC, driveImg } from "@/lib/api";
import { useTelegramUser } from "@/lib/telegram";
import { notify } from "@/lib/notify";
import { Field, Input } from "./acoes.tour";

export const Route = createFileRoute("/bet")({
  component: BetPage,
});

interface BetMusic {
  musica: string;
  artista: string;
  capa: string;
  posicao?: number;
}

function BetPage() {
  const { user, ready } = useTelegramUser();
  const [artists, setArtists] = useState<Record<string, any>[]>([]);
  const [betData, setBetData] = useState<{
    semana: string;
    musicas: BetMusic[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [selectedArtist, setSelectedArtist] = useState("");
  const [valor, setValor] = useState("");
  const [bets, setBets] = useState<Record<string, string>>({}); // { musica: posicao }

  useEffect(() => {
    if (!ready || !user) return;
    Promise.all([api.meusArtistas(user.id), api.getMusicasBet()]).then(
      ([a, b]) => {
        setArtists(a);
        if (a.length > 0) setSelectedArtist(a[0].nome);
        if (b) setBetData(b);
        setLoading(false);
      }
    );
  }, [ready, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedArtist || !valor || !betData || Object.keys(bets).length === 0) {
      notify({
        erro: "Preencha o artista, valor da aposta e pelo menos uma previsão.",
      });
      return;
    }
    setSubmitting(true);
    const r = await api.bet({
      nome: selectedArtist,
      valor: parseFloat(valor),
      semana: betData.semana,
      previsoes: JSON.stringify(bets),
    });
    notify(r, { successFallback: "Aposta registrada no Empire Bet!" });
    setSubmitting(false);
  }

  const updBet = (musica: string, pos: string) => {
    setBets((prev) => {
      const next = { ...prev };
      if (pos === "") delete next[musica];
      else next[musica] = pos;
      return next;
    });
  };

  if (loading) {
    return (
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-40 text-center">
        <Loader2 className="size-10 animate-spin mx-auto text-primary" />
      </main>
    );
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6 pb-20">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-muted-foreground mb-4"
      >
        <ChevronLeft className="size-4" /> Voltar
      </Link>

      <header className="mb-8">
        <div className="size-12 rounded-xl bg-purple-500/15 text-purple-500 grid place-items-center mb-4">
          <Dice5 className="size-6" />
        </div>
        <h1 className="text-3xl font-black">Empire Bet</h1>
        <p className="text-muted-foreground mt-2">
          Aposte nas posições da Hot 100 e multiplique seus ganhos.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <Field label="Apostar com">
            <select
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm"
            >
              {artists.map((a) => (
                <option key={a.nome} value={a.nome}>
                  {a.nome} ({fmtEC(a.saldo)})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Valor da Aposta (Mín EC 10.000)">
            <Input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ex: 50000"
              required
            />
          </Field>
        </div>

        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              Hot 100 da Semana: {betData?.semana}
            </h2>
            <Link
              to="/charts"
              className="text-[10px] text-primary font-bold uppercase underline"
            >
              Ver tudo
            </Link>
          </div>

          <div className="space-y-2">
            {betData?.musicas.map((m) => (
              <div
                key={m.musica}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border group transition-all focus-within:border-primary"
              >
                <img
                  src={driveImg(m.capa, 100)}
                  alt=""
                  className="size-10 rounded-md object-cover bg-secondary"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{m.musica}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {m.artista}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black text-muted-foreground">
                    Posição:
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="—"
                    value={bets[m.musica] || ""}
                    onChange={(e) => updBet(m.musica, e.target.value)}
                    className="w-12 bg-background border border-border rounded px-1.5 py-1 text-center text-xs font-bold focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3 font-medium text-xs text-muted-foreground">
          <p className="flex items-start gap-2">
            <Trophy className="size-3 text-purple-500 mt-0.5" />
            <span>Acerto exato dobra o multiplicador relativo.</span>
          </p>
          <p className="flex items-start gap-2">
            <Info className="size-3 text-purple-500 mt-0.5" />
            <span>
              Quanto mais próximo da posição real na próxima semana, maior o
              prêmio.
            </span>
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || !valor || Object.keys(bets).length === 0}
          className="w-full py-4 rounded-full bg-purple-600 text-white font-extrabold shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Dice5 className="size-4" />
          )}
          Registrar Aposta
        </button>
      </form>
    </main>
  );
}

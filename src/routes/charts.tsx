import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { api, fmtMoney, driveImg, type Artist } from "@/lib/api";

export const Route = createFileRoute("/charts")({
  component: Charts,
});

function Charts() {
  const [data, setData] = useState<Artist[] | null>(null);
  const [tab, setTab] = useState<"prestigio" | "fortuna" | "saldo">("prestigio");

  useEffect(() => {
    api.listarTodos().then(setData);
  }, []);

  const sorted = (data || []).slice().sort((a, b) => {
    if (tab === "prestigio") return b.prestigio - a.prestigio;
    if (tab === "fortuna") return b.fortuna_total - a.fortuna_total;
    return b.saldo - a.saldo;
  });

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6">
      <header className="mb-5 flex items-center gap-3">
        <Crown className="size-7 text-primary" />
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
            O estado do
          </p>
          <h1 className="text-3xl font-extrabold">Império</h1>
        </div>
      </header>

      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {[
          { id: "prestigio", label: "Prestígio" },
          { id: "fortuna", label: "Fortuna" },
          { id: "saldo", label: "$EC" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {data === null ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <ol className="space-y-2">
          {sorted.slice(0, 50).map((a, i) => (
            <li key={a.nome} className="flex items-center gap-3 p-2 rounded-xl bg-card">
              <span
                className={`w-7 text-center font-black text-lg ${i < 3 ? "text-primary" : "text-muted-foreground"}`}
              >
                {i + 1}
              </span>
              <img
                src={driveImg(a.foto)}
                alt={a.nome}
                loading="lazy"
                className="size-12 rounded-lg object-cover bg-secondary"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{a.nome}</p>
                <p className="text-xs text-muted-foreground">{a.gravadora}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-sm">
                  {tab === "prestigio"
                    ? `${a.prestigio}`
                    : tab === "fortuna"
                      ? fmtMoney(a.fortuna_total)
                      : `EC ${a.saldo.toLocaleString("pt-BR")}`}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {tab === "prestigio" ? "/1000" : ""}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

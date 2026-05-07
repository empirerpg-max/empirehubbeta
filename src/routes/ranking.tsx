import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { api, fmtMoney, driveImg, type Artist } from "@/lib/api";

export const Route = createFileRoute("/ranking")({ component: Ranking });

function Ranking() {
  const [data, setData] = useState<Artist[] | null>(null);
  useEffect(() => {
    api.listarTodos().then(setData);
  }, []);
  const sorted = (data || [])
    .slice()
    .sort((a, b) => b.fortuna_total - a.fortuna_total)
    .slice(0, 50);

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6">
      <header className="mb-5 flex items-center gap-3">
        <Crown className="size-7 text-primary" />
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
            Os mais ricos
          </p>
          <h1 className="text-3xl font-extrabold">Ranking de Fortuna</h1>
        </div>
      </header>
      {data === null ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <ol className="space-y-2">
          {sorted.map((a, i) => (
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
              <span className="font-black text-sm">{fmtMoney(a.fortuna_total)}</span>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

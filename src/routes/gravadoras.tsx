import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { api, fmtMoney, type Artist } from "@/lib/api";

export const Route = createFileRoute("/gravadoras")({ component: Gravadoras });

function Gravadoras() {
  const [data, setData] = useState<Artist[] | null>(null);
  useEffect(() => {
    api.listarTodos().then(setData);
  }, []);

  const labels = useMemo(() => {
    const map = new Map<
      string,
      { nome: string; artistas: number; prestigio: number; fortuna: number }
    >();
    (data || []).forEach((a) => {
      const key = a.gravadora || "Independent";
      const cur = map.get(key) || { nome: key, artistas: 0, prestigio: 0, fortuna: 0 };
      cur.artistas += 1;
      cur.prestigio += a.prestigio;
      cur.fortuna += a.fortuna_total;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.prestigio - a.prestigio);
  }, [data]);

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6">
      <header className="mb-5 flex items-center gap-3">
        <Building2 className="size-7 text-primary" />
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
            As majors
          </p>
          <h1 className="text-3xl font-extrabold">Gravadoras</h1>
        </div>
      </header>
      {data === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <ol className="space-y-2">
          {labels.map((g, i) => (
            <li key={g.nome} className="flex items-center gap-3 p-3 rounded-xl bg-card">
              <span
                className={`w-7 text-center font-black ${i < 3 ? "text-primary" : "text-muted-foreground"}`}
              >
                {i + 1}
              </span>
              <div className="size-12 rounded-lg bg-primary/15 text-primary grid place-items-center font-black">
                {g.nome.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{g.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {g.artistas} artista{g.artistas !== 1 && "s"} • {fmtMoney(g.fortuna)}
                </p>
              </div>
              <span className="font-black text-sm">{g.prestigio}</span>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Briefcase } from "lucide-react";
import { api, type Projeto } from "@/lib/api";

export const Route = createFileRoute("/artistas/$nome/projetos")({ component: Projetos });

function Projetos() {
  const { nome } = Route.useParams();
  const [items, setItems] = useState<Projeto[] | null>(null);
  useEffect(() => {
    api.projetos(nome).then(setItems);
  }, [nome]);

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6">
      <Link
        to="/artistas/$nome"
        params={{ nome }}
        className="inline-flex items-center gap-1 text-muted-foreground mb-4"
      >
        <ChevronLeft className="size-4" /> Voltar
      </Link>
      <header className="mb-5 flex items-center gap-3">
        <Briefcase className="size-7 text-primary" />
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
            {nome}
          </p>
          <h1 className="text-2xl font-extrabold">Projetos</h1>
        </div>
      </header>
      {items === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center mt-2">
          <div className="size-14 rounded-full bg-primary/15 text-primary grid place-items-center mx-auto mb-3">
            <Briefcase className="size-6" />
          </div>
          <p className="font-extrabold mb-1">Nenhum projeto ainda</p>
          <p className="text-xs text-muted-foreground mb-4">
            Filmes, séries e blockbusters de{" "}
            <span className="font-bold text-foreground">{nome}</span> aparecem aqui depois de
            lançados.
          </p>
          <Link
            to="/acoes/cinema"
            search={{ nome }}
            className="inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-extrabold uppercase tracking-wider"
          >
            Lançar Cinema/TV
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((p, i) => (
            <li key={i} className="p-3 rounded-xl bg-card">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  {p.tipo}
                </p>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.status === "Em andamento" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}
                >
                  {p.status || "—"}
                </span>
              </div>
              <p className="font-bold mt-1">{p.titulo}</p>
              {p.detalhe && <p className="text-xs text-muted-foreground mt-1">{p.detalhe}</p>}
              {p.data && <p className="text-[10px] text-muted-foreground/70 mt-1">{p.data}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

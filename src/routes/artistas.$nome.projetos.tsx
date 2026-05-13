import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Briefcase, ChevronRight, Star, TrendingUp } from "lucide-react";
import { api, type Projeto, type Artist } from "@/lib/api";

export const Route = createFileRoute("/artistas/$nome/projetos")({ component: Projetos });

function Projetos() {
  const { nome } = Route.useParams();
  const [items, setItems] = useState<Projeto[] | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);

  useEffect(() => {
    api.projetos(nome).then(setItems);
    api.listarTodos().then((list) => {
      setArtist(list.find((a) => a.nome === nome) || null);
    });
  }, [nome]);

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6">
      <Link
        to="/artistas/$nome/"
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

      {/* Seção de Turnê em Andamento */}
      {artist?.tour_info && (
        <section className="mb-8">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-primary mb-3 pl-1 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Turnê em Andamento
          </h3>
          <Link
            to="/tours/$nome/"
            params={{ nome }}
            className="block group"
          >
            <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 group-hover:bg-white/[0.06] transition-all group-hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden">
               <div className="absolute -right-6 -bottom-6 size-24 bg-primary/10 blur-2xl rounded-full" />
               <div className="flex justify-between items-start mb-3">
                 <div>
                   <p className="text-lg font-black italic uppercase italic tracking-tighter">
                     {(artist.tour_info as any).titulo || "The Empire Tour"}
                   </p>
                   <p className="text-xs text-muted-foreground font-bold">
                     {(artist.tour_info as any).tipo} • {(artist.tour_info as any).continente}
                   </p>
                 </div>
                 <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
               </div>
               
               <div className="space-y-3">
                 <div className="flex justify-between text-[10px] font-black uppercase">
                   <span className="text-muted-foreground">Progresso</span>
                   <span>{(artist.tour_info as any).shows_realizados || 0} / {(artist.tour_info as any).qtd || 10} Shows</span>
                 </div>
                 <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-primary" 
                     style={{ width: `${Math.min(100, (((artist.tour_info as any).shows_realizados || 0) / ((artist.tour_info as any).qtd || 10)) * 100)}%` }}
                   />
                 </div>
                 <div className="flex items-center gap-4 text-[9px] font-bold uppercase text-muted-foreground">
                   <span className="flex items-center gap-1">
                     <Star className="size-3 text-amber-500" /> {(artist.tour_info as any).sold_outs || 0} Sold Outs
                   </span>
                   <span className="flex items-center gap-1">
                     <TrendingUp className="size-3 text-emerald-500" /> Ativo
                   </span>
                 </div>
               </div>
            </div>
          </Link>
        </section>
      )}

      <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-3 pl-1">
        Lançamentos e Mídias
      </h3>

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

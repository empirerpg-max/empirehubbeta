import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useTelegramUser } from "@/lib/telegram";
import { api, fmtEC, driveImg, type Artist } from "@/lib/api";

export const Route = createFileRoute("/artistas/")({
  component: ArtistasList,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      filter: (search.filter as string) || "mine",
    };
  },
});

function ArtistasList() {
  const { user, ready } = useTelegramUser();
  const { filter } = Route.useSearch();
  const [artists, setArtists] = useState<Artist[] | null>(null);

  useEffect(() => {
    if (!ready) return;

    if (filter === "all") {
      api.listarTodos().then(setArtists);
    } else {
      if (!user || user.id === "guest") {
        setArtists([]);
        return;
      }
      api.meusArtistas(user.id).then(setArtists);
    }
  }, [ready, user, filter]);

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6">
      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-black mb-1">
          {filter === "all" ? "Indústria Imperial" : "Catalogação de Talentos"}
        </p>
        <h1 className="text-3xl font-black tracking-tight">
          {filter === "all" ? "Empire Industry" : "Empire Artists"}
        </h1>
      </header>
      {!user && ready && (
        <p className="text-sm text-muted-foreground">O acesso exige identificação imperial via Telegram.</p>
      )}
      {artists === null ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-card animate-pulse border border-white/5" />
          ))}
        </div>
      ) : artists.length === 0 ? (
        <p className="text-sm text-muted-foreground py-16 text-center italic">
          {filter === "all" ? "Nenhuma lenda registrada no império." : "Nenhuma lenda sob seu comando ainda."}
        </p>
      ) : (
        <ul className="space-y-4">
          {[...artists]
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .map((a) => {
              const isAllFilter = filter === "all";
              const showDescription =
                a.descricao &&
                a.descricao !== "" &&
                a.descricao !== "Ainda não há nada por aqui sobre esse artista.";

              if (isAllFilter) {
                const generoVal = a.genero && a.genero.trim() !== "" ? a.genero : null;
                const paisVal = a.pais && a.pais.trim() !== "" ? a.pais : null;
                
                // Limpa descrições curtas ou placeholders como "sim", "não", etc.
                const cleanDescription = (a.descricao || "").trim();
                const hasDescription = 
                  cleanDescription.length > 3 && 
                  !["sim", "não", "vazio", "n/a"].includes(cleanDescription.toLowerCase());

                return (
                  <li key={a.nome}>
                    <div className="p-4 rounded-[28px] bg-card/50 border border-white/5 shadow-2xl relative overflow-hidden group backdrop-blur-sm">
                      <div className="absolute top-0 right-0 size-40 bg-primary/5 blur-[50px] -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                      
                      <div className="flex gap-4 relative z-10">
                        <div className="size-20 shrink-0 rounded-2xl overflow-hidden border-2 border-white/10 bg-slate-900 shadow-xl self-start">
                          <img
                            src={driveImg(a.foto)}
                            alt={a.nome}
                            loading="lazy"
                            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1514525253361-bee8718a300c?w=400&h=400&fit=crop";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col pt-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            {generoVal && (
                              <span className="text-[9px] font-black uppercase tracking-widest bg-primary/20 text-primary px-2.5 py-1 rounded-md border border-primary/30 shadow-sm">
                                {generoVal}
                              </span>
                            )}
                            {paisVal && (
                              <span className="text-[9px] font-bold text-white/90 uppercase tracking-tight bg-white/10 px-2.5 py-1 rounded-md border border-white/10 shadow-sm backdrop-blur-md flex items-center gap-1">
                                <span className="opacity-50">📍</span> {paisVal}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-xl font-black italic uppercase tracking-tighter leading-tight text-white mb-1 group-hover:text-primary transition-colors">
                            {a.nome}
                          </h3>

                          <div className="flex items-center gap-3 mb-2">
                             <div className="flex flex-col">
                               <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider">Fortuna</span>
                               <span className="text-[10px] font-black text-emerald-400">{fmtEC(a.fortuna_total)}</span>
                             </div>
                             <div className="w-[1px] h-6 bg-white/5" />
                             <div className="flex flex-col">
                               <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider">Prestígio</span>
                               <span className="text-[10px] font-black text-amber-400">{a.prestigio.toLocaleString('pt-BR')} pts</span>
                             </div>
                          </div>

                          {hasDescription && (
                            <p className="text-[10px] text-muted-foreground leading-tight italic line-clamp-3 opacity-80 border-t border-white/5 pt-2">
                              {a.descricao}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li key={a.nome}>
                  <Link
                    to="/artistas/$nome/"
                    params={{ nome: a.nome }}
                    className="flex items-center gap-4 p-3 pr-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    <div className="size-16 rounded-xl overflow-hidden bg-secondary border border-white/10 shadow-lg">
                      <img
                        src={driveImg(a.foto)}
                        alt={a.nome}
                        loading="lazy"
                        className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-lg tracking-tight truncate">{a.nome}</p>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                        {fmtEC(a.saldo)} <span className="text-muted-foreground/40 mx-1">•</span> {a.gravadora}
                      </p>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </Link>
                </li>
              );
            })}
        </ul>
      )}
    </main>
  );
}

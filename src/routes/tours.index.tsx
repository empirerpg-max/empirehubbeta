import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mic2, Globe, Users, Ticket, ChevronRight, Loader2 } from "lucide-react";
import { api, type Artist, fmtMoney } from "@/lib/api";

export const Route = createFileRoute("/tours/")({
  component: ToursIndex,
});

function ToursIndex() {
  const [tours, setTours] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta primeiro o endpoint dedicado de tours
    Promise.all([
      api.listTours(),
      api.listarTodos()
    ]).then(([toursList, allArtists]) => {
      let finalTours: any[] = [];

      // 1. Prioridade: dados vindos do listar_tours (CONTROLE_TOURS)
      if (Array.isArray(toursList) && toursList.length > 0) {
        finalTours = toursList.map(t => ({
          artista: t.artista || t.nome || t.nome_artista || t.ARTISTA || "",
          foto: t.foto || t.capa || t.FOTO || t.CAPA || "",
          titulo: t.titulo || t.nome_tour || t.TOUR || t.TITULO || "The Empire Tour",
          tipo: t.tipo || t.TIPO || "Arena",
          status: t.status || t.STATUS || "Em andamento",
          shows: Number(t.qtd || t.shows || t.SHOWS || 10),
          realizados: Number(t.shows_realizados || t.realizados || t.REALIZADOS || 0),
          soldOuts: Number(t.sold_outs || t.soldouts || t.SOLD_OUTS || 0),
          continente: t.continente || t.CONTINENTE || "Mundial",
        })).filter(t => t.artista); // Só mostra se tiver o nome do artista
      } 
      
      // 2. Fallback/Complemento: dados vindos do tour_info nos artistas
      if (finalTours.length === 0 && Array.isArray(allArtists)) {
        finalTours = allArtists
          .filter((a) => a.tour_info)
          .map((a) => {
            let info: any = a.tour_info;
            if (typeof info === "string") {
              try {
                const cleanJson = info.trim().replace(/^"+|"+$/g, "");
                info = JSON.parse(cleanJson);
              } catch {
                try {
                  info = JSON.parse(info);
                } catch {
                  return null;
                }
              }
            }
            if (!info || typeof info !== "object") return null;

            return {
              artista: a.nome,
              foto: a.foto,
              titulo: info.titulo || "The Empire Tour",
              tipo: info.tipo || "Arena",
              status: info.status || "Em andamento",
              shows: info.qtd || 10,
              realizados: info.shows_realizados || 0,
              soldOuts: info.sold_outs || 0,
              continente: info.continente || "Mundial",
            };
          })
          .filter((t): t is NonNullable<typeof t> => t !== null);
      }

      setTours(finalTours);
      setLoading(false);
    });
  }, []);

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6 pb-20">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="size-10 rounded-xl bg-primary/15 text-primary grid place-items-center">
            <Globe className="size-6" />
          </div>
          <h1 className="text-2xl font-black italic tracking-tight">Empire Tours</h1>
        </div>
        <p className="text-xs text-muted-foreground font-medium pl-1">
          Acompanhe as maiores turnês mundiais do Império
        </p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-50">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest">Carregando turnês...</p>
        </div>
      ) : !tours || tours.length === 0 ? (
        <div className="rounded-3xl bg-white/[0.03] border border-dashed border-white/10 p-12 text-center">
          <div className="size-16 rounded-full bg-muted/20 text-muted-foreground grid place-items-center mx-auto mb-4">
            <Mic2 className="size-8" />
          </div>
          <h2 className="text-lg font-bold mb-1">Silêncio nos Estádios</h2>
          <p className="text-sm text-muted-foreground max-w-[240px] mx-auto text-balance">
            Nenhuma turnê em andamento no momento. Quem será a próxima estrela na estrada?
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tours.map((t) => (
            <Link
              key={t.artista}
              to="/tours/$nome/"
              params={{ nome: t.artista }}
              className="block group"
            >
              <div className="relative overflow-hidden rounded-3xl bg-card border border-white/5 p-4 transition-all hover:bg-white/[0.06] hover:scale-[1.01] active:scale-[0.98] shadow-2xl shadow-black/20">
                {/* Background Glow */}
                <div className="absolute -right-20 -bottom-20 size-48 bg-primary/10 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex gap-4 items-center relative z-10">
                  <div className="relative size-20 shrink-0 rounded-2xl overflow-hidden border-2 border-white/10 bg-slate-900 shadow-lg">
                    <img
                      src={t.foto}
                      alt={t.artista}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">
                        {t.artista}
                      </span>
                      {t.status === "Em andamento" && (
                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                    
                    <h3 className="text-xl font-black italic uppercase tracking-tighter leading-tight truncate mb-2">
                      {t.titulo}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-black uppercase bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        <Users className="size-3 text-primary" /> {t.tipo}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-black uppercase bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        <Globe className="size-3 text-primary" /> {t.continente}
                      </div>
                    </div>
                  </div>
                  
                  <div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <ChevronRight className="size-5" />
                  </div>
                </div>

                <div className="mt-5 relative z-10">
                  <div className="flex justify-between items-end mb-2 px-1">
                    <div>
                      <p className="text-muted-foreground text-[8px] uppercase font-black tracking-widest mb-0.5">Execução</p>
                      <p className="text-xs font-black tracking-tight">
                        {t.realizados} <span className="text-muted-foreground/40 font-bold">/ {t.shows} SHOWS</span>
                      </p>
                    </div>
                    <div className="text-right">
                       <p className="text-muted-foreground text-[8px] uppercase font-black tracking-widest mb-0.5">Esgotados</p>
                       <p className="text-xs font-black text-amber-500 tracking-tight">{t.soldOuts} SOLD OUTS</p>
                    </div>
                  </div>
                  
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden p-[1px]">
                    <div 
                      className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-700" 
                      style={{ width: `${Math.min(100, (t.realizados / t.shows) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

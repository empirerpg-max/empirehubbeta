import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  ChevronLeft, 
  MapPin, 
  Ticket, 
  Users, 
  TrendingUp, 
  Calendar,
  Star,
  CheckCircle2,
  Mic2,
  Globe,
  Loader2
} from "lucide-react";
import { api, type Artist, fmtMoney, driveImg } from "@/lib/api";

export const Route = createFileRoute("/tours/$nome")({
  component: TourDetails,
});

function TourDetails() {
  const { nome } = Route.useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tourDetails, setTourDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listarTodos(),
      api.listTours(),
      api.getAgendaTour(nome)
    ]).then(([artists, toursList, agendaData]) => {
      const art = artists.find(a => a.nome === nome);
      setArtist(art || null);

      // Procura primeiro no list_tours (CONTROLE_TOURS)
      const tFromList = toursList.find(t => (t.artista || t.nome || t.nome_artista) === nome);
      
      if (agendaData && !agendaData.erro) {
        // Se temos dados da agenda real, priorizamos
        setTourDetails({
          titulo: agendaData.nome_tour || "The Empire Tour",
          tipo: agendaData.porte?.replace("Tour de ", "").replace(/s$/, "") || "Arena",
          status: agendaData.status || "Em andamento",
          qtd: Number(agendaData.total_shows || 10),
          shows_realizados: Number(agendaData.show_atual - 1 || 0),
          sold_outs: 0, // Agenda não costuma ter soldouts totalizados aqui
          continente: "Mundial",
          lucro: Number(agendaData.arrecadacao_total || 0),
          agenda: agendaData.agenda || []
        });
      } else if (tFromList) {
        setTourDetails({
          titulo: tFromList.titulo || tFromList.nome_tour || "The Empire Tour",
          tipo: tFromList.tipo || "Arena",
          status: tFromList.status || "Em andamento",
          qtd: Number(tFromList.qtd || tFromList.shows || 10),
          shows_realizados: Number(tFromList.shows_realizados || tFromList.realizados || 0),
          sold_outs: Number(tFromList.sold_outs || tFromList.soldouts || 0),
          continente: tFromList.continente || "Mundial",
          lucro: Number(tFromList.lucro || 0),
          seguidores_ganhos: Number(tFromList.seguidores_ganhos || 0),
          dataInicio: tFromList.dataInicio || tFromList.data_inicio || "",
          agenda: tFromList.agenda ? (typeof tFromList.agenda === 'string' ? JSON.parse(tFromList.agenda) : tFromList.agenda) : []
        });
      } else if (art && art.tour_info) {
        // Fallback para tour_info no artista
        let info = art.tour_info as any;
        if (typeof info === "string") {
          try {
            const cleanJson = info.trim().replace(/^"+|"+$/g, '');
            info = JSON.parse(cleanJson);
          } catch {
            try {
              info = JSON.parse(info);
            } catch {
              info = null;
            }
          }
        }
        setTourDetails(info);
      }
      setLoading(false);
    });
  }, [nome]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!artist || !tourDetails || typeof tourDetails !== "object" || !tourDetails.titulo) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
        <Mic2 className="size-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-black mb-2">Turnê não encontrada</h2>
        <p className="text-sm text-muted-foreground mb-6">Esta estrela não está na estrada no momento.</p>
        <Link to="/tours/" className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-black uppercase text-xs">
          Voltar para Turnês
        </Link>
      </div>
    );
  }

  const info = tourDetails;
  const totalShows = info.qtd || 10;
  const realizado = info.shows_realizados || 0;
  const progresso = (realizado / totalShows) * 100;

  // Usa a agenda real ou gera um mock se não houver
  const shows = (Array.isArray(info.agenda) && info.agenda.length > 0) 
    ? info.agenda.map((s: any, i: number) => ({
        id: i + 1,
        status: i < realizado ? "Realizado" : i === realizado ? "Hoje" : "Próximo",
        soldOut: s.vendidos >= s.capacidade * 0.95,
        cidade: s.local || "Cidade",
        data: s.data || ""
      }))
    : Array.from({ length: totalShows }).map((_, i) => ({
        id: i + 1,
        status: i < realizado ? "Realizado" : i === realizado ? "Hoje" : "Próximo",
        soldOut: i < realizado ? Math.random() > 0.3 : i === realizado ? Math.random() > 0.5 : false,
        cidade: ["New York", "London", "São Paulo", "Tokyo", "Paris", "Berlin", "Los Angeles", "Sydney", "Miami", "Toronto"][i % 10],
        data: new Date(new Date(info.dataInicio || Date.now()).getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      }));

  return (
    <main className="flex-1 pb-24 bg-background">
      {/* Header Imersivo */}
      <div className="relative h-80 overflow-hidden">
        {/* Camada de Fundo (Blur) */}
        <div className="absolute inset-0">
           <img 
            src={artist.foto} 
            className="w-full h-full object-cover blur-xl scale-110 opacity-30" 
            alt="" 
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        {/* Botão Voltar */}
        <Link 
          to="/tours/" 
          className="absolute top-6 left-5 z-10 size-11 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-transform active:scale-95 shadow-xl"
        >
          <ChevronLeft className="size-6 text-white" />
        </Link>

        {/* Conteúdo do Header */}
        <div className="absolute bottom-6 left-6 right-6 z-10">
          <div className="flex items-end gap-5">
            <div className="size-28 rounded-3xl overflow-hidden border-2 border-primary/20 shadow-2xl shrink-0 rotate-[-2deg]">
               <img 
                src={artist.foto} 
                className="w-full h-full object-cover object-top" 
                alt={artist.nome} 
              />
            </div>
            <div className="mb-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/20">
                  {info.tipo}
                </span>
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-tighter">
                  {info.continente}
                </span>
              </div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-1 text-white truncate drop-shadow-lg">
                {info.titulo}
              </h1>
              <p className="text-xs font-bold text-muted-foreground truncate italic">
                by {artist.nome}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-2 relative z-20">
        {/* Stats Grid - Layout App */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard 
            icon={<Star className="size-4" />} 
            label="Sold Outs" 
            value={info.sold_outs || 0} 
            sub="ESGOTADOS"
            color="text-amber-500"
          />
          <StatCard 
            icon={<Users className="size-4" />} 
            label="Público Est." 
            value={((info.shows_realizados || 0) * (info.tipo === "Estádio" ? 60000 : info.tipo === "Arena" ? 20000 : 3000)).toLocaleString()} 
            sub="FÃS PRESENTES"
            color="text-sky-400"
          />
          <StatCard 
            icon={<TrendingUp className="size-4" />} 
            label="Receita" 
            value={fmtMoney(info.lucro || 0)} 
            sub="BRUTO TOTAL"
            color="text-emerald-500"
          />
           <StatCard 
            icon={<Calendar className="size-4" />} 
            label="Concluídos" 
            value={`${realizado}/${totalShows}`} 
            sub="STATUS ROTA"
            color="text-primary"
          />
        </div>

        {/* Progress Bar Grande */}
        <div className="bg-card border border-white/5 rounded-[32px] p-6 mb-8 shadow-xl">
          <div className="flex justify-between items-center mb-4">
             <div>
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/90">Progresso da Tour</h3>
               <p className="text-[10px] text-muted-foreground font-medium uppercase">{info.status || "Em Rota Ativa"}</p>
             </div>
             <div className="text-right">
               <span className="text-3xl font-black italic text-primary">{Math.round(progresso)}%</span>
             </div>
          </div>
          <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] rounded-full transition-all duration-[1500ms] ease-out" 
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        {/* Datas Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5 px-1">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Próximas Paradas
            </h3>
            <span className="text-[10px] font-black text-primary font-mono">{totalShows} SHOWS TOTAL</span>
          </div>

          <div className="space-y-3">
            {shows.map((s) => (
              <div 
                key={s.id} 
                className={`group relative overflow-hidden p-4 rounded-[28px] border transition-all duration-300 ${
                  s.status === "Realizado" 
                    ? "bg-white/[0.01] border-white/5 opacity-40 grayscale" 
                    : s.status === "Hoje"
                      ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20 scale-[1.03] shadow-2xl shadow-primary/20"
                      : "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center gap-5 relative z-10">
                  {/* Data Badge */}
                  <div className={`size-14 shrink-0 rounded-2xl flex flex-col items-center justify-center border transition-colors ${
                    s.status === "Hoje" ? "bg-primary text-primary-foreground border-primary" : "bg-white/5 border-white/5"
                  }`}>
                    <p className={`text-[10px] font-black uppercase leading-none mb-1 ${s.status === "Hoje" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {s.data.includes("/") ? "DIA" : s.data.split(" ")[1] || "MAI"}
                    </p>
                    <p className="text-xl font-black tracking-tighter leading-none">
                      {s.data.split(" ")[0].split("/")[0] || s.id}
                    </p>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-base uppercase tracking-tight truncate text-white leading-none">
                        {s.cidade}
                      </p>
                      {s.status === "Hoje" && (
                        <div className="size-1.5 rounded-full bg-primary animate-ping" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 opacity-60">
                       <MapPin className="size-3" />
                       <p className="text-[10px] font-bold uppercase tracking-widest truncate">The Empire {info.tipo}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {s.status === "Realizado" ? (
                      <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      </div>
                    ) : s.status === "Hoje" ? (
                       <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-primary/50">
                          LIVE
                       </div>
                    ) : s.soldOut ? (
                      <div className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[7px] font-black uppercase">
                        SOLD OUT
                      </div>
                    ) : (
                      <Ticket className="size-5 text-muted-foreground/30" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode, label: string, value: string | number, sub: string, color: string }) {
  return (
    <div className="bg-card border border-white/5 rounded-[28px] p-4 relative overflow-hidden group transition-all hover:bg-white/[0.04]">
      {/* Decorative accent */}
      <div className={`absolute top-0 right-0 size-16 translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl opacity-10 ${color.replace('text', 'bg')}`} />
      
      <div className={`size-9 rounded-xl bg-white/5 grid place-items-center mb-3 transition-transform group-hover:scale-110 duration-300 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/80 mb-0.5">{label}</p>
        <p className="text-lg font-black tracking-tighter leading-none mb-1 text-white">{value}</p>
        <div className="flex items-center gap-1">
          <div className={`size-1 rounded-full ${color.replace('text', 'bg')}`} />
          <p className="text-[7px] font-bold text-muted-foreground/40 uppercase tracking-tighter">{sub}</p>
        </div>
      </div>
    </div>
  );
}

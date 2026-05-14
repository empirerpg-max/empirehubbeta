import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Gamepad2, Play, Star, Trophy } from "lucide-react";
import { useTelegramUser } from "@/lib/telegram";

export const Route = createFileRoute("/games/")({
  component: GamesHub,
});

function GamesHub() {
  const { user } = useTelegramUser();
  const games = [
    {
      id: "hits-producer",
      title: "Produtor de Hits",
      description: "Um jogo de ritmo frenético. Acerte as notas para criar o hit do ano!",
      image: "https://images.unsplash.com/photo-1514525253361-bee8718a74a2?q=80&w=400&h=250&auto=format&fit=crop",
      tag: "Destaque",
      difficulty: "Difícil",
      points: "Multiplicador de Wager",
      route: "/games/hits-producer"
    },
    {
      id: "studio-pet",
      title: "Mascote do Estúdio",
      description: "Cuide do seu pet virtual para ganhar bônus passivos na carreira.",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&h=250&auto=format&fit=crop",
      tag: "Idle",
      difficulty: "Fácil",
      points: "Loot Aleatório",
      route: "/games/studio-pet"
    },
    {
      id: "paparazzi-escape",
      title: "Fuga do Paparazzi",
      description: "Corra das câmeras! Decida quando parar antes que seja tarde demais.",
      image: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=400&h=250&auto=format&fit=crop",
      tag: "Risco",
      difficulty: "Médio",
      points: "Cash-Out Progressivo",
      route: "/games/paparazzi-escape"
    },
    {
      id: "popstar-quest",
      title: "Pop Star Quest",
      description: "Suba do Bubbling Under ao Hot 100 nesta aventura de plataforma!",
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&h=250&auto=format&fit=crop",
      tag: "Plataforma",
      difficulty: "Médio",
      points: "Fixo EC",
      route: "/games/popstar-quest"
    },
    {
      id: "chart-runner",
      title: "Chart Runner",
      description: "Desvie dos haters e colete certificados de platina.",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&h=250&auto=format&fit=crop",
      tag: "Infinito",
      difficulty: "Médio",
      points: "Até 1.000 EC",
      route: "/games/chart-runner" // Placeholder
    },
    {
      id: "lyric-master",
      title: "Lyric Master",
      description: "Complete as letras das músicas famosas do Império.",
      image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400&h=250&auto=format&fit=crop",
      tag: "Quiz",
      difficulty: "Fácil",
      points: "200 EC",
      route: "/games/lyric-master" // Placeholder
    },
    {
      id: "studio-tycoon",
      title: "Studio Tycoon",
      description: "Gerencie recursos limitados para gravar um álbum nota 10.",
      image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400&h=250&auto=format&fit=crop",
      tag: "Estratégia",
      difficulty: "Expert",
      points: "Ranking",
      route: "/games/studio-tycoon" // Placeholder
    },
    {
       id: "wheel-of-fame",
       title: "Roda da Fama",
       description: "Gire a roda e tente a sorte para ganhar prêmios raros.",
       image: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=400&h=250&auto=format&fit=crop",
       tag: "Sorte",
       difficulty: "Fácil",
       points: "Prêmios do Market",
       route: "/games/wheel-of-fame" // Placeholder
    },
    {
       id: "bet-on-charts",
       title: "Aposta nos Charts",
       description: "Aposte em quem vai subir ou descer na Billboard amanhã.",
       image: "https://images.unsplash.com/photo-1518893063132-36e46dbe2428?q=80&w=400&h=250&auto=format&fit=crop",
       tag: "Social",
       difficulty: "Difícil",
       points: "Aposta EC",
       route: "/games/bet-on-charts" // Placeholder
    },
    {
       id: "fan-clicker",
       title: "Fan Clicker",
       description: "Clique rápido para converter fãs casuais em stan de verdade.",
       image: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=400&h=250&auto=format&fit=crop",
       tag: "Clicker",
       difficulty: "Fácil",
       points: "Até 500 EC",
       route: "/games/fan-clicker" // Placeholder
    }
  ];

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6 pb-32">
      <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground mb-4 font-black uppercase text-[10px]">
        <ChevronLeft className="size-4" /> Voltar
      </Link>

      <header className="mb-8">
        <div className="size-14 rounded-2xl bg-primary text-black grid place-items-center mb-4 shadow-[4px_4px_0px_#000] border-2 border-black">
          <Gamepad2 className="size-7" />
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-black">Empire <span className="text-primary">Games</span></h1>
        <p className="text-black/60 font-medium mt-2">Jogue, ganhe Empire Coins e potencie sua carreira.</p>
      </header>


      {/* Guest Warning */}
      {user?.id === "guest" && (
        <section className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
          <p className="font-bold mb-1">Acesso via Telegram Web (PC)</p>
          Detectamos que você está usando a versão web do Telegram no computador. Às vezes ela não
          fornece sua identidade automaticamente. Se encontrar problemas, tente abrir o link direto
          do bot ou use o celular.
        </section>
      )}

      {/* ID Status Badge */}
      <div className="mb-6 flex justify-center">
        <div
          className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${user?.id === "guest" ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-primary/10 border-primary/30 text-primary"}`}
        >
          <div
            className={`size-2 rounded-full animate-pulse ${user?.id === "guest" ? "bg-red-500" : "bg-primary"}`}
          />
          ID do Telegram: <span className="font-mono tracking-wider">{user?.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {games.map((game) => (
          <Link
            key={game.id}
            to={game.route as any}
            className="group relative bg-white border-4 border-black p-4 rounded-[32px] transition-all hover:-translate-y-1 hover:shadow-[12px_12px_0px_#000] active:translate-y-0.5 active:shadow-none shadow-[8px_8px_0px_#000] flex gap-4 overflow-hidden"
          >
            {/* Glossy overlay effect */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10 pointer-events-none" />
            
            <div className="size-28 sm:size-32 rounded-2xl overflow-hidden border-2 border-black flex-shrink-0 relative">
              <img
                src={game.image}
                alt={game.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute top-2 right-2 bg-primary text-black text-[9px] font-black px-2 py-1 rounded-full border border-black uppercase tracking-widest shadow-[2px_2px_0px_#000]">
                {game.tag}
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center min-w-0">
              <div className="flex flex-col mb-1">
                <h2 className="text-xl sm:text-2xl font-black italic uppercase leading-none text-black truncate group-hover:text-primary transition-colors">{game.title}</h2>
                <p className="text-[11px] font-medium text-black/50 mt-1 line-clamp-2 leading-tight">{game.description}</p>
              </div>

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-black italic">
                  <Star className="size-3 text-amber-500 fill-amber-500" />
                  {game.difficulty}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-black italic">
                  <Trophy className="size-3 text-primary" />
                  {game.points}
                </div>
              </div>

              <div className="mt-4 py-2 rounded-xl bg-primary text-black font-black uppercase italic tracking-wider text-xs flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_#000] group-hover:bg-white transition-all">
                <Play className="size-4 fill-current" />
                Jogar Agora
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-12 p-6 rounded-3xl bg-secondary/50 border border-border/50 text-center">
        <h3 className="font-bold text-muted-foreground uppercase text-xs tracking-widest mb-2">
          Desafio da Semana
        </h3>
        <p className="text-sm font-medium">
          Chegue ao Top 10 no Pop Star Quest e ganhe um item raro no Market!
        </p>
      </section>
    </main>
  );
}

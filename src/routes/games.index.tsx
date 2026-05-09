import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Gamepad2, Play, Star, Trophy } from "lucide-react";
import { useTelegramUser } from "@/lib/telegram";

export const Route = createFileRoute("/games")({
  component: GamesHub,
});

function GamesHub() {
  const { user } = useTelegramUser();
  const games = [
    {
      id: "popstar-quest",
      title: "Pop Star Quest",
      description: "Suba do Bubbling Under ao Hot 100 nesta aventura de plataforma!",
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&h=250&auto=format&fit=crop",
      tag: "Novo",
      difficulty: "Médio",
      points: "Até 5.000 EC",
    },
  ];

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6 pb-20">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-muted-foreground mb-4"
      >
        <ChevronLeft className="size-4" /> Voltar
      </Link>

      <header className="mb-8">
        <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">
          <Gamepad2 className="size-6" />
        </div>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">
          Games Empire
        </h1>
        <p className="text-muted-foreground mt-2">
          Jogue e ganhe moedas para sua carreira.
        </p>
      </header>

      {/* ID Status Badge */}
      <div className="mb-6 flex justify-center">
        <div className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${user?.id === "guest" ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-primary/10 border-primary/30 text-primary"}`}>
          <div className={`size-2 rounded-full animate-pulse ${user?.id === "guest" ? "bg-red-500" : "bg-primary"}`} />
          ID do Telegram: <span className="font-mono tracking-wider">{user?.id}</span>
        </div>
      </div>

      <div className="grid gap-6">
        {games.map((game) => (
          <div
            key={game.id}
            className="group relative overflow-hidden rounded-3xl bg-card border border-border transition-all hover:border-primary/50"
          >
            <div className="aspect-video relative overflow-hidden">
              <img
                src={game.image}
                alt={game.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                {game.tag}
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-black italic uppercase">
                    {game.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    {game.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs font-bold">
                  <Star className="size-3.5 text-yellow-500 fill-yellow-500" />
                  {game.difficulty}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs font-bold">
                  <Trophy className="size-3.5 text-primary" />
                  {game.points}
                </div>
              </div>

              <Link
                to={("/games/" + game.id) as "/games/popstar-quest"}
                className="mt-6 w-full py-4 rounded-xl bg-primary text-primary-foreground font-black uppercase italic tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Play className="size-5 fill-current" />
                Jogar Agora
              </Link>
            </div>
          </div>
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

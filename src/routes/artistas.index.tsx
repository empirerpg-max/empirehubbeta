import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useTelegramUser } from "@/lib/telegram";
import { api, fmtEC, driveImg, type Artist } from "@/lib/api";

export const Route = createFileRoute("/artistas/")({
  component: ArtistasList,
});

function ArtistasList() {
  const { user, ready } = useTelegramUser();
  const [artists, setArtists] = useState<Artist[] | null>(null);

  useEffect(() => {
    if (!ready || !user) {
      setArtists([]);
      return;
    }
    api.meusArtistas(user.id).then(setArtists);
  }, [ready, user]);

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
          Sua biblioteca
        </p>
        <h1 className="text-3xl font-extrabold mt-1">Meus Artistas</h1>
      </header>
      {!user && ready && (
        <p className="text-sm text-muted-foreground">Sem ID do Telegram. Abra pelo bot.</p>
      )}
      {artists === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : artists.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Nenhum artista vinculado a este Telegram ID.
        </p>
      ) : (
        <ul className="space-y-2">
          {artists.map((a) => (
            <li key={a.nome}>
              <Link
                to="/artistas/$nome"
                params={{ nome: a.nome }}
                className="flex items-center gap-3 p-2 pr-4 rounded-xl bg-card hover:bg-secondary transition-colors"
              >
                <img
                  src={driveImg(a.foto)}
                  alt={a.nome}
                  loading="lazy"
                  className="size-14 rounded-lg object-cover bg-secondary"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{a.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtEC(a.saldo)} • {a.gravadora}
                  </p>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

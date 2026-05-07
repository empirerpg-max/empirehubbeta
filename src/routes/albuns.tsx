import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Disc3, Search } from "lucide-react";
import { api, driveImg, type AlbumPayload } from "@/lib/api";

export const Route = createFileRoute("/albuns")({
  component: AlbunsPage,
  head: () => ({
    meta: [
      { title: "Álbuns • Empire Hub" },
      { name: "description", content: "Todos os álbuns lançados no Empire." },
    ],
  }),
});

function AlbunsPage() {
  const [list, setList] = useState<AlbumPayload[] | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    api.listarAlbuns().then(setList);
  }, []);

  const filtered = (list || []).filter((a) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return a.titulo.toLowerCase().includes(s) || a.artista.toLowerCase().includes(s);
  });

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6">
      <header className="mb-5 flex items-center gap-3">
        <Disc3 className="size-7 text-primary" />
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
            Discoteca
          </p>
          <h1 className="text-2xl font-extrabold">Álbuns</h1>
        </div>
      </header>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por álbum ou artista"
          className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-3 text-sm"
        />
      </div>
      {list === null ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Nenhum álbum encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((a) => (
            <Link key={a.id} to="/album/$id" params={{ id: a.id! }} className="group">
              <div className="aspect-square rounded-xl overflow-hidden bg-secondary">
                {a.capa_url ? (
                  <img
                    src={driveImg(a.capa_url, 400)}
                    alt={a.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                ) : (
                  <Disc3 className="size-10 text-muted-foreground m-auto mt-12" />
                )}
              </div>
              <p className="mt-2 font-bold text-sm truncate">{a.titulo}</p>
              <p className="text-xs text-muted-foreground truncate">{a.artista}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

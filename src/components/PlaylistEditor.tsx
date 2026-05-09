import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ListMusic, Loader2, Plus, Trash2, Search, GripVertical } from "lucide-react";
import {
  api,
  driveImg,
  type AlbumPayload,
  type PlaylistPayload,
  type PlaylistTrack,
} from "@/lib/api";
import { useTelegramUser } from "@/lib/telegram";
import { notify } from "@/lib/notify";

export function PlaylistEditor({ existing }: { existing?: PlaylistPayload }) {
  const { user } = useTelegramUser();
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState(existing?.titulo || "");
  const [descricao, setDescricao] = useState(existing?.descricao || "");
  const [capa, setCapa] = useState(existing?.capa_url || "");
  const [owner, setOwner] = useState(existing?.owner || "");
  const [tracks, setTracks] = useState<PlaylistTrack[]>(existing?.tracks || []);
  const [albums, setAlbums] = useState<AlbumPayload[] | null>(null);
  const [q, setQ] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.listarAlbuns().then(setAlbums);
  }, []);

  const allTracks = useMemo(() => {
    if (!albums) return [];
    const out: PlaylistTrack[] = [];
    for (const a of albums) {
      for (const f of a.faixas || []) {
        out.push({
          album_id: a.id || "",
          faixa_numero: f.numero,
          titulo: f.titulo,
          artistas: f.artistas,
          drive_url: f.drive_url,
          capa_url: a.capa_url,
          duracao: f.duracao,
        });
      }
    }
    return out;
  }, [albums]);

  const filtered = q
    ? allTracks.filter((t) => `${t.titulo} ${t.artistas}`.toLowerCase().includes(q.toLowerCase()))
    : allTracks.slice(0, 30);

  function add(t: PlaylistTrack) {
    if (tracks.some((x) => x.album_id === t.album_id && x.faixa_numero === t.faixa_numero)) return;
    setTracks((prev) => [...prev, t]);
  }
  function rm(i: number) {
    setTracks((prev) => prev.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    setTracks((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function salvar() {
    if (!titulo || tracks.length === 0) return;
    setSubmitting(true);
    const payload: PlaylistPayload = {
      id: existing?.id,
      titulo,
      descricao,
      capa_url: capa,
      owner: owner || user?.name || "Player",
      telegram_id: user?.id,
      tracks,
      data: existing?.data || new Date().toISOString().slice(0, 10),
    };
    const r = await api.salvarPlaylist(payload);
    setSubmitting(false);
    const { ok } = notify(r as Record<string, unknown>, {
      successFallback: existing ? "Playlist atualizada!" : "Playlist criada!",
    });
    if (ok) {
      const id = (r as Record<string, unknown>)?.id as string | undefined || existing?.id;
      if (id) navigate({ to: "/playlists/$id", params: { id } });
      else navigate({ to: "/playlists" });
    }
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6 pb-32">
      <Link to="/playlists" className="inline-flex items-center gap-1 text-muted-foreground mb-4">
        <ChevronLeft className="size-4" /> Voltar
      </Link>
      <header className="mb-5 flex items-center gap-3">
        <ListMusic className="size-7 text-primary" />
        <h1 className="text-2xl font-extrabold">
          {existing ? "Editar playlist" : "Nova playlist"}
        </h1>
      </header>

      <div className="space-y-3 mb-6">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título da playlist"
          className="w-full bg-card border border-border rounded-xl px-3 py-3 text-sm"
        />
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição (opcional)"
          rows={2}
          className="w-full bg-card border border-border rounded-xl px-3 py-3 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={capa}
            onChange={(e) => setCapa(e.target.value)}
            placeholder="Capa (link Drive)"
            className="w-full bg-card border border-border rounded-xl px-3 py-3 text-sm"
          />
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Curador (você ou artista)"
            className="w-full bg-card border border-border rounded-xl px-3 py-3 text-sm"
          />
        </div>
      </div>

      <section className="mb-6">
        <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
          Faixas ({tracks.length})
        </h2>
        {tracks.length === 0 && (
          <p className="text-xs text-muted-foreground py-4">Adicione faixas dos álbuns abaixo.</p>
        )}
        <ul className="space-y-1">
          {tracks.map((t, i) => (
            <li key={i} className="flex items-center gap-2 p-2 rounded-lg bg-card">
              <GripVertical className="size-4 text-muted-foreground" />
              <button
                type="button"
                onClick={() => move(i, -1)}
                className="text-xs text-muted-foreground"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                className="text-xs text-muted-foreground"
              >
                ▼
              </button>
              {t.capa_url && (
                <img
                  src={driveImg(t.capa_url, 80)}
                  alt=""
                  className="size-8 rounded object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{t.titulo}</p>
                <p className="text-[10px] text-muted-foreground truncate">{t.artistas}</p>
              </div>
              <button type="button" onClick={() => rm(i)} className="text-destructive">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
          Catálogo
        </h2>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar faixa ou artista"
            className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm"
          />
        </div>
        {albums === null ? (
          <div className="h-24 rounded-xl bg-card animate-pulse" />
        ) : (
          <ul className="space-y-1 max-h-80 overflow-y-auto">
            {filtered.map((t, i) => (
              <li
                key={`${t.album_id}-${t.faixa_numero}-${i}`}
                className="flex items-center gap-2 p-2 rounded-lg bg-card hover:bg-secondary"
              >
                {t.capa_url && (
                  <img
                    src={driveImg(t.capa_url, 80)}
                    alt=""
                    className="size-8 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{t.titulo}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{t.artistas}</p>
                </div>
                <button
                  type="button"
                  onClick={() => add(t)}
                  className="size-8 rounded-full bg-primary/15 text-primary grid place-items-center"
                >
                  <Plus className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        onClick={salvar}
        disabled={submitting || !titulo || tracks.length === 0}
        className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-extrabold uppercase tracking-wider text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}{" "}
        {existing ? "Salvar alterações" : "Criar playlist"}
      </button>
    </main>
  );
}

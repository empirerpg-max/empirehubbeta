import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Mic2,
  Film,
  Disc3,
  Wallet,
  Trophy,
  Zap,
  Briefcase,
  Flame,
  HandHeart,
  X,
  Loader2,
  ShoppingBag,
  Building2,
  Gavel,
  Radio,
  FileX,
} from "lucide-react";
import { useTelegramUser } from "@/lib/telegram";
import { api, fmtEC, fmtMoney, driveImg, type Artist, type AlbumPayload } from "@/lib/api";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/artistas/$nome")({
  component: ArtistDashboard,
});

function ArtistDashboard() {
  const { nome } = Route.useParams();
  const { user, ready } = useTelegramUser();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<
    null | "viral" | "filantropia" | "payola" | "leilao" | "rescisao" | "composicao" | "imovel"
  >(null);
  const [albuns, setAlbuns] = useState<AlbumPayload[]>([]);

  useEffect(() => {
    if (!ready || !user) return;
    setLoading(true);
    api.meusArtistas(user.id).then((list) => {
      setArtist(list.find((a) => a.nome === nome) || null);
      setLoading(false);
    });
    api.listarAlbuns(nome).then(setAlbuns);
  }, [ready, user, nome]);

  if (loading) {
    return (
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6">
        <div className="h-64 rounded-2xl bg-card animate-pulse" />
      </main>
    );
  }
  if (!artist) {
    return (
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6">
        <Link to="/artistas" className="inline-flex items-center gap-1 text-muted-foreground mb-4">
          <ChevronLeft className="size-4" /> Voltar
        </Link>
        <p>Artista não encontrado.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl">
      <div
        className="relative px-4 pt-4 pb-6"
        style={{ background: "linear-gradient(180deg, oklch(0.32 0.16 145 / 0.55), transparent)" }}
      >
        <Link to="/artistas" className="inline-flex items-center gap-1 text-foreground/80 mb-4">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="flex items-end gap-4">
          <img
            src={driveImg(artist.foto, 400)}
            alt={artist.nome}
            className="size-32 rounded-xl object-cover shadow-2xl bg-secondary"
            loading="eager"
          />
          <div className="flex-1 min-w-0 pb-2">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              Artista
            </p>
            <h1 className="text-3xl font-black truncate">{artist.nome}</h1>
            <p className="text-xs text-muted-foreground mt-1">{artist.gravadora}</p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-bold">
          <span
            className={`size-2 rounded-full ${artist.status === "Livre" ? "bg-primary" : "bg-yellow-500"}`}
          />
          {artist.status === "Livre" ? "DISPONÍVEL" : artist.status.toUpperCase()}
        </div>
      </div>

      <div className="px-4 space-y-6">
        <section className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Wallet className="size-4" />}
            label="Saldo $EC"
            value={fmtEC(artist.saldo)}
            accent
          />
          <StatCard
            icon={<Briefcase className="size-4" />}
            label="Fortuna total"
            value={fmtMoney(artist.fortuna_total)}
          />
          <StatCard
            icon={<Trophy className="size-4" />}
            label="Prestígio"
            value={`${artist.prestigio}/1000`}
            bar={artist.prestigio / 10}
          />
          <StatCard
            icon={<Zap className="size-4" />}
            label="Fadiga"
            value={`${artist.fadiga}%`}
            bar={artist.fadiga}
            barColor="oklch(0.7 0.2 30)"
          />
        </section>

        <section>
          <h2 className="text-lg font-extrabold mb-3">Ações</h2>
          <div className="grid grid-cols-2 gap-3">
            <ActionLink
              to="/acoes/tour"
              params={{ nome: artist.nome }}
              icon={<Mic2 className="size-5" />}
              label="Comprar Tour"
            />
            <ActionLink
              to="/acoes/cinema"
              params={{ nome: artist.nome }}
              icon={<Film className="size-5" />}
              label="Cinema / TV"
            />
            <ActionLink
              to="/acoes/album"
              params={{ nome: artist.nome }}
              icon={<Disc3 className="size-5" />}
              label="Lançar Álbum"
            />
            <ActionButton
              onClick={() => setModal("viral")}
              icon={<Flame className="size-5" />}
              label="Viral"
            />
            <ActionButton
              onClick={() => setModal("filantropia")}
              icon={<HandHeart className="size-5" />}
              label="Filantropia"
            />
            <ActionButton
              onClick={() => setModal("payola")}
              icon={<Radio className="size-5" />}
              label="Payola"
            />
            <ActionButton
              onClick={() => setModal("leilao")}
              icon={<Gavel className="size-5" />}
              label="Leilão"
            />
            <ActionButton
              onClick={() => setModal("composicao")}
              icon={<Disc3 className="size-5" />}
              label="Vender Comp."
            />
            <ActionButton
              onClick={() => setModal("imovel")}
              icon={<Building2 className="size-5" />}
              label="Comprar Imóvel"
            />
            <ActionButton
              onClick={() => setModal("rescisao")}
              icon={<FileX className="size-5" />}
              label="Rescindir"
            />
            <ProjectsLink nome={artist.nome} />
            <BensLink nome={artist.nome} />
            <MarketLink />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-extrabold">Álbuns</h2>
            <Link
              to="/acoes/album"
              search={{ nome: artist.nome }}
              className="text-xs font-bold text-primary"
            >
              + Lançar
            </Link>
          </div>
          {albuns.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum álbum lançado ainda.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {albuns.map((a) => (
                <Link key={a.id} to="/album/$id" params={{ id: a.id! }} className="group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
                    {a.capa_url && (
                      <img
                        src={driveImg(a.capa_url, 300)}
                        alt={a.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <p className="mt-1 text-xs font-bold truncate">{a.titulo}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {modal === "viral" && <ViralModal nome={artist.nome} onClose={() => setModal(null)} />}
      {modal === "filantropia" && (
        <FilantropiaModal nome={artist.nome} onClose={() => setModal(null)} />
      )}
      {modal === "payola" && <PayolaModal nome={artist.nome} onClose={() => setModal(null)} />}
      {modal === "leilao" && <LeilaoModal nome={artist.nome} onClose={() => setModal(null)} />}
      {modal === "rescisao" && <RescisaoModal nome={artist.nome} onClose={() => setModal(null)} />}
      {modal === "composicao" && (
        <ComposicaoModal nome={artist.nome} onClose={() => setModal(null)} />
      )}
      {modal === "imovel" && <ImovelModal nome={artist.nome} onClose={() => setModal(null)} />}
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  bar,
  barColor,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bar?: number;
  barColor?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl ${accent ? "bg-primary/10 border border-primary/30" : "bg-card"}`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={`text-lg font-black mt-1 truncate ${accent ? "text-primary" : ""}`}>{value}</p>
      {bar !== undefined && (
        <div className="h-1.5 mt-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, bar)}%`,
              backgroundColor: barColor || "var(--primary)",
            }}
          />
        </div>
      )}
    </div>
  );
}

function ActionLink({
  to,
  params,
  icon,
  label,
}: {
  to: string;
  params: { nome: string };
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to as "/acoes/tour"} // cast to one of the possible routes
      search={params}
      className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-secondary transition-colors"
    >
      <div className="size-10 rounded-lg bg-primary/15 text-primary grid place-items-center">
        {icon}
      </div>
      <span className="font-bold text-sm">{label}</span>
    </Link>
  );
}
function ActionButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-secondary transition-colors text-left"
    >
      <div className="size-10 rounded-lg bg-primary/15 text-primary grid place-items-center">
        {icon}
      </div>
      <span className="font-bold text-sm">{label}</span>
    </button>
  );
}
function ProjectsLink({ nome }: { nome: string }) {
  return (
    <Link
      to="/artistas/$nome/projetos"
      params={{ nome }}
      className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-secondary transition-colors"
    >
      <div className="size-10 rounded-lg bg-primary/15 text-primary grid place-items-center">
        <Briefcase className="size-5" />
      </div>
      <span className="font-bold text-sm">Projetos</span>
    </Link>
  );
}
function BensLink({ nome }: { nome: string }) {
  return (
    <Link
      to="/artistas/$nome/bens"
      params={{ nome }}
      className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-secondary transition-colors"
    >
      <div className="size-10 rounded-lg bg-primary/15 text-primary grid place-items-center">
        <Building2 className="size-5" />
      </div>
      <span className="font-bold text-sm">Meus Bens</span>
    </Link>
  );
}
function MarketLink() {
  return (
    <Link
      to="/market"
      className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-secondary transition-colors"
    >
      <div className="size-10 rounded-lg bg-primary/15 text-primary grid place-items-center">
        <ShoppingBag className="size-5" />
      </div>
      <span className="font-bold text-sm">Empire Market</span>
    </Link>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-5 border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-secondary grid place-items-center"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ViralModal({ nome, onClose }: { nome: string; onClose: () => void }) {
  const [musica, setMusica] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function go() {
    if (!musica) return;
    setSubmitting(true);
    const r = await api.viral(nome, musica);
    const { ok } = notify(r, { successFallback: "Boost ativado!" });
    setSubmitting(false);
    if (ok) onClose();
  }
  return (
    <Modal title="Viralizar música" onClose={onClose}>
      <p className="text-xs text-muted-foreground mb-3">
        Coloca uma música pra viralizar. Aumenta visualizações, prestígio e fadiga.
      </p>
      <input
        value={musica}
        onChange={(e) => setMusica(e.target.value)}
        placeholder="Nome exato da música"
        className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm mb-3"
      />
      <button
        onClick={go}
        disabled={submitting || !musica}
        className="w-full py-3 rounded-full bg-primary text-primary-foreground font-extrabold uppercase tracking-wider text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="size-4 animate-spin" />} Confirmar
      </button>
    </Modal>
  );
}

function FilantropiaModal({ nome, onClose }: { nome: string; onClose: () => void }) {
  const [causa, setCausa] = useState("");
  const [valor, setValor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function go() {
    if (!causa || !valor) return;
    setSubmitting(true);
    const r = await api.filantropia(nome, causa, valor);
    const { ok } = notify(r, { successFallback: "Doação enviada!" });
    setSubmitting(false);
    if (ok) onClose();
  }
  return (
    <Modal title="Filantropia" onClose={onClose}>
      <p className="text-xs text-muted-foreground mb-3">
        Doe parte da fortuna por uma causa. Ganha prestígio.
      </p>
      <input
        value={causa}
        onChange={(e) => setCausa(e.target.value)}
        placeholder="Causa (ex: Educação)"
        className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm mb-2"
      />
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Valor em $ (ex: 1000000)"
        className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm mb-3"
      />
      <button
        onClick={go}
        disabled={submitting || !causa || !valor}
        className="w-full py-3 rounded-full bg-primary text-primary-foreground font-extrabold uppercase tracking-wider text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="size-4 animate-spin" />} Doar
      </button>
    </Modal>
  );
}

function inputCls() {
  return "w-full bg-background border border-border rounded-xl px-3 py-3 text-sm mb-2";
}
function btnCls() {
  return "w-full py-3 rounded-full bg-primary text-primary-foreground font-extrabold uppercase tracking-wider text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 mt-2";
}

function PayolaModal({ nome, onClose }: { nome: string; onClose: () => void }) {
  const [musica, setMusica] = useState("");
  const [valor, setValor] = useState("");
  const [s, setS] = useState(false);
  async function go() {
    setS(true);
    const r = await api.payola({ nome, musica, valor: Number(valor) });
    const { ok } = notify(r, { successFallback: "Payola ativada!" });
    setS(false);
    if (ok) onClose();
  }
  return (
    <Modal title="Payola" onClose={onClose}>
      <p className="text-xs text-muted-foreground mb-3">
        Investe em rotação. Regional / Nacional / Global conforme o valor.
      </p>
      <input
        value={musica}
        onChange={(e) => setMusica(e.target.value)}
        placeholder="Nome da música"
        className={inputCls()}
      />
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Valor em $EC"
        className={inputCls()}
        type="number"
      />
      <button onClick={go} disabled={s || !musica || !valor} className={btnCls()}>
        {s && <Loader2 className="size-4 animate-spin" />} Confirmar
      </button>
    </Modal>
  );
}

function LeilaoModal({ nome, onClose }: { nome: string; onClose: () => void }) {
  const [descricao, setDescricao] = useState("");
  const [lance, setLance] = useState("");
  const [s, setS] = useState(false);
  async function go() {
    setS(true);
    const r = await api.publicarLeilao({ nome, descricao, lanceMini: Number(lance) });
    const { ok } = notify(r, { successFallback: "Leilão publicado!" });
    setS(false);
    if (ok) onClose();
  }
  return (
    <Modal title="Publicar Leilão" onClose={onClose}>
      <p className="text-xs text-muted-foreground mb-3">
        Coloca um item ou serviço em leilão por 7 dias.
      </p>
      <input
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="O que está vendendo"
        className={inputCls()}
      />
      <input
        value={lance}
        onChange={(e) => setLance(e.target.value)}
        placeholder="Lance mínimo $EC"
        className={inputCls()}
        type="number"
      />
      <button onClick={go} disabled={s || !descricao || !lance} className={btnCls()}>
        {s && <Loader2 className="size-4 animate-spin" />} Publicar
      </button>
    </Modal>
  );
}

function RescisaoModal({ nome, onClose }: { nome: string; onClose: () => void }) {
  const [destino, setDestino] = useState("Independent");
  const [s, setS] = useState(false);
  async function go() {
    setS(true);
    const r = await api.rescisao({ nome, destino });
    const { ok } = notify(r, { successFallback: "Rescisão processada!" });
    setS(false);
    if (ok) onClose();
  }
  return (
    <Modal title="Rescindir Contrato" onClose={onClose}>
      <p className="text-xs text-muted-foreground mb-3">
        Sai da gravadora atual. Pode haver multa proporcional ao tempo restante.
      </p>
      <input
        value={destino}
        onChange={(e) => setDestino(e.target.value)}
        placeholder="Destino (Independent / nova gravadora)"
        className={inputCls()}
      />
      <button onClick={go} disabled={s || !destino} className={btnCls()}>
        {s && <Loader2 className="size-4 animate-spin" />} Confirmar
      </button>
    </Modal>
  );
}

function ComposicaoModal({ nome, onClose }: { nome: string; onClose: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [preco, setPreco] = useState("");
  const [s, setS] = useState(false);
  async function go() {
    setS(true);
    const r = await api.venderComposicao({ nome, titulo, preco: Number(preco) });
    const { ok } = notify(r, { successFallback: "Publicado no Mural!" });
    setS(false);
    if (ok) onClose();
  }
  return (
    <Modal title="Vender Composição" onClose={onClose}>
      <p className="text-xs text-muted-foreground mb-3">
        Publica uma música autoral no Mural pra outros artistas comprarem.
      </p>
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título da composição"
        className={inputCls()}
      />
      <input
        value={preco}
        onChange={(e) => setPreco(e.target.value)}
        placeholder="Preço $EC"
        className={inputCls()}
        type="number"
      />
      <button onClick={go} disabled={s || !titulo || !preco} className={btnCls()}>
        {s && <Loader2 className="size-4 animate-spin" />} Publicar
      </button>
    </Modal>
  );
}

function ImovelModal({ nome, onClose }: { nome: string; onClose: () => void }) {
  const [tipo, setTipo] = useState("Mansao");
  const [cidade, setCidade] = useState("");
  const [s, setS] = useState(false);
  async function go() {
    setS(true);
    const r = await api.comprarImovel({ nome, tipo, cidade });
    const { ok } = notify(r, { successFallback: "Imóvel adquirido!" });
    setS(false);
    if (ok) onClose();
  }
  return (
    <Modal title="Comprar Imóvel" onClose={onClose}>
      <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls()}>
        <option value="Casa">Casa — $500k</option>
        <option value="Apartamento">Apartamento — $1M</option>
        <option value="Mansao">Mansão — $5M</option>
        <option value="Penthouse">Penthouse — $10M</option>
      </select>
      <input
        value={cidade}
        onChange={(e) => setCidade(e.target.value)}
        placeholder="Cidade"
        className={inputCls()}
      />
      <button onClick={go} disabled={s || !cidade} className={btnCls()}>
        {s && <Loader2 className="size-4 animate-spin" />} Comprar
      </button>
    </Modal>
  );
}

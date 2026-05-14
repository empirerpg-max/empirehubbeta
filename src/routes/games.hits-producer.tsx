import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  Play, 
  Trophy, 
  AlertTriangle, 
  Music, 
  Zap,
  RefreshCw,
  Coins
} from "lucide-react";
import { api } from "@/lib/api";
import { useTelegramUser } from "@/lib/telegram";

export const Route = createFileRoute("/games/hits-producer")({
  component: HitsProducerGame,
});

// -- CONSTANTES DO JOGO --
const LANES = 4;
const HIT_ZONE_Y = 500;
const NOTE_SIZE = 50;
const PERFECT_THRESHOLD = 15;
const GOOD_THRESHOLD = 40;
const MISS_THRESHOLD = 60;
const INITIAL_BPM = 120;
const BPM_INCREASE_INTERVAL = 20000; // 20s

type GameState = "START_SCREEN" | "LOADING" | "PLAYING" | "GAME_OVER" | "VICTORY";

type Note = {
  id: string;
  lane: number;
  y: number;
  speed: number;
  hit: boolean;
};

function HitsProducerGame() {
  const { user } = useTelegramUser();
  const [gameState, setGameState] = useState<GameState>("START_SCREEN");
  const [wager, setWager] = useState(50);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [hype, setHype] = useState(50); // 0-100
  const [syncing, setSyncing] = useState(false);
  const [finalPrize, setFinalPrize] = useState(0);
  const [precisionData, setPrecisionData] = useState({ perfect: 0, good: 0, miss: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const notesRef = useRef<Note[]>([]);
  const lastNoteTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const bpmRef = useRef(INITIAL_BPM);
  const gameActiveRef = useRef(false);

  // -- LOGICA DO JOGO (ENGINE) --

  const spawnNote = () => {
    const lane = Math.floor(Math.random() * LANES);
    const speed = (bpmRef.current / 60) * 2.5; 
    const newNote: Note = {
      id: Math.random().toString(36).substring(7),
      lane,
      y: -NOTE_SIZE,
      speed,
      hit: false
    };
    notesRef.current.push(newNote);
  };

  const update = (time: number) => {
    if (!gameActiveRef.current) return;

    if (!startTimeRef.current) startTimeRef.current = time;
    const elapsed = time - startTimeRef.current;

    // Aumenta BPM a cada 20s
    bpmRef.current = INITIAL_BPM + Math.floor(elapsed / BPM_INCREASE_INTERVAL) * 15;

    // Spawn de notas baseado no BPM
    const spawnInterval = 60000 / bpmRef.current;
    if (time - lastNoteTimeRef.current > spawnInterval) {
      spawnNote();
      lastNoteTimeRef.current = time;
    }

    // Atualiza posições e remove notas perdidas
    notesRef.current.forEach(n => {
      n.y += n.speed;
      
      // Auto-miss se passar da tela
      if (n.y > HIT_ZONE_Y + MISS_THRESHOLD && !n.hit) {
        handleHitResult("MISS", n.id);
      }
    });

    // Final de música (1 minuto de sobrevivência para vitória)
    if (elapsed > 60000) {
      endGame(true);
      return;
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Lanes
    const laneWidth = canvas.width / LANES;
    for (let i = 0; i < LANES; i++) {
       ctx.strokeStyle = "rgba(61, 139, 255, 0.1)";
       ctx.lineWidth = 2;
       ctx.strokeRect(i * laneWidth, 0, laneWidth, canvas.height);
       
       // Hit Zone Base
       ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
       ctx.fillRect(i * laneWidth, HIT_ZONE_Y - 5, laneWidth, 10);
    }

    // Draw Notes
    notesRef.current.forEach(n => {
      if (n.hit) return;
      
      // Neon Style Note
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#D0FF43";
      ctx.fillStyle = "#D0FF43";
      
      // Desenha nota circular style
      ctx.beginPath();
      ctx.arc(n.lane * laneWidth + laneWidth/2, n.y, 20, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
    });
  };

  const handleInput = (lane: number) => {
    if (gameState !== "PLAYING") return;

    // Busca nota mais próxima na lane
    const nearestNote = notesRef.current
      .filter(n => n.lane === lane && !n.hit)
      .sort((a, b) => Math.abs(a.y - HIT_ZONE_Y) - Math.abs(b.y - HIT_ZONE_Y))[0];

    if (!nearestNote) return;

    const diff = Math.abs(nearestNote.y - HIT_ZONE_Y);

    if (diff < PERFECT_THRESHOLD) {
      handleHitResult("PERFECT", nearestNote.id);
    } else if (diff < GOOD_THRESHOLD) {
      handleHitResult("GOOD", nearestNote.id);
    } else if (diff < MISS_THRESHOLD) {
      handleHitResult("MISS", nearestNote.id);
    }
  };

  const handleHitResult = (result: "PERFECT" | "GOOD" | "MISS", noteId: string) => {
    notesRef.current = notesRef.current.filter(n => n.id !== noteId);

    if (result === "PERFECT") {
      setScore(s => s + 100);
      setCombo(c => c + 1);
      setHype(h => Math.min(100, h + 5));
      setPrecisionData(d => ({ ...d, perfect: d.perfect + 1 }));
    } else if (result === "GOOD") {
      setScore(s => s + 50);
      setCombo(c => c + 1);
      setHype(h => Math.min(100, h + 2));
      setPrecisionData(d => ({ ...d, good: d.good + 1 }));
    } else {
      setCombo(0);
      setHype(h => {
        const next = h - 15;
        if (next <= 0) endGame(false);
        return next;
      });
      setPrecisionData(d => ({ ...d, miss: d.miss + 1 }));
    }

    setMaxCombo(m => Math.max(m, combo + 1));
  };

  const startGame = async () => {
    setSyncing(true);
    setGameState("LOADING");
    
    try {
      const tgId = user?.id || "";
      let res = { ok: true };
      
      if (tgId !== "guest") {
        res = await api.syncGameCoins(tgId, wager, 0); 
      }
      
      if (res && res.ok) {
        setGameState("PLAYING");
        setScore(0);
        setCombo(0);
        setMaxCombo(0);
        setHype(50);
        notesRef.current = [];
        bpmRef.current = INITIAL_BPM;
        startTimeRef.current = 0;
        lastNoteTimeRef.current = 0;
        gameActiveRef.current = true;
        setPrecisionData({ perfect: 0, good: 0, miss: 0 });
        requestRef.current = requestAnimationFrame(update);
      } else {
        alert("Saldo insuficiente ou erro ao iniciar! Vincule sua conta para usar EC.");
        setGameState("START_SCREEN");
      }
    } finally {
      setSyncing(false);
    }
  };

  const endGame = (victory: boolean) => {
    gameActiveRef.current = false;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    if (victory) {
      // Calcula prêmio: Wager * (Precisão) * Multiplicador de Combo
      const totalHits = precisionData.perfect + precisionData.good;
      const accuracy = totalHits / (totalHits + precisionData.miss || 1);
      const comboMult = 1 + (maxCombo / 100);
      const won = Math.floor(wager * accuracy * comboMult);
      setFinalPrize(won);
      setGameState("VICTORY");
      syncVictory(won);
    } else {
      setGameState("GAME_OVER");
    }
  };

  const syncVictory = async (amount: number) => {
    setSyncing(true);
    const tgId = user?.id || "";
    if (tgId === "guest") return;
    try {
      await api.syncGameCoins(tgId, 0, amount);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "d" || e.key === "D") handleInput(0);
      if (e.key === "f" || e.key === "F") handleInput(1);
      if (e.key === "j" || e.key === "J") handleInput(2);
      if (e.key === "k" || e.key === "K") handleInput(3);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, combo]); // Combo in deps to ensure handleInput has latest logic

  return (
    <div className="flex-1 bg-black min-h-screen relative overflow-hidden font-sans">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(61,139,255,0.1)_0%,_transparent_80%)]" />
      
      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 p-4 z-50 flex items-center justify-between">
         <Link to="/games" className="size-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-md">
            <ChevronLeft />
         </Link>
         {gameState === "PLAYING" && (
           <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase text-[#D0FF43]">Combo</span>
              <span className="text-2xl font-black text-white italic tracking-tighter">{combo}x</span>
           </div>
         )}
         <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase text-white/40">Score</span>
            <span className="text-xl font-black text-white italic">{score.toLocaleString()}</span>
         </div>
      </div>

      {/* GAME CANVAS */}
      <canvas 
        ref={canvasRef}
        width={400}
        height={600}
        className="mx-auto block h-full w-full max-w-[400px] object-contain pt-16"
        onTouchStart={(e) => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          const touchX = e.touches[0].clientX - rect.left;
          const lane = Math.floor(touchX / (rect.width / LANES));
          handleInput(lane);
        }}
      />

      {/* HUD ELEMENTS - FLOATING */}
      <AnimatePresence>
        {gameState === "PLAYING" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-20 left-4 right-4 z-40 space-y-4"
          >
             {/* Hype Meter */}
             <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-black uppercase text-white px-1">
                   <span>Hype Level</span>
                   <span>{Math.floor(hype)}%</span>
                </div>
                <div className="h-2 bg-white/10 border border-white/20 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: "50%" }}
                    animate={{ width: `${hype}%` }}
                    className={`h-full ${hype > 30 ? 'bg-[#D0FF43]' : 'bg-red-500'} transition-all`}
                   />
                </div>
             </div>

             {/* HUD Controls Info */}
             <div className="grid grid-cols-4 gap-2 opacity-30">
                {['D','F','J','K'].map(key => (
                  <div key={key} className="h-12 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center text-white font-black">{key}</div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAYS */}
      <AnimatePresence>
        {gameState === "START_SCREEN" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
          >
             <div className="absolute top-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest">
                  {user?.id === 'guest' ? "⚠️ MODO DEMO: Ganhos não serão salvos" : "✅ CONECTADO: Lucro disponível"}
                </p>
             </div>

             <Music className="size-16 text-[#D0FF43] mb-6 animate-bounce" />
             <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2">Produtor de <span className="text-primary">Hits</span></h1>
             <p className="text-white/60 text-sm font-medium mb-8 max-w-xs">
                Domine o ritmo e fature alto com os hits do Império.
             </p>

             <div className="w-full max-w-xs space-y-6">
                <div className="space-y-4">
                   <p className="text-[10px] font-black uppercase text-[#D0FF43] tracking-widest">Investimento da Sessão</p>
                   <div className="grid grid-cols-3 gap-3">
                      {[50, 100, 200].map(val => (
                        <button 
                          key={val}
                          onClick={() => setWager(val)}
                          className={`p-4 border-4 rounded-2xl transition-all font-black flex flex-col items-center group shadow-[4px_4px_0px_#000] ${wager === val ? 'bg-[#D0FF43] border-white text-black scale-105' : 'bg-white/5 border-white/20 text-white hover:border-white/40'}`}
                        >
                           <span className="text-[8px] uppercase opacity-60">EC</span>
                           <span className="text-xl">{val}</span>
                        </button>
                      ))}
                   </div>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full py-5 bg-primary text-black rounded-3xl font-black uppercase italic tracking-widest text-lg border-4 border-black shadow-[8px_8px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-3"
                >
                  <Play className="fill-current size-5" /> Começar Sessão
                </button>
             </div>
          </motion.div>
        )}

        {gameState === "LOADING" && (
           <div className="absolute inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center gap-4">
              <RefreshCw className="size-12 text-[#D0FF43] animate-spin" />
              <p className="text-[#D0FF43] font-black uppercase italic tracking-[0.2em] text-xs">Preparando o Beat...</p>
           </div>
        )}

        {gameState === "VICTORY" && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-4 z-[70] bg-[#1a1a1a] border-4 border-[#D0FF43] rounded-[40px] shadow-[0_0_50px_rgba(208,255,67,0.3)] flex flex-col items-center justify-center p-8 text-center"
          >
             <div className="size-24 bg-[#D0FF43] rounded-full flex items-center justify-center text-black mb-6 shadow-[0_0_30px_#D0FF43]">
                <Trophy className="size-12" />
             </div>
             <h2 className="text-4xl font-black italic uppercase text-[#D0FF43] mb-2 tracking-tighter italic leading-none">Hit de Platina!</h2>
             <p className="text-white/60 text-sm font-medium mb-8 italic">Você sobreviveu à sessão de estúdio!</p>

             <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
                <div className="bg-white/5 border border-white/10 p-4 rounded-3xl">
                   <span className="text-[10px] font-black uppercase text-white/40 block mb-1">Max Combo</span>
                   <span className="text-2xl font-black text-white italic">{maxCombo}x</span>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-3xl">
                   <span className="text-[10px] font-black uppercase text-white/40 block mb-1">Precisão</span>
                   <span className="text-2xl font-black text-white italic">
                      {Math.floor(((precisionData.perfect + precisionData.good) / (precisionData.perfect + precisionData.good + precisionData.miss || 1)) * 100)}%
                   </span>
                </div>
             </div>

             <div className="w-full bg-[#D0FF43] text-black p-6 rounded-3xl mb-8 border-4 border-black group">
                <span className="text-[10px] font-black uppercase opacity-60 block">Lucro da Sessão</span>
                <div className="flex items-center justify-center gap-2">
                   <Coins className="size-6" />
                   <span className="text-4xl font-black italic">{finalPrize.toLocaleString()} <span className="text-[14px]">EC</span></span>
                </div>
             </div>

             <button 
               onClick={() => setGameState("START_SCREEN")}
               disabled={syncing}
               className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase italic tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
             >
                {syncing ? "Sincronizando..." : "Nova Sessão"}
             </button>
          </motion.div>
        )}

        {gameState === "GAME_OVER" && (
           <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[70] bg-red-600/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
           >
              <AlertTriangle className="size-20 text-white mb-6 animate-pulse" />
              <h2 className="text-5xl font-black italic uppercase text-white mb-4 tracking-tighter italic">Studio Offline</h2>
              <p className="text-white/80 text-sm font-bold mb-10 max-w-xs">
                 O Hype zerou e a sessão foi abortada. Você perdeu seu investimento de {wager} EC.
              </p>

              <div className="w-full max-w-xs space-y-4">
                 <button 
                   onClick={() => setGameState("START_SCREEN")}
                   className="w-full py-5 bg-white text-red-600 rounded-2xl font-black uppercase italic tracking-widest shadow-xl active:scale-95 transition-all"
                 >
                    Tentar Novamente
                 </button>
                 <Link 
                   to="/games"
                   className="w-full py-5 bg-black/20 text-white rounded-2xl font-black uppercase italic tracking-widest flex items-center justify-center border-2 border-white/20 active:scale-95 transition-all"
                 >
                    Voltar ao Centro
                 </Link>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* HIT EFFECT UI */}
      {gameState === "PLAYING" && (
        <div className="absolute inset-0 pointer-events-none z-30">
           {/* Visual cues or flash on hit can go here */}
        </div>
      )}
    </div>
  );
}

export default HitsProducerGame;

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  Play, 
  Camera, 
  TrendingUp, 
  History,
  AlertOctagon,
  Coins,
  ArrowUp
} from "lucide-react";
import { api } from "@/lib/api";
import { useTelegramUser } from "@/lib/telegram";

export const Route = createFileRoute("/games/paparazzi-escape")({
  component: PaparazziEscapeGame,
});

// -- GAME CONSTANTS --
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const GROUND_Y = 320;
const PLAYER_X = 50;
const OBSTACLE_SPAWN_CHANCE = 0.015;

type GameState = "MENU" | "PREPARING" | "RUNNING" | "CRASHED" | "BANKED";

interface Player {
  y: number;
  dy: number;
  isJumping: boolean;
  width: number;
  height: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  passed: boolean;
}

function PaparazziEscapeGame() {
  const { user } = useTelegramUser();
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [wager, setWager] = useState(100);
  const [multiplier, setMultiplier] = useState(1.0);
  const [distance, setDistance] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [wonAmount, setWonAmount] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const playerRef = useRef<Player>({ y: GROUND_Y, dy: 0, isJumping: false, width: 40, height: 60 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const crashPointRef = useRef<number>(0);
  const gameActiveRef = useRef(false);

  // -- ENGINE LOGIC --

  const initGame = useCallback(() => {
    // Definimos o ponto de crash aleatório (multiplicador)
    // Curva de risco: 99% das vezes entre 1.1 e 10.0, média 2.0
    const rand = Math.random();
    crashPointRef.current = 1 / (1 - rand);
    if (rand > 0.95) crashPointRef.current = 1 + Math.random() * 20; // Raras vezes voa alto
    
    setMultiplier(1.0);
    setDistance(0);
    obstaclesRef.current = [];
    playerRef.current = { y: GROUND_Y, dy: 0, isJumping: false, width: 30, height: 50 };
  }, []);

  const handleJump = useCallback(() => {
    if (!gameActiveRef.current || playerRef.current.isJumping) return;
    playerRef.current.dy = JUMP_FORCE;
    playerRef.current.isJumping = true;
  }, []);

  const update = useCallback((time: number) => {
    if (!gameActiveRef.current) return;

    // Multiplier calculation (distance-based)
    setDistance(d => d + 1);
    const newMult = 1 + (distance / 500);
    setMultiplier(parseFloat(newMult.toFixed(2)));

    // Crash Check
    if (newMult >= crashPointRef.current) {
      endGame("CRASHED");
      return;
    }

    // Player Physics
    const p = playerRef.current;
    p.y += p.dy;
    p.dy += GRAVITY;

    if (p.y > GROUND_Y) {
      p.y = GROUND_Y;
      p.dy = 0;
      p.isJumping = false;
    }

    // Obstacles
    if (Math.random() < OBSTACLE_SPAWN_CHANCE) {
      obstaclesRef.current.push({
        x: 500,
        y: GROUND_Y + 10,
        width: 30,
        height: 40,
        passed: false
      });
    }

    obstaclesRef.current.forEach((obs, idx) => {
      obs.x -= 5 + (newMult * 0.5); // Speed increases with multiplier

      // Collision AABB
      if (
        PLAYER_X < obs.x + obs.width &&
        PLAYER_X + p.width > obs.x &&
        p.y < obs.y + obs.height &&
        p.y + p.height > obs.y
      ) {
        endGame("CRASHED");
      }
    });

    // Cleanup
    if (obstaclesRef.current.length > 5 && obstaclesRef.current[0].x < -50) {
      obstaclesRef.current.shift();
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [distance]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gridline floors
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 60);
    ctx.lineTo(canvas.width, GROUND_Y + 60);
    ctx.stroke();

    // PLAYER - Streetwear Artist Style
    ctx.fillStyle = "#000";
    ctx.fillRect(PLAYER_X, playerRef.current.y, playerRef.current.width, playerRef.current.height);
    // Head with beanie
    ctx.fillStyle = "#FF3D3D";
    ctx.fillRect(PLAYER_X + 5, playerRef.current.y - 10, 20, 10);

    // OBSTACLES - Paparazzi Cameras
    obstaclesRef.current.forEach(obs => {
      ctx.fillStyle = "#333";
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      // Flash lens
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(obs.x + 15, obs.y + 15, 8, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const startGame = async () => {
    const tgId = user?.id || "";
    setIsSyncing(true);
    setGameState("PREPARING");
    try {
      let res = { ok: true };
      if (tgId !== "guest") {
        res = await api.syncGameCoins(tgId, wager, 0);
      }
      
      if (res && res.ok) {
        initGame();
        setGameState("RUNNING");
        gameActiveRef.current = true;
        requestRef.current = requestAnimationFrame(update);
      } else {
        alert("Saldo de Empire Coins insuficiente! Vincule sua conta para usar EC.");
        setGameState("MENU");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const bankOut = async () => {
    if (gameState !== "RUNNING") return;
    gameActiveRef.current = false;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    const won = Math.floor(wager * multiplier);
    setWonAmount(won);
    setGameState("BANKED");
    
    const tgId = user?.id || "";
    if (tgId === "guest") return;
    
    setIsSyncing(true);
    try {
      await api.syncGameCoins(tgId, 0, won);
    } finally {
      setIsSyncing(false);
    }
  };

  const endGame = (reason: "CRASHED" | "BANKED") => {
    gameActiveRef.current = false;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setGameState(reason);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [handleJump]);

  return (
    <div className="flex-1 bg-white min-h-screen relative overflow-hidden flex flex-col font-sans">
      {/* HEADER HUD */}
      <div className="p-6 flex items-center justify-between z-50">
         <Link to="/games" className="size-10 bg-white border-2 border-black rounded-xl flex items-center justify-center text-black shadow-[3px_3px_0px_#000] active:scale-95 transition-all">
            <ChevronLeft />
         </Link>
         
         {gameState === "RUNNING" && (
           <motion.div 
             initial={{ scale: 0.9 }}
             animate={{ scale: [1, 1.05, 1] }}
             transition={{ repeat: Infinity, duration: 1 }}
             className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-full font-black text-xl italic"
           >
              <TrendingUp className="size-5 text-emerald-400" />
              {multiplier.toFixed(2)}x
           </motion.div>
         )}
         
         <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase text-black/40">Sessão</span>
            <span className="text-sm font-black text-black italic">#{user?.id?.slice(-4)}</span>
         </div>
      </div>

      {/* STAGE AREA */}
      <main className="flex-1 relative flex items-center justify-center pointer-events-none">
         <canvas 
          ref={canvasRef}
          width={500}
          height={400}
          className="w-full h-96 object-contain"
         />
         
         {/* Parallax Background Layers */}
         <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.02))] -z-10" />
      </main>

      {/* OVERLAYS & UI */}
      <AnimatePresence>
        {gameState === "MENU" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
          >
             <Camera className="size-16 text-black mb-6 animate-pulse" />
             <h1 className="text-4xl font-black italic uppercase tracking-tighter text-black mb-2 leading-none">Fuga do <span className="text-primary italic">Paparazzi</span></h1>
             <p className="text-black/60 text-sm font-medium mb-12 max-w-xs">
                Corra das câmeras e multiplique sua aposta. O risco é seu, a escolha de quando parar também!
             </p>

             <div className="w-full max-w-xs space-y-6">
                <div className="grid grid-cols-3 gap-2">
                   {[100, 500, 1000].map(v => (
                     <button 
                      key={v}
                      onClick={() => setWager(v)}
                      className={`py-4 rounded-2xl font-black transition-all border-2 ${wager === v ? 'bg-black text-white border-black scale-105 shadow-xl' : 'bg-white border-black/10 text-black/40 hover:border-black'}`}
                     >
                        {v} EC
                     </button>
                   ))}
                </div>

                <button 
                  onClick={startGame}
                  disabled={isSyncing}
                  className="w-full py-6 bg-primary text-black rounded-3xl font-black uppercase italic tracking-[0.2em] text-lg border-2 border-black shadow-[6px_6px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                >
                   {isSyncing ? "Preparando..." : "Correr!"}
                </button>
             </div>
          </motion.div>
        )}

        {gameState === "CRASHED" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 bg-red-600 flex flex-col items-center justify-center p-8 text-center"
          >
             <div className="size-24 bg-white rounded-full grid place-items-center mb-6 shadow-2xl animate-bounce">
                <AlertOctagon className="size-12 text-red-600" />
             </div>
             <h2 className="text-6xl font-black italic uppercase text-white mb-2 italic -skew-x-12">FLASHED!</h2>
             <p className="text-white/80 font-black uppercase text-xs tracking-widest mb-10">Você foi pego no flagra.</p>
             
             <div className="w-full max-w-xs space-y-3">
                <button 
                  onClick={() => setGameState("MENU")}
                  className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase italic tracking-widest active:scale-95 transition-all"
                >
                   Recomeçar
                </button>
                <Link to="/games" className="w-full py-5 bg-white/10 text-white rounded-2xl font-black uppercase italic tracking-widest border border-white/20">
                   Sair
                </Link>
             </div>
          </motion.div>
        )}

        {gameState === "BANKED" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 bg-primary flex flex-col items-center justify-center p-8 text-center"
          >
             <div className="size-24 bg-black rounded-full grid place-items-center mb-6 shadow-2xl">
                <History className="size-12 text-primary" />
             </div>
             <h2 className="text-5xl font-black italic uppercase text-black mb-2 tracking-tighter">BANKED OUT!</h2>
             <p className="text-black/60 font-black uppercase text-xs tracking-widest mb-8">Lucro garantido com sucesso.</p>

             <div className="w-full max-w-sm p-8 bg-black/5 rounded-[40px] mb-10">
                <span className="text-[10px] font-black uppercase text-black/40 block mb-2 tracking-widest">Seu Prêmio</span>
                <div className="flex items-center justify-center gap-2">
                   <Coins className="size-6" />
                   <span className="text-5xl font-black italic text-black">{wonAmount.toLocaleString()} <span className="text-sm">EC</span></span>
                </div>
             </div>
             
             <button 
               onClick={() => setGameState("MENU")}
               className="w-full max-w-xs py-5 bg-black text-white rounded-2xl font-black uppercase italic tracking-widest active:scale-95 transition-all"
             >
                Jogar Novamente
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GAMEPLAY CONTROLS */}
      {gameState === "RUNNING" && (
        <div className="p-6 pb-12 flex flex-col gap-4 z-40 bg-white/50 backdrop-blur-sm border-t-2 border-black/5">
           <div className="flex justify-between items-center px-2">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase text-black/40 italic">Aposta</span>
                 <span className="text-lg font-black text-black">{wager} EC</span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[10px] font-black uppercase text-black/40 italic">Possível Retorno</span>
                 <span className="text-lg font-black text-emerald-600">{(wager * multiplier).toFixed(0)} EC</span>
              </div>
           </div>

           <div className="flex gap-4">
              <button 
                onMouseDown={handleJump}
                onTouchStart={handleJump}
                className="flex-1 py-8 bg-white border-4 border-black rounded-3xl flex items-center justify-center shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
              >
                 <ArrowUp className="size-8" />
              </button>
              <button 
                onClick={bankOut}
                disabled={isSyncing}
                className="flex-[2] py-8 bg-emerald-500 text-white border-4 border-black rounded-3xl font-black uppercase italic text-2xl tracking-widest shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
              >
                {isSyncing ? "..." : "BANK OUT"}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

export default PaparazziEscapeGame;

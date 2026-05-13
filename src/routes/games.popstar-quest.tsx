import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Loader2,
  Trophy,
  Heart,
  Music,
  Gamepad2,
  Mic2,
  RotateCcw,
  Star,
} from "lucide-react";
import { useTelegramUser } from "@/lib/telegram";
import { api, driveImg, type Artist } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";

export const Route = createFileRoute("/games/popstar-quest")({
  component: PopStarQuest,
});

// --- CONSTANTS ---
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const TILE_SIZE = 32;
const GRAVITY = 0.5;
const JUMP_FORCE = -10;
const WALK_SPEED = 4;

enum GameState {
  LOADING = "loading",
  SELECT_ARTIST = "select_artist",
  WORLD_MAP = "world_map",
  PLAYING = "playing",
  DIALOGUE = "dialogue",
  GAME_OVER = "game_over",
  VICTORY = "victory",
}

// --- WORLD DATA ---
const WORLDS = [
  { id: 1, name: "Bubbling Under", color: "#666", textColor: "#fff" },
  { id: 2, name: "Social Hurricane", color: "#4ade80", textColor: "#000" },
  { id: 3, name: "The Big Tour", color: "#a855f7", textColor: "#fff" },
  { id: 4, name: "Top 100 Olympus", color: "#facc15", textColor: "#000" },
];

// --- TYPES ---
interface Entity {
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  dir?: number;
  hp?: number;
  state?: number;
  vx?: number;
  vy?: number;
}

interface Player extends Entity {
  vx: number;
  vy: number;
  grounded: boolean;
  hasMic: boolean;
  invuln: number;
  facing: number;
  shootCooldown: number;
  flashTime: number;
}

interface Bullet extends Entity {
  vx: number;
  vy: number;
}

// --- COMPONENT ---
function PopStarQuest() {
  const { user, ready } = useTelegramUser();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [currentWorld, setCurrentWorld] = useState(1);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [chartPos, setChartPos] = useState(100);

  // Game Engine Refs
  const stateRef = useRef<GameState>(GameState.LOADING);
  const gameRef = useRef<{
    loop: number | null;
    player: Player | null;
    platforms: Entity[];
    enemies: Entity[];
    items: Entity[];
    bullets: Bullet[];
    camera: { x: number; y: number };
    keys: Record<string, boolean>;
    levelWidth: number;
  }>({
    loop: null,
    player: null,
    platforms: [],
    enemies: [],
    items: [],
    bullets: [],
    camera: { x: 0, y: 0 },
    keys: {},
    levelWidth: 0,
  });

  const artistHeadImg = useRef<HTMLImageElement | null>(null);

  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // 1. Initial Load
  useEffect(() => {
    const timer = setTimeout(() => setLoadingTimeout(true), 5000);
    if (!ready || !user) return;

    setGameState(GameState.LOADING);
    stateRef.current = GameState.LOADING;

    api
      .meusArtistas(user.id)
      .then((data) => {
        clearTimeout(timer);
        if (data.length > 0) {
          setArtists(data);
          setSelectedArtist(data[0]);
          setGameState(GameState.WORLD_MAP);
        } else {
          // Se não tem artistas (novato ou guest), oferece artistas padrão pro jogo
          const defaults: Artist[] = [
            {
              nome: "Star Kid",
              foto: "1_RjUvXzN_B_K7fWHz6G-Uo8JzLXf0y9z", // ID de exemplo ou placeholder
              status: "Livre",
              saldo: 0,
              gravadora: "Independent",
              fortuna_total: 0,
              fortuna_real: 0,
              fortuna_bens: 0,
              vendas_total: 0,
              seguidores: 1000,
              prestigio: 10,
              fadiga: 0,
            },
            {
              nome: "Pop Queen",
              foto: "1_RjUvXzN_B_K7fWHz6G-Uo8JzLXf0y9z",
              status: "Livre",
              saldo: 0,
              gravadora: "Independent",
              fortuna_total: 0,
              fortuna_real: 0,
              fortuna_bens: 0,
              vendas_total: 0,
              seguidores: 5000,
              prestigio: 20,
              fadiga: 0,
            },
          ];
          setArtists(defaults);
          setGameState(GameState.SELECT_ARTIST);
        }
      })
      .catch((err) => {
        clearTimeout(timer);
        console.error("Erro ao carregar artistas:", err);
        // Fallback para seleção de artista mesmo com erro na API
        setGameState(GameState.SELECT_ARTIST);
      });
  }, [ready, user]);

  // 2. Preload Artist Head
  useEffect(() => {
    if (selectedArtist) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = driveImg(selectedArtist.foto, 100);
      img.onload = () => {
        artistHeadImg.current = img;
      };
    }
  }, [selectedArtist]);

  // 3. Game Loop & Logic
  const startLevel = (worldId: number) => {
    stateRef.current = GameState.PLAYING;
    setGameState(GameState.PLAYING);
    setCurrentWorld(worldId);
    setChartPos(100 - (worldId - 1) * 20);

    // Reset engine
    gameRef.current.platforms = [];
    gameRef.current.enemies = [];
    gameRef.current.items = [];
    gameRef.current.bullets = [];
    gameRef.current.camera = { x: 0, y: 0 };

    // Generate Level (Procedural)
    generateLevel(worldId);

    // Start loop
    if (gameRef.current.loop) cancelAnimationFrame(gameRef.current.loop);
    gameRef.current.loop = requestAnimationFrame(gameLoop);
  };

  const generateLevel = (worldId: number) => {
    const world = WORLDS.find((w) => w.id === worldId) || WORLDS[0];
    const segments = 15; // length of level in segments
    const segmentWidth = 10 * TILE_SIZE;
    gameRef.current.levelWidth = segments * segmentWidth;

    // Clear everything first
    gameRef.current.platforms = [];
    gameRef.current.enemies = [];
    gameRef.current.items = [];
    gameRef.current.bullets = [];

    // Start platform
    addPlatform(0, CANVAS_HEIGHT - TILE_SIZE * 2, segmentWidth, TILE_SIZE * 4, "ground");

    let currentX = segmentWidth;
    for (let i = 1; i < segments - 1; i++) {
      const gap = Math.random() < 0.2 ? Math.random() * 100 + 50 : 0;
      currentX += gap;

      const pWidth = Math.random() * 200 + 100;
      const pHeight = Math.random() * 150 + 50;
      const pY = CANVAS_HEIGHT - (Math.random() * 100 + 100);

      addPlatform(currentX, pY, pWidth, pHeight, "ground");

      // Floating platforms
      if (Math.random() > 0.5) {
        addPlatform(currentX + 50, pY - 100, 60, 20, "float");
      }

      // Add Coins and Vinyls
      for (let j = 0; j < 3; j++) {
        if (Math.random() > 0.3) {
          gameRef.current.items.push({
            x: currentX + 20 + j * 30,
            y: pY - 40,
            w: 16,
            h: 16,
            type: Math.random() > 0.9 ? "vinyl" : "coin",
          });
        }
      }

      // Add Enmies
      if (Math.random() > 0.4) {
        gameRef.current.enemies.push({
          x: currentX + 50,
          y: pY - 40,
          w: 32,
          h: 40,
          type: i % 2 === 0 ? "critic" : "paparazzi",
          dir: -1,
          hp: 1,
          state: 0,
        });
      }

      // Golden Mic Powerup
      if (i === 5) {
        gameRef.current.items.push({
          x: currentX + 10,
          y: pY - 60,
          w: 24,
          h: 24,
          type: "powerup",
        });
      }

      currentX += pWidth;
    }

    // End Goal
    addPlatform(currentX + 50, CANVAS_HEIGHT - TILE_SIZE * 3, 200, TILE_SIZE * 4, "goal");
    gameRef.current.items.push({
      x: currentX + 100,
      y: CANVAS_HEIGHT - TILE_SIZE * 3 - 64,
      w: 64,
      h: 64,
      type: "trophy",
    });

    // Player
    gameRef.current.player = {
      x: 100,
      y: CANVAS_HEIGHT - 200,
      vx: 0,
      vy: 0,
      w: 32,
      h: 48,
      grounded: false,
      hasMic: false,
      invuln: 0,
      facing: 1,
    };
  };

  const addPlatform = (x: number, y: number, w: number, h: number, type: string) => {
    gameRef.current.platforms.push({ x, y, w, h, type });
  };

  const gameLoop = () => {
    if (stateRef.current !== GameState.PLAYING) return;

    try {
      update();
      draw();
      if (stateRef.current === GameState.PLAYING) {
        gameRef.current.loop = requestAnimationFrame(gameLoop);
      }
    } catch (err) {
      console.error("ERRO CRITICAL NO LOOP:", err);
      stateRef.current = GameState.GAME_OVER;
      setGameState(GameState.GAME_OVER);
    }
  };

  const update = () => {
    const { player, platforms, enemies, items, bullets, keys, camera, levelWidth } =
      gameRef.current;
    if (!player) return;

    // Movement
    if (keys["ArrowLeft"] || keys["a"]) {
      player.vx = -WALK_SPEED;
      player.facing = -1;
    } else if (keys["ArrowRight"] || keys["d"]) {
      player.vx = WALK_SPEED;
      player.facing = 1;
    } else {
      player.vx *= 0.8;
      if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }

    if ((keys["ArrowUp"] || keys["w"] || keys[" "]) && player.grounded) {
      player.vy = JUMP_FORCE;
      player.grounded = false;
    }

    // Attack
    if (keys["z"] && player.hasMic && player.shootCooldown === 0) {
      bullets.push({ x: player.x, y: player.y + 10, vx: player.facing * 7, vy: 0, w: 10, h: 10 });
      player.shootCooldown = 20;
    }
    if (player.shootCooldown > 0) player.shootCooldown--;

    // Physics
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    // Collisions with platforms
    player.grounded = false;
    for (const p of platforms) {
      if (rectIntersect(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)) {
        // Find overlap depth
        const overlapX = Math.min(player.x + player.w - p.x, p.x + p.w - player.x);
        const overlapY = Math.min(player.y + player.h - p.y, p.y + p.h - player.y);

        if (overlapY < overlapX) {
          // Vertical collision
          if (player.y < p.y) {
            // Top collision (landing)
            player.y = p.y - player.h;
            player.vy = 0;
            player.grounded = true;
          } else {
            // Bottom collision (hitting head)
            player.y = p.y + p.h;
            player.vy = 0;
          }
        } else {
          // Horizontal collision
          if (player.x < p.x) {
            player.x = p.x - player.w;
          } else {
            player.x = p.x + p.w;
          }
          player.vx = 0;
        }
      }
    }

    // Bound level
    if (player.x < 0) player.x = 0;
    if (player.y > CANVAS_HEIGHT + 100) handleDeath();

    // Camera
    camera.x = player.x - CANVAS_WIDTH / 2;
    if (camera.x < 0) camera.x = 0;
    if (camera.x > levelWidth - CANVAS_WIDTH) camera.x = levelWidth - CANVAS_WIDTH;

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.x += e.dir * 1.5;

      // Flip at edges of current platform
      let onGround = false;
      for (const p of platforms) {
        if (rectIntersect(e.x, e.y + e.h, e.w, 1, p.x, p.y, p.w, p.h)) {
          onGround = true;
          break;
        }
      }
      if (!onGround) e.dir *= -1;

      // Paparazzi logic (flash)
      if (e.type === "paparazzi") {
        e.state++;
        if (e.state > 120) {
          if (Math.abs(player.x - e.x) < 200) {
            // Flash player
            player.flashTime = 30;
          }
          e.state = 0;
        }
      }

      // Hit player
      if (rectIntersect(player.x, player.y, player.w, player.h, e.x, e.y, e.w, e.h)) {
        if (player.vy > 1 && player.y + player.h < e.y + 20) {
          // Kill enemy
          enemies.splice(i, 1);
          player.vy = -6;
          setScore((s) => s + 200);
        } else if (player.invuln <= 0) {
          handleHit();
        }
      }

      // Hit by bullet
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (rectIntersect(b.x, b.y, b.w, b.h, e.x, e.y, e.w, e.h)) {
          enemies.splice(i, 1);
          bullets.splice(j, 1);
          setScore((s) => s + 200);
          break;
        }
      }
    }

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].x += bullets[i].vx;
      if (Math.abs(bullets[i].x - player.x) > CANVAS_WIDTH) bullets.splice(i, 1);
    }

    // Items
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (rectIntersect(player.x, player.y, player.w, player.h, item.x, item.y, item.w, item.h)) {
        if (item.type === "coin") {
          setCoins((c) => c + 1);
          setScore((s) => s + 100);
        } else if (item.type === "vinyl") {
          setScore((s) => s + 500);
          setCoins((c) => c + 5);
        } else if (item.type === "powerup") {
          player.hasMic = true;
        } else if (item.type === "trophy") {
          stateRef.current = GameState.VICTORY;
          setGameState(GameState.VICTORY);
        }
        items.splice(i, 1);
      }
    }

    if (player.invuln > 0) player.invuln--;
    if (player.flashTime > 0) player.flashTime--;
  };

  const handleDeath = () => {
    if (!gameRef.current.player) return;

    setLives((l) => {
      const newLives = l - 1;
      if (newLives <= 0) {
        stateRef.current = GameState.GAME_OVER;
        setGameState(GameState.GAME_OVER);
        return 0;
      }
      // Restart level or checkpoint (simplified)
      if (gameRef.current.player) {
        gameRef.current.player.x = 100;
        gameRef.current.player.y = 0;
        gameRef.current.player.vy = 0;
        gameRef.current.player.vx = 0;
        gameRef.current.player.invuln = 60;
      }
      return newLives;
    });
  };

  const handleHit = () => {
    if (!gameRef.current.player) return;
    if (gameRef.current.player.invuln > 0) return;

    gameRef.current.player.invuln = 60;
    setLives((l) => {
      const newLives = l - 1;
      if (newLives <= 0) {
        stateRef.current = GameState.GAME_OVER;
        setGameState(GameState.GAME_OVER);
        return 0;
      }
      return newLives;
    });
  };

  const draw = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const { camera, player, platforms, enemies, items, bullets } = gameRef.current;

    // Fundo
    const worldColor = WORLDS.find((w) => w.id === currentWorld)?.color || "#000";
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Platforms
    platforms.forEach((p) => {
      // 3D Block Style
      ctx.fillStyle = worldColor;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = "#fff2";
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      // Top Highlight
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(p.x, p.y, p.w, 4);
    });

    // Items
    items.forEach((it) => {
      if (it.type === "coin") {
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(it.x + 8, it.y + 8, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.stroke();
      } else if (it.type === "vinyl") {
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(it.x + 8, it.y + 8, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.stroke();
        // Inner circle
        ctx.fillStyle = "#e11d48";
        ctx.beginPath();
        ctx.arc(it.x + 8, it.y + 8, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (it.type === "powerup") {
        ctx.fillStyle = "#facc15";
        ctx.fillRect(it.x, it.y, it.w, it.h);
        ctx.fillStyle = "#000";
        ctx.font = "12px Press Start 2P";
        ctx.fillText("🎤", it.x + 2, it.y + 16);
      } else if (it.type === "trophy") {
        ctx.font = "40px serif";
        ctx.fillText("🏆", it.x, it.y + 50);
      }
    });

    // Enemies
    enemies.forEach((e) => {
      ctx.fillStyle = e.type === "critic" ? "#fff" : "#3b82f6";
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.fillStyle = "#000";
      ctx.fillRect(e.x + (e.dir > 0 ? 20 : 4), e.y + 8, 8, 8);
      if (e.type === "paparazzi" && e.state > 100) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(e.x + 16, e.y + 16, 40, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Bullets
    ctx.fillStyle = "#f4f4f5";
    bullets.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x + 5, b.y + 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "10px sans-serif";
      ctx.fillText("♪", b.x, b.y);
    });

    // Player
    if (player && player.invuln % 5 === 0) {
      // Body
      ctx.fillStyle = "#e11d48";
      ctx.fillRect(player.x, player.y + 16, player.w, player.h - 16);

      // Dynamic Head
      if (artistHeadImg.current) {
        ctx.drawImage(artistHeadImg.current, player.x - 4, player.y - 4, player.w + 8, 32);
      } else {
        ctx.fillStyle = "#fca5a5";
        ctx.fillRect(player.x, player.y, player.w, 24);
      }

      // Mic Power
      if (player.hasMic) {
        ctx.fillStyle = "#facc15";
        ctx.fillRect(player.x + (player.facing > 0 ? 24 : -4), player.y + 20, 8, 12);
      }
    }

    ctx.restore();

    // Flash Screen Effect
    if (player?.flashTime > 0) {
      ctx.fillStyle = `rgba(255,255,255,${player.flashTime / 30})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  };

  const rectIntersect = (
    x1: number,
    y1: number,
    w1: number,
    h1: number,
    x2: number,
    y2: number,
    w2: number,
    h2: number,
  ) => {
    return x1 + w1 > x2 && x1 < x2 + w2 && y1 + h1 > y2 && y1 < y2 + h2;
  };

  // 4. Input Controls & Cleanup
  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      gameRef.current.keys[e.key] = true;
    };
    const handleUp = (e: KeyboardEvent) => {
      gameRef.current.keys[e.key] = false;
    };
    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    const currentGameRef = gameRef.current;
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
      if (currentGameRef.loop) cancelAnimationFrame(currentGameRef.loop);
      stateRef.current = GameState.LOADING;
    };
  }, []);

  // --- RENDERING ---

  if (gameState === GameState.LOADING) {
    return (
      <main className="flex-1 grid place-items-center bg-[#0a0a0a] text-white">
        <div className="text-center">
          <Loader2 className="size-12 animate-spin text-primary mx-auto mb-4" />
          <p className="font-arcade text-[10px] tracking-widest text-primary">LOADING ASSETS...</p>
          {loadingTimeout && (
            <div className="mt-8">
              <button
                onClick={() => setGameState(GameState.SELECT_ARTIST)}
                className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 font-arcade text-[10px] text-white/50 hover:text-white"
              >
                PULAR CARREGAMENTO
              </button>
              <p className="text-[8px] text-muted-foreground mt-4 max-w-xs mx-auto">
                Se o jogo não carregar em 5 segundos, você pode forçar o início.
              </p>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (gameState === GameState.SELECT_ARTIST) {
    return (
      <main className="flex-1 p-6 bg-[#111] text-white">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-arcade text-lg text-primary">SELECT YOUR STAR</h1>
          <div className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[8px] font-mono opacity-50">
            ID: {user?.id}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {artists.map((a) => (
            <button
              key={a.nome}
              onClick={() => {
                setSelectedArtist(a);
                setGameState(GameState.WORLD_MAP);
              }}
              className="p-4 rounded-2xl bg-card border border-border text-center group active:scale-95"
            >
              <img
                src={driveImg(a.foto, 300)}
                className="size-24 rounded-full mx-auto mb-2 border-2 border-primary"
                alt=""
              />
              <p className="font-arcade text-[8px] truncate">{a.nome}</p>
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-[#050505] text-white overflow-hidden">
      {/* UI TopBar */}
      <div className="h-14 border-bottom border-white/10 flex items-center justify-between px-4 shrink-0 bg-black/50 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="font-arcade text-[8px] text-muted-foreground mb-1 uppercase">
              Score
            </span>
            <span className="font-arcade text-[10px]">{score.toString().padStart(6, "0")}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-arcade text-[8px] text-muted-foreground mb-1 uppercase">
              Coins
            </span>
            <span className="font-arcade text-[10px]">{coins.toString().padStart(3, "0")}</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="font-arcade text-[8px] text-primary mb-1 uppercase">Chart Position</span>
          <span className="font-arcade text-sm italic">#{chartPos}</span>
        </div>

        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              className={`size-4 ${i < lives ? "text-red-500 fill-red-500" : "text-white/20"}`}
            />
          ))}
        </div>
      </div>

      {/* GAME CANVAS AREA */}
      <div className="flex-1 relative bg-black grid place-items-center p-2">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="bg-black shadow-2xl border-4 border-white/10 w-full max-w-[640px] h-auto aspect-[4/3] rounded-lg"
          style={{ imageRendering: "pixelated" }}
        />

        {/* Overlay Menu */}
        <AnimatePresence>
          {gameState === GameState.WORLD_MAP && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#000d] z-20 overflow-y-auto"
            >
              <div className="p-8 max-w-lg mx-auto">
                <h2 className="font-arcade text-xl mb-12 text-center tracking-tighter italic">
                  World Map
                </h2>
                <div className="space-y-4">
                  {WORLDS.map((w, i) => (
                    <div key={w.id} className="relative">
                      <button
                        onClick={() => startLevel(w.id)}
                        disabled={w.id > currentWorld + 1}
                        className={`w-full p-6 rounded-3xl flex items-center justify-between transition-all group ${w.id <= currentWorld ? "bg-white/10" : "opacity-30"}`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="size-10 rounded-xl grid place-items-center font-arcade border"
                            style={{ borderColor: w.color, color: w.color }}
                          >
                            {w.id}
                          </div>
                          <div>
                            <p className="font-arcade text-[10px] text-white uppercase">{w.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 tracking-widest uppercase">
                              Chart Target: #{100 - (w.id - 1) * 25}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 group-hover:translate-x-1 transition-transform">
                          <Star
                            className={`size-4 ${w.id < currentWorld ? "text-yellow-500 fill-yellow-500" : "text-white/20"}`}
                          />
                          <Star
                            className={`size-4 ${w.id < currentWorld ? "text-yellow-500 fill-yellow-500" : "text-white/20"}`}
                          />
                          <Star
                            className={`size-4 ${w.id < currentWorld ? "text-yellow-500 fill-yellow-500" : "text-white/20"}`}
                          />
                        </div>
                      </button>
                      {i < WORLDS.length - 1 && (
                        <div className="h-4 w-0.5 bg-white/20 mx-auto my-1 border-dotted border-l-2" />
                      )}
                    </div>
                  ))}
                </div>

                <GameFooter selectedArtist={selectedArtist} />
              </div>
            </motion.div>
          )}

          {gameState === GameState.GAME_OVER && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 bg-red-950/80 backdrop-blur z-30 grid place-items-center p-8 text-center"
            >
              <div>
                <h2 className="font-arcade text-4xl mb-4 italic tracking-tighter text-white">
                  WASTED
                </h2>
                <p className="font-arcade text-[10px] text-red-300 mb-8 uppercase tracking-widest">
                  Sua carreira estagnou no #{chartPos}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setLives(3);
                      setGameState(GameState.WORLD_MAP);
                    }}
                    className="p-4 rounded-xl bg-white text-black font-arcade text-[10px] uppercase flex items-center gap-2"
                  >
                    <RotateCcw className="size-4" /> RESTART
                  </button>
                  <Link
                    to="/games"
                    className="p-4 rounded-xl bg-red-800 text-white font-arcade text-[10px] uppercase flex items-center gap-2"
                  >
                    <ChevronLeft className="size-4" /> QUIT
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === GameState.VICTORY && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 bg-yellow-950/80 backdrop-blur z-30 grid place-items-center p-8 text-center"
            >
              <div>
                <Trophy className="size-20 text-yellow-400 mx-auto mb-6 drop-shadow-glow animate-bounce" />
                <h2 className="font-arcade text-4xl mb-4 italic tracking-tighter text-white">
                  CHART TOPPER!
                </h2>
                <p className="font-arcade text-[10px] text-yellow-300 mb-8 uppercase tracking-widest">
                  Você alcançou o #{chartPos}!
                </p>

                <div className="bg-white/10 p-4 rounded-2xl mb-8 border border-yellow-500/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-arcade uppercase text-muted-foreground">
                      Coins Earned
                    </span>
                    <span className="text-sm font-arcade text-yellow-400">+{coins * 10} EC</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (currentWorld < 4) {
                      setCurrentWorld(currentWorld + 1);
                      setGameState(GameState.WORLD_MAP);
                      setLives(3);
                    } else {
                      navigate({ to: "/games" });
                    }
                  }}
                  className="w-full p-5 rounded-2xl bg-yellow-500 text-black font-arcade text-sm italic uppercase tracking-widest active:scale-95"
                >
                  CONTINUAR CARREIRA
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Touch Controls (Mobile) */}
      <div className="h-40 bg-[#111] grid grid-cols-2 p-4 shrink-0 border-t border-white/5">
        <div className="grid grid-cols-3 gap-2">
          <ControlBtn
            icon={<ChevronLeft className="size-8" />}
            onDown={() => {
              gameRef.current.keys["ArrowLeft"] = true;
            }}
            onUp={() => {
              gameRef.current.keys["ArrowLeft"] = false;
            }}
          />
          <div />
          <ControlBtn
            icon={<ChevronLeft className="size-8 rotate-180" />}
            onDown={() => {
              gameRef.current.keys["ArrowRight"] = true;
            }}
            onUp={() => {
              gameRef.current.keys["ArrowRight"] = false;
            }}
          />
        </div>
        <div className="flex items-center justify-end gap-4">
          <ControlBtn
            color="bg-primary/20 text-primary"
            icon={<Mic2 className="size-8" />}
            onDown={() => {
              gameRef.current.keys["z"] = true;
            }}
            onUp={() => {
              gameRef.current.keys["z"] = false;
            }}
          />
          <ControlBtn
            color="bg-white/20 text-white"
            icon={<ChevronLeft className="size-8 rotate-90" />}
            onDown={() => {
              gameRef.current.keys["ArrowUp"] = true;
            }}
            onUp={() => {
              gameRef.current.keys["ArrowUp"] = false;
            }}
          />
        </div>
      </div>
    </main>
  );
}

function ControlBtn({
  icon,
  onDown,
  onUp,
  color = "bg-secondary text-white",
}: {
  icon: React.ReactNode;
  onDown: () => void;
  onUp: () => void;
  color?: string;
}) {
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        onDown();
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        onUp();
      }}
      onPointerLeave={(e) => {
        onUp();
      }}
      onPointerCancel={(e) => {
        e.preventDefault();
        onUp();
      }}
      className={`size-16 rounded-2xl ${color} grid place-items-center active:scale-90 transition-transform select-none touch-none shadow-lg border border-white/10`}
    >
      {icon}
    </button>
  );
}

function GameFooter({ selectedArtist }: { selectedArtist: Artist | null }) {
  return (
    <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src={selectedArtist ? (driveImg(selectedArtist.foto, 100) as string) : undefined}
          className="size-10 rounded-full border-2 border-primary"
          alt=""
        />
        <div>
          <p className="font-arcade text-[8px] uppercase">{selectedArtist?.nome}</p>
          <p className="text-[10px] text-primary italic font-bold">Rising Star</p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <Music className="size-5 text-primary mb-1" />
        <span className="font-arcade text-[8px] uppercase tracking-tighter">
          Current Hit: "Pop Dreams"
        </span>
      </div>
    </div>
  );
}

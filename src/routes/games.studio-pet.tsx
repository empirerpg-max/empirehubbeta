import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  Heart, 
  Coffee, 
  Utensils, 
  Moon, 
  Sparkles,
  Zap,
  Info,
  Clock,
  Coins
} from "lucide-react";
import { api } from "@/lib/api";
import { useTelegramUser } from "@/lib/telegram";

export const Route = createFileRoute("/games/studio-pet")({
  component: StudioPetGame,
});

// -- CONFIGURAÇÕES DO PET --
const DECAY_RATES = {
  hunger: 5, // % per hour
  energy: 8,
  happiness: 4
};

const STAT_TO_EMOJI = {
  hunger: "🍖",
  energy: "⚡",
  happiness: "❤️"
};

interface PetState {
  name: string;
  hunger: number;
  energy: number;
  happiness: number;
  lastUpdate: number;
  level: number;
  exp: number;
  type: "robot" | "alien" | "ghost";
}

function StudioPetGame() {
  const { user } = useTelegramUser();
  const [pet, setPet] = useState<PetState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [petAction, setPetAction] = useState<string>("idle");

  // -- CARGA INICIAL E SINCRONIZAÇÃO --

  const fetchPet = useCallback(async () => {
    if (!user?.id || user.id === "guest") {
      setLoading(false);
      return;
    }
    try {
      const res = await api.getPetState(user.id);
      if (res.ok && res.payload) {
        const savedState = JSON.parse(res.payload);
        const lastUpdate = res.lastUpdate; // Timestamp do server
        
        // Aplica o decay baseado no tempo passado
        const now = new Date().getTime();
        const hoursPassed = (now - lastUpdate) / 3600000;
        
        const newState: PetState = {
          ...savedState,
          hunger: Math.max(0, savedState.hunger - DECAY_RATES.hunger * hoursPassed),
          energy: Math.max(0, savedState.energy - DECAY_RATES.energy * hoursPassed),
          happiness: Math.max(0, savedState.happiness - DECAY_RATES.happiness * hoursPassed),
          lastUpdate: now
        };
        setPet(newState);
      } else {
        // Primeiro Pet
        setPet({
          name: "Manager Jr.",
          hunger: 80,
          energy: 100,
          happiness: 70,
          lastUpdate: new Date().getTime(),
          level: 1,
          exp: 0,
          type: "robot"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPet();
  }, [fetchPet]);

  const saveState = async (newState: PetState) => {
    if (!user?.id || user.id === "guest") return;
    setSyncing(true);
    try {
      await api.savePetState(user.id, JSON.stringify(newState));
    } finally {
      setSyncing(false);
    }
  };

  // -- AÇÕES --

  const handleAction = async (type: 'feed' | 'play' | 'sleep' | 'clean') => {
    if (!pet || syncing) return;

    let cost = 0;
    let updates: Partial<PetState> = {};
    let msg = "";
    let animation = "idle";

    switch(type) {
      case 'feed':
        cost = 20;
        updates = { hunger: Math.min(100, pet.hunger + 30), exp: pet.exp + 10 };
        msg = "Refeição balanceada servida!";
        animation = "eating";
        break;
      case 'play':
        updates = { happiness: Math.min(100, pet.happiness + 25), energy: Math.max(0, pet.energy - 15), exp: pet.exp + 20 };
        msg = "Dancinha de hit maker!";
        animation = "playing";
        break;
      case 'sleep':
        updates = { energy: 100, hunger: Math.max(0, pet.hunger - 10) };
        msg = "Descansando para o próximo show...";
        animation = "sleeping";
        break;
      case 'clean':
        updates = { happiness: Math.min(100, pet.happiness + 10), exp: pet.exp + 5 };
        msg = "Estúdio limpo e organizado!";
        animation = "cleaning";
        break;
    }

    // Verifica saldo apenas se houver custo e não for guest
    if (cost > 0 && user?.id !== "guest") {
      const res = await api.syncGameCoins(user!.id, cost, 0);
      if (!res.ok) {
        setMessage("Saldo insuficiente de Empire Coins!");
        return;
      }
    } else if (cost > 0 && user?.id === "guest") {
        // Mock cost success for guest but warn
        console.log("Guest mode: skipping cost deduction");
    }

    const nextState = { ...pet, ...updates };
    
    // Level Up Check
    if (nextState.exp >= nextState.level * 100) {
      nextState.level += 1;
      nextState.exp = 0;
      msg = `LEVEL UP! Seu pet agora é Nível ${nextState.level}!`;
    }

    setPet(nextState);
    setPetAction(animation);
    setMessage(msg);
    saveState(nextState);

    // Reset Animation
    setTimeout(() => {
      setPetAction("idle");
      setMessage(null);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 text-center h-screen">
         <Sparkles className="size-10 text-primary animate-pulse mb-4" />
         <p className="font-black uppercase italic tracking-tighter text-black">Acordando o Pet...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F9FAFB] min-h-screen relative overflow-hidden flex flex-col pb-32">
      {/* HEADER */}
      <div className="p-6 flex items-center justify-between z-50">
         <Link to="/games" className="size-10 bg-white border-2 border-black rounded-xl flex items-center justify-center text-black shadow-[3px_3px_0px_#000] active:scale-95 transition-all">
            <ChevronLeft />
         </Link>
         
         <div className="flex items-center gap-3 bg-white border-2 border-black rounded-2xl px-4 py-2 shadow-[4px_4px_0px_#000]">
            <Zap className="size-5 text-amber-500 fill-amber-500" />
            <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase opacity-40">Nível</span>
               <span className="text-xl font-black italic -mt-1 leading-none">{pet?.level}</span>
            </div>
         </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center -mt-16 px-6">
         {/* STATUS BARS */}
         <div className="w-full max-w-xs grid grid-cols-3 gap-3 mb-12">
            {[
              { label: 'Fome', val: pet?.hunger, color: 'bg-orange-500', icon: <Utensils className="size-3" /> },
              { label: 'Energia', val: pet?.energy, color: 'bg-sky-500', icon: <Moon className="size-3" /> },
              { label: 'Mood', val: pet?.happiness, color: 'bg-rose-500', icon: <Heart className="size-3" /> },
            ].map(stat => (
              <div key={stat.label} className="space-y-1">
                 <div className="flex items-center gap-1 text-[9px] font-black uppercase text-black/40">
                    {stat.icon} {stat.label}
                 </div>
                 <div className="h-2 bg-black/5 rounded-full overflow-hidden border border-black/10">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: `${stat.val}%` }}
                      className={`h-full ${stat.color} transition-all`}
                    />
                 </div>
              </div>
            ))}
         </div>

         {/* MESSAGE BUBBLE */}
         <AnimatePresence mode="wait">
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-1/4 bg-black text-white px-6 py-3 rounded-full font-black text-sm uppercase italic tracking-tighter shadow-xl z-20"
              >
                 {message}
                 <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rotate-45" />
              </motion.div>
            )}
         </AnimatePresence>

         {/* MASCOT VISUAL INTERFACE (CANVAS OR ANIMATED SVG) */}
         <div className="relative mb-20 group">
            {/* Shadow */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/5 blur-md rounded-full transition-all group-hover:scale-125" />
            
            {/* THE PET */}
            <motion.div 
              animate={{ 
                y: petAction === 'idle' ? [0, -10, 0] : 0,
                rotate: petAction === 'playing' ? [0, -5, 5, 0] : 0,
                scale: petAction === 'eating' ? [1, 1.1, 1] : 1
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                scale: { duration: 0.5, repeat: 3 }
              }}
              className="relative w-48 h-48 flex items-center justify-center p-8 bg-white border-4 border-black rounded-[60px] shadow-[8px_8px_0px_#000] overflow-hidden"
            >
               {/* Facial Features - Robot Style */}
               <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-6">
                     <motion.div 
                      animate={{ height: petAction === 'sleeping' ? 2 : 20 }}
                      className="w-1.5 bg-black rounded-full" 
                     />
                     <motion.div 
                      animate={{ height: petAction === 'sleeping' ? 2 : 20 }}
                      className="w-1.5 bg-black rounded-full" 
                     />
                  </div>
                  <motion.div 
                    animate={{ width: petAction === 'eating' ? 30 : 10, height: petAction === 'playing' ? 10 : 2 }}
                    className="bg-black rounded-full" 
                  />
               </div>
               
               {/* Floating elements */}
               {petAction === 'idle' && (
                 <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0], y: [-10, -30] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute top-4 right-4 text-rose-500"
                 >
                   <Heart className="size-6 fill-current" />
                 </motion.div>
               )}
            </motion.div>
         </div>

         {/* STATS INFO */}
         <div className="w-full max-w-sm mb-12 flex justify-center gap-4">
            <div className="flex items-center gap-2 text-black/50 text-xs font-medium">
               <Clock className="size-3" />
               Última visita: {new Date(pet?.lastUpdate || 0).toLocaleTimeString([], { hour: '2d', minute: '2d' })}
            </div>
            <div className="flex items-center gap-2 text-black/50 text-xs font-medium">
               <Info className="size-3" />
               Bônus: +{pet ? pet.level * 2 : 0}% Prestigio
            </div>
         </div>

         {/* CONTROLS */}
         <div className="w-full max-w-xs grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleAction('feed')}
              className="p-4 bg-white border-2 border-black rounded-2xl flex flex-col items-center gap-2 shadow-[2px_2px_0px_#000] active:scale-95 transition-all text-black font-black uppercase text-xs disabled:opacity-50"
              disabled={syncing}
            >
               <div className="size-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                  <Utensils className="size-5" />
               </div>
               <span>Alimentar</span>
               <span className="text-[9px] text-black/40 flex items-center gap-1"><Coins className="size-2" /> 20 EC</span>
            </button>
            <button 
              onClick={() => handleAction('play')}
              className="p-4 bg-white border-2 border-black rounded-2xl flex flex-col items-center gap-2 shadow-[2px_2px_0px_#000] active:scale-95 transition-all text-black font-black uppercase text-xs disabled:opacity-50"
              disabled={syncing}
            >
               <div className="size-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                  <Sparkles className="size-5" />
               </div>
               <span>Brincar</span>
               <span className="text-[9px] text-black/40">Gasta 15 Energy</span>
            </button>
            <button 
              onClick={() => handleAction('sleep')}
              className="p-4 bg-white border-2 border-black rounded-2xl flex flex-col items-center gap-2 shadow-[2px_2px_0px_#000] active:scale-95 transition-all text-black font-black uppercase text-xs disabled:opacity-50"
              disabled={syncing}
            >
               <div className="size-10 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center">
                  <Moon className="size-5" />
               </div>
               <span>Dormir</span>
               <span className="text-[9px] text-black/40">Recupera Energy</span>
            </button>
            <button 
              onClick={() => handleAction('clean')}
              className="p-4 bg-white border-2 border-black rounded-2xl flex flex-col items-center gap-2 shadow-[2px_2px_0px_#000] active:scale-95 transition-all text-black font-black uppercase text-xs disabled:opacity-50"
              disabled={syncing}
            >
               <div className="size-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <Zap className="size-5" />
               </div>
               <span>Limpar</span>
               <span className="text-[9px] text-black/40">+5 EXP</span>
            </button>
         </div>
      </main>

      {/* FOOTER INFO */}
      {syncing && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 bg-black/10 rounded-full">
           <RefreshCw className="size-3 animate-spin text-black/40" />
           <span className="text-[9px] font-black uppercase text-black/40 tracking-wider">Lendo o Diário...</span>
        </div>
      )}
    </div>
  );
}

function RefreshCw({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

export default StudioPetGame;

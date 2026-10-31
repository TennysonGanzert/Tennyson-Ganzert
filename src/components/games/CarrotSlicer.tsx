import React, { useRef, useEffect, useState, useCallback } from 'react';
import { UserSaveData } from '../../types/game';
import { sound } from '../../utils/audio';
import { Play, RotateCcw, Heart, Sparkles, Sword } from 'lucide-react';

interface CarrotSlicerProps {
  saveData: UserSaveData;
  onUpdateSave: (updater: (prev: UserSaveData) => UserSaveData) => void;
  onReturnToHub: () => void;
}

interface FlyingVeggie {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: 'carrot' | 'strawberry' | 'radish' | 'bomb';
  sliced: boolean;
  sliceAngle?: number;
}

interface SlashPoint {
  x: number;
  y: number;
  time: number;
}

export const CarrotSlicer: React.FC<CarrotSlicerProps> = ({
  saveData,
  onUpdateSave,
  onReturnToHub
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAME_OVER'>('MENU');
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [carrotsWon, setCarrotsWon] = useState<number>(0);
  const [isRecord, setIsRecord] = useState<boolean>(false);

  const gameRef = useRef<{
    veggies: FlyingVeggie[];
    slashTrail: SlashPoint[];
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; alpha: number; size: number }>;
    score: number;
    lives: number;
    carrots: number;
    spawnTimer: number;
    lastTime: number;
    animationId: number | null;
  }>({
    veggies: [],
    slashTrail: [],
    particles: [],
    score: 0,
    lives: 3,
    carrots: 0,
    spawnTimer: 0.5,
    lastTime: 0,
    animationId: null
  });

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.score = 0;
    g.lives = 3;
    g.carrots = 0;
    g.veggies = [];
    g.slashTrail = [];
    g.particles = [];
    g.spawnTimer = 0.5;
    g.lastTime = 0;

    setScore(0);
    setLives(3);
    setCarrotsWon(0);
    setIsRecord(false);
    setGameState('PLAYING');
    sound.playJump();
  }, []);

  // Check blade cutting collision along swipe line
  const handleSlice = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const g = gameRef.current;
    let cutCountThisSwipe = 0;

    g.veggies.forEach(v => {
      if (v.sliced) return;

      // Distance from point to line segment
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) return;

      const u = Math.max(0, Math.min(1, ((v.x - p1.x) * dx + (v.y - p1.y) * dy) / (len * len)));
      const closestX = p1.x + u * dx;
      const closestY = p1.y + u * dy;
      const dist = Math.hypot(v.x - closestX, v.y - closestY);

      if (dist < v.radius + 10) {
        // SLICE!
        v.sliced = true;
        v.sliceAngle = Math.atan2(dy, dx);

        if (v.type === 'bomb') {
          sound.playHurt();
          g.lives -= 1;
          setLives(g.lives);

          // Dark blast particles
          for (let i = 0; i < 12; i++) {
            g.particles.push({
              x: v.x,
              y: v.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              color: '#3F3F46',
              alpha: 1,
              size: 5
            });
          }

          if (g.lives <= 0) {
            sound.playGameOver();
            setGameState('GAME_OVER');
            const finalScore = g.score;
            const isNew = finalScore > (saveData.highScores?.slicer || 0);
            setIsRecord(isNew);

            onUpdateSave(prev => ({
              ...prev,
              carrots: prev.carrots + g.carrots,
              totalGames: prev.totalGames + 1,
              highScores: {
                ...prev.highScores,
                slicer: Math.max(prev.highScores?.slicer || 0, finalScore)
              }
            }));
          }
        } else {
          // Clean veggie slice
          cutCountThisSwipe++;
          sound.playCarrot();
          const pts = v.type === 'radish' ? 40 : v.type === 'strawberry' ? 25 : 15;
          g.score += pts;
          g.carrots += 1;
          setScore(g.score);
          setCarrotsWon(g.carrots);

          // Juice splatter particles
          const juiceColor = v.type === 'strawberry' ? '#EF4444' : v.type === 'radish' ? '#EAB308' : '#F97316';
          for (let i = 0; i < 10; i++) {
            g.particles.push({
              x: v.x,
              y: v.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: juiceColor,
              alpha: 1,
              size: 3.5
            });
          }
        }
      }
    });

    if (cutCountThisSwipe >= 2) {
      sound.playGoldenCarrot();
    }
  }, [onUpdateSave, saveData.highScores]);

  // Touch / Pointer Tracking
  const recordPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = 480 / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;

    const g = gameRef.current;
    const now = Date.now();
    const lastPoint = g.slashTrail[g.slashTrail.length - 1];

    if (lastPoint) {
      handleSlice(lastPoint, { x, y });
    }

    g.slashTrail.push({ x, y, time: now });
  };

  // Main canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const loop = (timestamp: number) => {
      if (!isRunning) return;
      const g = gameRef.current;
      if (!g.lastTime) g.lastTime = timestamp;
      const dt = Math.min((timestamp - g.lastTime) / 1000, 0.05);
      g.lastTime = timestamp;

      if (gameState === 'PLAYING') {
        // Spawn tossed veggies
        g.spawnTimer -= dt;
        if (g.spawnTimer <= 0) {
          g.spawnTimer = 0.6 + Math.random() * 0.5;

          const roll = Math.random();
          let type: FlyingVeggie['type'] = 'carrot';
          if (roll < 0.18) type = 'bomb';
          else if (roll < 0.38) type = 'strawberry';
          else if (roll < 0.58) type = 'radish';

          const spawnX = 80 + Math.random() * 320;
          const launchVx = (240 - spawnX) * 0.8 + (Math.random() - 0.5) * 80;
          const launchVy = -480 - Math.random() * 120;

          g.veggies.push({
            id: Math.random(),
            x: spawnX,
            y: 520,
            vx: launchVx,
            vy: launchVy,
            radius: type === 'radish' ? 24 : 18,
            type,
            sliced: false
          });
        }

        // Update veggies physics
        for (let i = g.veggies.length - 1; i >= 0; i--) {
          const v = g.veggies[i];
          v.vy += 420 * dt; // Gravity
          v.x += v.vx * dt;
          v.y += v.vy * dt;

          // Dropped un-sliced good veggie: lose 1 life if below screen
          if (v.y > 540) {
            if (!v.sliced && v.type !== 'bomb') {
              g.lives -= 1;
              setLives(g.lives);
              sound.playHurt();

              if (g.lives <= 0) {
                sound.playGameOver();
                setGameState('GAME_OVER');
                const finalScore = g.score;
                const isNew = finalScore > (saveData.highScores?.slicer || 0);
                setIsRecord(isNew);

                onUpdateSave(prev => ({
                  ...prev,
                  carrots: prev.carrots + g.carrots,
                  totalGames: prev.totalGames + 1,
                  highScores: {
                    ...prev.highScores,
                    slicer: Math.max(prev.highScores?.slicer || 0, finalScore)
                  }
                }));
              }
            }
            g.veggies.splice(i, 1);
          }
        }

        // Clean old slash trail
        const now = Date.now();
        g.slashTrail = g.slashTrail.filter(p => now - p.time < 180);
      }

      // Update particles
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const pt = g.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= dt * 2.5;
        if (pt.alpha <= 0) {
          g.particles.splice(i, 1);
        }
      }

      // --- RENDER ---
      ctx.clearRect(0, 0, 480, 500);

      // Wood chopping board backdrop
      ctx.fillStyle = '#2A1810';
      ctx.fillRect(0, 0, 480, 500);

      ctx.fillStyle = '#3E2723';
      ctx.beginPath();
      ctx.roundRect(14, 14, 452, 472, 24);
      ctx.fill();

      // Wood plank lines
      ctx.strokeStyle = '#27170E';
      ctx.lineWidth = 1.5;
      for (let y = 60; y < 480; y += 70) {
        ctx.beginPath();
        ctx.moveTo(14, y); ctx.lineTo(466, y);
        ctx.stroke();
      }

      // Draw Veggies
      g.veggies.forEach(v => {
        ctx.save();
        ctx.translate(v.x, v.y);

        if (v.sliced) {
          // Half pieces drifting apart
          ctx.rotate(v.sliceAngle || 0);
          ctx.fillStyle = v.type === 'strawberry' ? '#EF4444' : v.type === 'radish' ? '#EAB308' : '#F97316';
          ctx.beginPath();
          ctx.arc(0, -8, v.radius, 0, Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(0, 8, v.radius, Math.PI, Math.PI * 2);
          ctx.fill();
        } else if (v.type === 'bomb') {
          // Spiky bomb
          ctx.fillStyle = '#18181B';
          ctx.beginPath();
          ctx.arc(0, 0, v.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(0, -v.radius, 4, 0, Math.PI * 2);
          ctx.fill();
          // Skull icon or X
          ctx.fillStyle = '#FFF';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💣', 0, 4);
        } else if (v.type === 'strawberry') {
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(0, 2, v.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#22C55E';
          ctx.beginPath();
          ctx.ellipse(0, -v.radius + 2, 7, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (v.type === 'radish') {
          ctx.fillStyle = '#EAB308';
          ctx.beginPath();
          ctx.arc(0, 0, v.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#84CC16';
          ctx.beginPath();
          ctx.ellipse(0, -v.radius, 5, 8, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Carrot
          ctx.fillStyle = '#F97316';
          ctx.beginPath();
          ctx.ellipse(0, 0, 10, 18, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#22C55E';
          ctx.beginPath();
          ctx.ellipse(2, -18, 4, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // Draw Glowing Blade Slash Trail
      if (g.slashTrail.length >= 2) {
        ctx.save();
        ctx.strokeStyle = '#FACC15';
        ctx.shadowColor = '#FBBF24';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(g.slashTrail[0].x, g.slashTrail[0].y);
        for (let i = 1; i < g.slashTrail.length; i++) {
          ctx.lineTo(g.slashTrail[i].x, g.slashTrail[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Draw Particles
      g.particles.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      g.animationId = requestAnimationFrame(loop);
    };

    gameRef.current.animationId = requestAnimationFrame(loop);
    return () => {
      isRunning = false;
      if (gameRef.current.animationId) cancelAnimationFrame(gameRef.current.animationId);
    };
  }, [gameState, onUpdateSave, saveData.highScores]);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center select-none touch-manipulation">
      {/* Top HUD */}
      <div className="w-full bg-white/95 backdrop-blur-md border border-amber-200/80 rounded-2xl px-5 py-2.5 mb-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-700/70 block leading-tight">
              Pontuação
            </span>
            <span className="text-xl font-bold font-mono text-stone-900 tabular-nums">
              {score}
            </span>
          </div>

          <span className="text-stone-300 font-light" aria-hidden="true">|</span>

          {/* Hearts */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(hIdx => (
              <Heart
                key={hIdx}
                className={`w-5 h-5 ${
                  hIdx <= lives ? 'text-rose-500 fill-rose-500' : 'text-stone-300 fill-stone-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 block leading-tight">
            Cenouras Fatiadas
          </span>
          <span className="text-base font-bold font-mono text-amber-900 tabular-nums">
            +{carrotsWon} 🥕
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full aspect-[480/500] max-h-[500px] bg-stone-900 rounded-3xl overflow-hidden shadow-xl border-4 border-amber-900/40 touch-none">
        <canvas
          ref={canvasRef}
          width={480}
          height={500}
          onPointerDown={recordPointer}
          onPointerMove={recordPointer}
          className="w-full h-full object-cover block cursor-crosshair"
        />

        {/* Start Menu */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl">⚔️</span>
            </div>
            <h2 className="text-2xl font-bold font-display mb-1 text-white">
              Ninja da Horta
            </h2>
            <p className="text-xs text-amber-100 max-w-xs mb-5 leading-relaxed">
              Deslize o dedo na tela para cortar os vegetais ao meio! Não corte as bombas 💣!
            </p>

            <button
              type="button"
              onClick={startGame}
              className="flex items-center gap-2 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-sm rounded-2xl shadow-lg transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Desembainhar Espada
            </button>

            <div className="mt-4 text-xs text-amber-200/90 bg-black/30 px-3 py-1 rounded-full">
              Recorde: {(saveData.highScores?.slicer || 0).toLocaleString()} pontos
            </div>
          </div>
        )}

        {/* Game Over */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-20">
            {isRecord && (
              <div className="mb-2 inline-flex items-center gap-1 text-amber-300 text-xs font-bold uppercase tracking-wider bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/40 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                Novo Recorde!
              </div>
            )}
            <h3 className="text-2xl font-bold font-display mb-2">Fim do Treino Ninja!</h3>

            <div className="w-full max-w-xs bg-stone-900/80 border border-stone-800 rounded-2xl p-4 mb-4 text-left space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Pontuação de Corte:</span>
                <span className="font-mono font-bold text-white tabular-nums text-sm">{score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Cenouras Salvas:</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">+{carrotsWon} 🥕</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-48">
              <button
                type="button"
                onClick={startGame}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Fatiar Novamente
              </button>
              <button
                type="button"
                onClick={onReturnToHub}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs rounded-xl transition-colors"
              >
                Voltar aos Jogos
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 text-center text-[11px] text-stone-500 flex items-center gap-1">
        <Sword className="w-3.5 h-3.5 text-amber-600" />
        <span>Dica: Deslize o dedo rapidamente para fatiar vários de uma vez!</span>
      </div>
    </div>
  );
};

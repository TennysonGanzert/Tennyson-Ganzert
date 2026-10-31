import React, { useRef, useEffect, useState, useCallback } from 'react';
import { UserSaveData } from '../../types/game';
import { BUNNY_SKINS, BUNNY_HATS } from '../../utils/constants';
import { sound } from '../../utils/audio';
import { Play, RotateCcw, Sparkles, Target, Zap } from 'lucide-react';

interface CarrotCannonProps {
  saveData: UserSaveData;
  onUpdateSave: (updater: (prev: UserSaveData) => UserSaveData) => void;
  onReturnToHub: () => void;
}

interface ShotCarrot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

interface TargetItem {
  id: number;
  x: number;
  y: number;
  radius: number;
  vy: number;
  type: 'basket' | 'balloon' | 'star';
  points: number;
  hit: boolean;
}

export const CarrotCannon: React.FC<CarrotCannonProps> = ({
  saveData,
  onUpdateSave,
  onReturnToHub
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAME_OVER'>('MENU');
  const [score, setScore] = useState<number>(0);
  const [ammo, setAmmo] = useState<number>(6);
  const [carrotsWon, setCarrotsWon] = useState<number>(0);
  const [isRecord, setIsRecord] = useState<boolean>(false);

  const activeSkin = BUNNY_SKINS.find(s => s.id === saveData.customization.skin) || BUNNY_SKINS[0];
  const activeHat = BUNNY_HATS.find(h => h.id === saveData.customization.hat) || BUNNY_HATS[0];

  const gameRef = useRef<{
    slingshotPos: { x: number; y: number };
    dragPos: { x: number; y: number } | null;
    isDragging: boolean;
    flyingCarrots: ShotCarrot[];
    targets: TargetItem[];
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; alpha: number; size: number }>;
    score: number;
    ammo: number;
    carrotsCollected: number;
    lastTime: number;
    animationId: number | null;
  }>({
    slingshotPos: { x: 70, y: 410 },
    dragPos: null,
    isDragging: false,
    flyingCarrots: [],
    targets: [],
    particles: [],
    score: 0,
    ammo: 6,
    carrotsCollected: 0,
    lastTime: 0,
    animationId: null
  });

  const spawnTargets = useCallback(() => {
    const targets: TargetItem[] = [];
    for (let i = 0; i < 4; i++) {
      targets.push({
        id: i,
        x: 230 + (i % 2) * 110 + Math.random() * 40,
        y: 100 + i * 80,
        radius: 20 + Math.random() * 6,
        vy: (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 30),
        type: i === 3 ? 'star' : i === 1 ? 'balloon' : 'basket',
        points: i === 3 ? 60 : 30,
        hit: false
      });
    }
    return targets;
  }, []);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.score = 0;
    g.ammo = 6;
    g.carrotsCollected = 0;
    g.flyingCarrots = [];
    g.particles = [];
    g.targets = spawnTargets();
    g.lastTime = 0;

    setScore(0);
    setAmmo(6);
    setCarrotsWon(0);
    setIsRecord(false);
    setGameState('PLAYING');
    sound.playJump();
  }, [spawnTargets]);

  // Touch & Pointer Drag for Slingshot
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING' || gameRef.current.ammo <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = 480 / rect.width;
    const px = (e.clientX - rect.left) * scale;
    const py = (e.clientY - rect.top) * scale;

    const g = gameRef.current;
    const distToSling = Math.hypot(px - g.slingshotPos.x, py - g.slingshotPos.y);

    // Click near slingshot
    if (distToSling < 90) {
      g.isDragging = true;
      g.dragPos = { x: px, y: py };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gameRef.current;
    if (!g.isDragging || gameState !== 'PLAYING') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const scale = 480 / rect.width;
    const px = (e.clientX - rect.left) * scale;
    const py = (e.clientY - rect.top) * scale;

    // Constrain pull distance
    const dx = px - g.slingshotPos.x;
    const dy = py - g.slingshotPos.y;
    const dist = Math.hypot(dx, dy);
    const maxPull = 90;

    if (dist > maxPull) {
      g.dragPos = {
        x: g.slingshotPos.x + (dx / dist) * maxPull,
        y: g.slingshotPos.y + (dy / dist) * maxPull
      };
    } else {
      g.dragPos = { x: px, y: py };
    }
  };

  const handlePointerUp = () => {
    const g = gameRef.current;
    if (!g.isDragging || !g.dragPos || gameState !== 'PLAYING') return;

    // Launch carrot!
    const dx = g.slingshotPos.x - g.dragPos.x;
    const dy = g.slingshotPos.y - g.dragPos.y;

    if (Math.hypot(dx, dy) > 15) {
      sound.playSpring();
      const power = 10;
      g.flyingCarrots.push({
        x: g.slingshotPos.x,
        y: g.slingshotPos.y,
        vx: dx * power,
        vy: dy * power,
        active: true
      });

      g.ammo -= 1;
      setAmmo(g.ammo);
    }

    g.isDragging = false;
    g.dragPos = null;
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
        // Move targets up/down
        g.targets.forEach(t => {
          if (t.hit) return;
          t.y += t.vy * dt;
          if (t.y < 80 || t.y > 360) {
            t.vy = -t.vy;
          }
        });

        // Update flying carrots
        for (let i = g.flyingCarrots.length - 1; i >= 0; i--) {
          const carrot = g.flyingCarrots[i];
          if (!carrot.active) continue;

          // Gravity
          carrot.vy += 450 * dt;
          carrot.x += carrot.vx * dt;
          carrot.y += carrot.vy * dt;

          // Wall bounces
          if (carrot.x > 470) {
            carrot.x = 470;
            carrot.vx = -carrot.vx * 0.6;
          }
          if (carrot.y > 480) {
            carrot.active = false;
          }

          // Target collision checks
          g.targets.forEach(target => {
            if (target.hit) return;
            const dist = Math.hypot(carrot.x - target.x, carrot.y - target.y);
            if (dist < target.radius + 12) {
              target.hit = true;
              carrot.active = false;
              sound.playGoldenCarrot();

              g.score += target.points;
              g.carrotsCollected += Math.floor(target.points / 15);
              setScore(g.score);
              setCarrotsWon(g.carrotsCollected);

              // Target burst particles
              for (let p = 0; p < 8; p++) {
                g.particles.push({
                  x: target.x,
                  y: target.y,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  color: target.type === 'star' ? '#FACC15' : '#FB923C',
                  alpha: 1,
                  size: 4
                });
              }

              // Respawn target after delay
              setTimeout(() => {
                target.hit = false;
                target.y = 100 + Math.random() * 200;
              }, 1200);
            }
          });

          if (!carrot.active) {
            g.flyingCarrots.splice(i, 1);
          }
        }

        // Check Out of Ammo & No Flying Carrots -> Game Over
        if (g.ammo <= 0 && g.flyingCarrots.length === 0) {
          sound.playGameOver();
          setGameState('GAME_OVER');

          const finalScore = g.score;
          const isNew = finalScore > (saveData.highScores?.cannon || 0);
          setIsRecord(isNew);

          onUpdateSave(prev => ({
            ...prev,
            carrots: prev.carrots + g.carrotsCollected,
            totalGames: prev.totalGames + 1,
            highScores: {
              ...prev.highScores,
              cannon: Math.max(prev.highScores?.cannon || 0, finalScore)
            }
          }));
        }
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

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, 500);
      sky.addColorStop(0, '#BAE6FD');
      sky.addColorStop(0.7, '#FEF08A');
      sky.addColorStop(1, '#86EFAC');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 480, 500);

      // Ground hill
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.ellipse(100, 530, 240, 110, 0, 0, Math.PI * 2);
      ctx.fill();

      // Slingshot frame
      const sx = g.slingshotPos.x;
      const sy = g.slingshotPos.y;

      ctx.fillStyle = '#78350F';
      ctx.fillRect(sx - 5, sy, 10, 45); // post
      ctx.beginPath();
      ctx.moveTo(sx - 15, sy - 20); ctx.lineTo(sx - 5, sy);
      ctx.moveTo(sx + 15, sy - 20); ctx.lineTo(sx + 5, sy);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#78350F';
      ctx.stroke();

      // Draw Slingshot Bands
      const dragX = g.dragPos ? g.dragPos.x : sx;
      const dragY = g.dragPos ? g.dragPos.y : sy - 12;

      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx - 15, sy - 18);
      ctx.lineTo(dragX, dragY);
      ctx.moveTo(sx + 15, sy - 18);
      ctx.lineTo(dragX, dragY);
      ctx.stroke();

      // Draw Aim Trajectory Dots when dragging
      if (g.isDragging && g.dragPos) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const aimDx = (sx - g.dragPos.x) * 10;
        const aimDy = (sy - g.dragPos.y) * 10;

        let simX = sx;
        let simY = sy;
        let simVy = aimDy;

        for (let step = 0; step < 12; step++) {
          simVy += 450 * 0.04;
          simX += aimDx * 0.04;
          simY += simVy * 0.04;
          ctx.beginPath();
          ctx.arc(simX, simY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Carrot in Slingshot if dragging
      if (g.isDragging || g.ammo > 0) {
        ctx.fillStyle = '#F97316';
        ctx.beginPath();
        ctx.arc(dragX, dragY, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Targets
      g.targets.forEach(t => {
        if (t.hit) return;

        ctx.save();
        ctx.translate(t.x, t.y);

        if (t.type === 'basket') {
          // Wicker Basket Target
          ctx.fillStyle = '#D97706';
          ctx.beginPath();
          ctx.ellipse(0, 0, t.radius, t.radius * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#92400E';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#FFF';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('25', 0, 4);
        } else if (t.type === 'balloon') {
          // Floating Balloon
          ctx.fillStyle = '#EC4899';
          ctx.beginPath();
          ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFF';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('30', 0, 4);
        } else if (t.type === 'star') {
          // Golden Star Target
          ctx.fillStyle = '#FACC15';
          ctx.beginPath();
          ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#CA8A04';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#78350F';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('60★', 0, 5);
        }

        ctx.restore();
      });

      // Draw Flying Carrots
      g.flyingCarrots.forEach(c => {
        ctx.fillStyle = '#F97316';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.arc(c.x - 6, c.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

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

      // Draw Bunny Gunner beside slingshot
      const { fur, innerEar, nose, eyes, cheeks } = activeSkin.colors;
      ctx.save();
      ctx.translate(35, 420);

      // Body & Head
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(0, -10, 15, 14, 0, 0, Math.PI * 2);
      ctx.arc(6, -24, 12, 0, Math.PI * 2);
      ctx.fill();
      // Cheeks
      ctx.fillStyle = cheeks;
      ctx.beginPath();
      ctx.arc(12, -21, 3, 0, Math.PI * 2);
      ctx.fill();
      // Ears
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(2, -34, 4, 10, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = innerEar;
      ctx.beginPath();
      ctx.ellipse(2, -34, 2, 7, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Eye & Nose
      ctx.fillStyle = eyes;
      ctx.beginPath();
      ctx.arc(10, -25, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = nose;
      ctx.beginPath();
      ctx.arc(15, -23, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      g.animationId = requestAnimationFrame(loop);
    };

    gameRef.current.animationId = requestAnimationFrame(loop);
    return () => {
      isRunning = false;
      if (gameRef.current.animationId) cancelAnimationFrame(gameRef.current.animationId);
    };
  }, [gameState, activeSkin, activeHat, onUpdateSave, saveData.highScores]);

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

          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-orange-700/70 block leading-tight">
              Munição
            </span>
            <span className="text-xl font-bold font-mono text-orange-600 tabular-nums flex items-center gap-1">
              <span>🥕</span>
              <span>{ammo}</span>
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 block leading-tight">
            Cenouras Ganhas
          </span>
          <span className="text-base font-bold font-mono text-amber-900 tabular-nums">
            +{carrotsWon}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full aspect-[480/500] max-h-[500px] bg-sky-200 rounded-3xl overflow-hidden shadow-xl border-4 border-amber-200/90 touch-none">
        <canvas
          ref={canvasRef}
          width={480}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-cover block cursor-crosshair"
        />

        {/* Start Menu */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl">🎯</span>
            </div>
            <h2 className="text-2xl font-bold font-display mb-1 text-white">
              Canhão de Cenouras
            </h2>
            <p className="text-xs text-amber-100 max-w-xs mb-5 leading-relaxed">
              Puxe o estilingue para trás com o dedo, mire o ângulo e acerte as cestas e estrelas!
            </p>

            <button
              type="button"
              onClick={startGame}
              className="flex items-center gap-2 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-sm rounded-2xl shadow-lg transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Carregar Estilingue
            </button>

            <div className="mt-4 text-xs text-amber-200/90 bg-black/30 px-3 py-1 rounded-full">
              Recorde: {(saveData.highScores?.cannon || 0).toLocaleString()} pontos
            </div>
          </div>
        )}

        {/* Game Over */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-20">
            {isRecord && (
              <div className="mb-2 inline-flex items-center gap-1 text-amber-300 text-xs font-bold uppercase tracking-wider bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/40 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                Novo Recorde!
              </div>
            )}
            <h3 className="text-2xl font-bold font-display mb-2">Munição Esgotada!</h3>

            <div className="w-full max-w-xs bg-stone-900/80 border border-stone-800 rounded-2xl p-4 mb-4 text-left space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Pontos de Tiro:</span>
                <span className="font-mono font-bold text-white tabular-nums text-sm">{score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Cenouras Resgatadas:</span>
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
                Atirar Novamente
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
        <Target className="w-3.5 h-3.5 text-amber-600" />
        <span>Dica: Puxe para trás no coelho para mirar a trajetória</span>
      </div>
    </div>
  );
};

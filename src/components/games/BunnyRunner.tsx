import React, { useRef, useEffect, useState, useCallback } from 'react';
import { UserSaveData } from '../../types/game';
import { BUNNY_SKINS, BUNNY_HATS } from '../../utils/constants';
import { sound } from '../../utils/audio';
import { Play, RotateCcw, Pause, Sparkles, Trophy, Zap } from 'lucide-react';

interface BunnyRunnerProps {
  saveData: UserSaveData;
  onUpdateSave: (updater: (prev: UserSaveData) => UserSaveData) => void;
  onReturnToHub: () => void;
}

interface Obstacle {
  x: number;
  width: number;
  height: number;
  type: 'fence' | 'log' | 'hedgehog';
}

interface RunnerCarrot {
  x: number;
  y: number;
  collected?: boolean;
}

export const BunnyRunner: React.FC<BunnyRunnerProps> = ({
  saveData,
  onUpdateSave,
  onReturnToHub
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'>('MENU');
  const [distance, setDistance] = useState<number>(0);
  const [carrotsThisRun, setCarrotsThisRun] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isRecord, setIsRecord] = useState<boolean>(false);

  const activeSkin = BUNNY_SKINS.find(s => s.id === saveData.customization.skin) || BUNNY_SKINS[0];
  const activeHat = BUNNY_HATS.find(h => h.id === saveData.customization.hat) || BUNNY_HATS[0];

  const gameRef = useRef<{
    bunnyY: number;
    bunnyVy: number;
    isGrounded: boolean;
    jumpsLeft: number;
    speed: number;
    distance: number;
    carrots: number;
    obstacles: Obstacle[];
    carrotItems: RunnerCarrot[];
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; alpha: number; size: number }>;
    nextObstacleDist: number;
    lastTime: number;
    animationId: number | null;
  }>({
    bunnyY: 420,
    bunnyVy: 0,
    isGrounded: true,
    jumpsLeft: 2,
    speed: 300,
    distance: 0,
    carrots: 0,
    obstacles: [],
    carrotItems: [],
    particles: [],
    nextObstacleDist: 400,
    lastTime: 0,
    animationId: null
  });

  const handleJump = useCallback(() => {
    const g = gameRef.current;
    if (g.jumpsLeft > 0) {
      sound.playJump();
      g.bunnyVy = -540;
      g.isGrounded = false;
      g.jumpsLeft--;

      // Jump dust puff
      for (let i = 0; i < 5; i++) {
        g.particles.push({
          x: 90,
          y: g.bunnyY + 24,
          vx: -Math.random() * 2 - 1,
          vy: Math.random() * 2 - 1,
          color: '#86EFAC',
          alpha: 0.8,
          size: 3.5
        });
      }
    }
  }, []);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.bunnyY = 420;
    g.bunnyVy = 0;
    g.isGrounded = true;
    g.jumpsLeft = 2;
    g.speed = 320;
    g.distance = 0;
    g.carrots = 0;
    g.obstacles = [];
    g.carrotItems = [];
    g.particles = [];
    g.nextObstacleDist = 500;
    g.lastTime = 0;

    setDistance(0);
    setCarrotsThisRun(0);
    setScore(0);
    setIsRecord(false);
    setGameState('PLAYING');
    sound.playJump();
  }, []);

  // Keyboard navigation (Space or Up arrow)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (gameState === 'PLAYING') handleJump();
        else if (gameState === 'MENU') startGame();
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setGameState(prev => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState, handleJump, startGame]);

  // Main canvas animation loop
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
        // Accelerate gradually
        g.speed = Math.min(680, g.speed + dt * 10);
        g.distance += (g.speed * dt) / 10;
        setDistance(Math.floor(g.distance));

        // Bunny gravity & physics
        const groundY = 420;
        g.bunnyVy += 1350 * dt;
        g.bunnyY += g.bunnyVy * dt;

        if (g.bunnyY >= groundY) {
          g.bunnyY = groundY;
          g.bunnyVy = 0;
          g.isGrounded = true;
          g.jumpsLeft = 2; // Restore double jump
        }

        // Spawn obstacles
        g.nextObstacleDist -= g.speed * dt;
        if (g.nextObstacleDist <= 0) {
          g.nextObstacleDist = 260 + Math.random() * 220;
          const roll = Math.random();
          let type: Obstacle['type'] = 'fence';
          let w = 24;
          let h = 34;

          if (roll < 0.35) {
            type = 'log';
            w = 32;
            h = 24;
          } else if (roll < 0.65) {
            type = 'hedgehog';
            w = 26;
            h = 22;
          }

          g.obstacles.push({
            x: 520,
            width: w,
            height: h,
            type
          });

          // Spawn arc of carrots
          if (Math.random() < 0.75) {
            for (let c = 0; c < 3; c++) {
              g.carrotItems.push({
                x: 540 + c * 38,
                y: groundY - 50 - Math.sin((c / 2) * Math.PI) * 40
              });
            }
          }
        }

        // Move obstacles
        for (let i = g.obstacles.length - 1; i >= 0; i--) {
          const obs = g.obstacles[i];
          obs.x -= g.speed * dt;

          // Collision detection with Bunny
          // Bunny hitbox: x ~ 80, width 32, height 36
          const bunnyBox = { x: 74, y: g.bunnyY - 30, w: 28, h: 32 };
          const obsBox = { x: obs.x, y: groundY - obs.height + 4, w: obs.width, h: obs.height };

          if (
            bunnyBox.x < obsBox.x + obsBox.w &&
            bunnyBox.x + bunnyBox.w > obsBox.x &&
            bunnyBox.y < obsBox.y + obsBox.h &&
            bunnyBox.y + bunnyBox.h > obsBox.y
          ) {
            // Hit obstacle: GAME OVER!
            sound.playHurt();
            sound.playGameOver();
            setGameState('GAME_OVER');

            const finalScore = Math.floor(g.distance * 2 + g.carrots * 20);
            setScore(finalScore);
            const isNew = finalScore > (saveData.highScores?.runner || 0);
            setIsRecord(isNew);

            onUpdateSave(prev => ({
              ...prev,
              carrots: prev.carrots + g.carrots,
              totalGames: prev.totalGames + 1,
              highScores: {
                ...prev.highScores,
                runner: Math.max(prev.highScores?.runner || 0, finalScore)
              }
            }));
            break;
          }

          if (obs.x < -60) {
            g.obstacles.splice(i, 1);
          }
        }

        // Move carrots
        for (let i = g.carrotItems.length - 1; i >= 0; i--) {
          const carrot = g.carrotItems[i];
          carrot.x -= g.speed * dt;

          // Check pickup
          const distToBunny = Math.hypot(carrot.x - 88, carrot.y - (g.bunnyY - 14));
          if (distToBunny < 26 && !carrot.collected) {
            carrot.collected = true;
            g.carrots += 1;
            setCarrotsThisRun(g.carrots);
            sound.playCarrot();

            // Sparkles
            for (let p = 0; p < 4; p++) {
              g.particles.push({
                x: carrot.x,
                y: carrot.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                color: '#F97316',
                alpha: 1,
                size: 3
              });
            }
          }

          if (carrot.x < -40 || carrot.collected) {
            g.carrotItems.splice(i, 1);
          }
        }

        // Dust particles when running on ground
        if (g.isGrounded && Math.random() < 0.3) {
          g.particles.push({
            x: 75,
            y: groundY + 4,
            vx: -g.speed * 0.3 * dt - Math.random() * 2,
            vy: -Math.random() * 2,
            color: '#A3E635',
            alpha: 0.6,
            size: 2.5
          });
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
      ctx.clearRect(0, 0, 480, 520);

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, 520);
      sky.addColorStop(0, '#7DD3FC');
      sky.addColorStop(0.7, '#FEF08A');
      sky.addColorStop(1, '#86EFAC');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 480, 520);

      // Distant rolling hills (parallax)
      const hillOffset = (timestamp * 0.04) % 480;
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath();
      ctx.ellipse(240 - hillOffset, 440, 320, 100, 0, 0, Math.PI * 2);
      ctx.ellipse(720 - hillOffset, 440, 320, 100, 0, 0, Math.PI * 2);
      ctx.fill();

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      const cloudX = (timestamp * 0.02) % 600 - 80;
      ctx.beginPath();
      ctx.arc(cloudX, 80, 26, 0, Math.PI * 2);
      ctx.arc(cloudX + 26, 70, 34, 0, Math.PI * 2);
      ctx.arc(cloudX + 54, 80, 24, 0, Math.PI * 2);
      ctx.fill();

      // Ground plane
      ctx.fillStyle = '#15803D';
      ctx.fillRect(0, 420, 480, 100);

      ctx.fillStyle = '#166534';
      ctx.fillRect(0, 428, 480, 92);

      // Moving grass texture stripes
      const grassOffset = (timestamp * (g.speed * 0.001)) % 32;
      ctx.fillStyle = '#22C55E';
      for (let gx = -grassOffset; gx < 480; gx += 28) {
        ctx.beginPath();
        ctx.moveTo(gx, 420);
        ctx.lineTo(gx + 4, 414);
        ctx.lineTo(gx + 8, 420);
        ctx.fill();
      }

      // Draw Carrots
      g.carrotItems.forEach(c => {
        ctx.fillStyle = '#F97316';
        ctx.beginPath();
        ctx.moveTo(c.x, c.y - 8);
        ctx.lineTo(c.x + 12, c.y - 8);
        ctx.lineTo(c.x + 6, c.y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.ellipse(c.x + 6, c.y - 10, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Obstacles
      g.obstacles.forEach(obs => {
        const oy = 420 - obs.height;
        if (obs.type === 'fence') {
          ctx.fillStyle = '#D97706';
          ctx.fillRect(obs.x, oy, obs.width, obs.height);
          ctx.fillStyle = '#92400E';
          ctx.fillRect(obs.x + 3, oy + 4, obs.width - 6, 4);
          ctx.fillRect(obs.x + 3, oy + 16, obs.width - 6, 4);
        } else if (obs.type === 'log') {
          ctx.fillStyle = '#78350F';
          ctx.beginPath();
          ctx.roundRect(obs.x, oy, obs.width, obs.height, 6);
          ctx.fill();
          ctx.fillStyle = '#B45309';
          ctx.beginPath();
          ctx.arc(obs.x + obs.width - 4, oy + obs.height / 2, obs.height / 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === 'hedgehog') {
          ctx.fillStyle = '#451A03';
          ctx.beginPath();
          ctx.ellipse(obs.x + 12, oy + 12, 12, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          for (let s = 0; s < 4; s++) {
            ctx.beginPath();
            ctx.moveTo(obs.x + 3 + s * 5, oy + 10);
            ctx.lineTo(obs.x + 6 + s * 5, oy);
            ctx.lineTo(obs.x + 9 + s * 5, oy + 10);
            ctx.fill();
          }
        }
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

      // Draw Player Bunny
      const bx = 88;
      const by = g.bunnyY;
      const { fur, belly, innerEar, nose, eyes, cheeks } = activeSkin.colors;

      ctx.save();
      ctx.translate(bx, by);

      // Running tilt & leg bounce
      const legBob = Math.sin(timestamp * 0.02) * 4;
      if (!g.isGrounded) ctx.rotate(-0.15);

      // Bunny body
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(0, -12, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Belly
      ctx.fillStyle = belly;
      ctx.beginPath();
      ctx.ellipse(3, -10, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.arc(6, -26, 13, 0, Math.PI * 2);
      ctx.fill();

      // Cheeks
      ctx.fillStyle = cheeks;
      ctx.beginPath();
      ctx.arc(12, -23, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Ears blowing back in the wind
      ctx.save();
      ctx.translate(-2, -36);
      ctx.rotate(-0.35);
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(-6, -6, 4.5, 12, -0.4, 0, Math.PI * 2);
      ctx.ellipse(2, -8, 4.5, 12, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = innerEar;
      ctx.beginPath();
      ctx.ellipse(-6, -6, 2.2, 8, -0.4, 0, Math.PI * 2);
      ctx.ellipse(2, -8, 2.2, 8, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Eyes
      ctx.fillStyle = eyes;
      ctx.beginPath();
      ctx.arc(10, -28, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Nose
      ctx.fillStyle = nose;
      ctx.beginPath();
      ctx.arc(16, -24, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Running legs
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(-6, 2 + legBob, 6, 3.5, 0, 0, Math.PI * 2);
      ctx.ellipse(6, 2 - legBob, 6, 3.5, 0, 0, Math.PI * 2);
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
            <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700/70 block leading-tight">
              Distância
            </span>
            <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
              {distance}m
            </span>
          </div>

          <span className="text-stone-300 font-light" aria-hidden="true">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-lg">🥕</span>
            <span className="text-base font-bold font-mono text-amber-900 tabular-nums">
              +{carrotsThisRun}
            </span>
          </div>
        </div>

        {gameState === 'PLAYING' && (
          <button
            type="button"
            onClick={() => setGameState('PAUSED')}
            className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-amber-100/60 transition-colors"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Canvas */}
      <div 
        className="relative w-full aspect-[480/520] max-h-[520px] bg-sky-200 rounded-3xl overflow-hidden shadow-xl border-4 border-amber-200/90 cursor-pointer touch-none"
        onClick={() => {
          if (gameState === 'PLAYING') handleJump();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          if (gameState === 'PLAYING') handleJump();
        }}
      >
        <canvas
          ref={canvasRef}
          width={480}
          height={520}
          className="w-full h-full object-cover block"
        />

        {/* Start Menu */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl">🏃</span>
            </div>
            <h2 className="text-2xl font-bold font-display mb-1 text-white">
              Corrida no Bosque
            </h2>
            <p className="text-xs text-amber-100 max-w-xs mb-5 leading-relaxed">
              Toque na tela para pular! Toque duas vezes no ar para fazer um pulo duplo!
            </p>

            <button
              type="button"
              onClick={startGame}
              className="flex items-center gap-2 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-sm rounded-2xl shadow-lg transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Começar Corrida
            </button>

            <div className="mt-4 text-xs text-amber-200/90 bg-black/30 px-3 py-1 rounded-full">
              Recorde: {(saveData.highScores?.runner || 0).toLocaleString()} pts
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
            <h3 className="text-2xl font-bold font-display mb-2">Tropeço na Corrida!</h3>

            <div className="w-full max-w-xs bg-stone-900/80 border border-stone-800 rounded-2xl p-4 mb-4 text-left space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Distância Percorrida:</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums text-sm">{distance} metros</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Cenouras Pegas:</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">+{carrotsThisRun} 🥕</span>
              </div>
              <div className="flex justify-between items-center border-t border-stone-800 pt-1.5">
                <span className="text-stone-400">Pontos Totais:</span>
                <span className="font-mono font-bold text-white tabular-nums text-sm">{score.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-48">
              <button
                type="button"
                onClick={startGame}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Correr Novamente
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

      {/* Big Mobile Tap Indicator Button */}
      <div className="mt-3 w-full">
        <button
          type="button"
          onClick={handleJump}
          className="w-full py-3.5 bg-amber-500 active:bg-amber-400 text-stone-950 font-bold text-sm rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          <span>PULAR (OU TOQUE NA TELA)</span>
        </button>
      </div>
    </div>
  );
};

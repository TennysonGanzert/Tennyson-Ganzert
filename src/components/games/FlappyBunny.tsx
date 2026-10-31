import React, { useRef, useEffect, useState, useCallback } from 'react';
import { UserSaveData } from '../../types/game';
import { BUNNY_SKINS, BUNNY_HATS } from '../../utils/constants';
import { sound } from '../../utils/audio';
import { Play, RotateCcw, Pause, Sparkles, Trophy } from 'lucide-react';

interface FlappyBunnyProps {
  saveData: UserSaveData;
  onUpdateSave: (updater: (prev: UserSaveData) => UserSaveData) => void;
  onReturnToHub: () => void;
}

interface Pipe {
  x: number;
  topHeight: number;
  gap: number;
  passed: boolean;
}

export const FlappyBunny: React.FC<FlappyBunnyProps> = ({
  saveData,
  onUpdateSave,
  onReturnToHub
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'>('MENU');
  const [score, setScore] = useState<number>(0);
  const [carrotsWon, setCarrotsWon] = useState<number>(0);
  const [isRecord, setIsRecord] = useState<boolean>(false);

  const activeSkin = BUNNY_SKINS.find(s => s.id === saveData.customization.skin) || BUNNY_SKINS[0];
  const activeHat = BUNNY_HATS.find(h => h.id === saveData.customization.hat) || BUNNY_HATS[0];

  const gameRef = useRef<{
    bunnyY: number;
    bunnyVy: number;
    pipes: Pipe[];
    score: number;
    carrots: number;
    nextPipeDist: number;
    lastTime: number;
    animationId: number | null;
  }>({
    bunnyY: 240,
    bunnyVy: 0,
    pipes: [],
    score: 0,
    carrots: 0,
    nextPipeDist: 100,
    lastTime: 0,
    animationId: null
  });

  const flap = useCallback(() => {
    const g = gameRef.current;
    sound.playJump();
    g.bunnyVy = -320;
  }, []);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.bunnyY = 240;
    g.bunnyVy = -150;
    g.pipes = [];
    g.score = 0;
    g.carrots = 0;
    g.nextPipeDist = 120;
    g.lastTime = 0;

    setScore(0);
    setCarrotsWon(0);
    setIsRecord(false);
    setGameState('PLAYING');
    sound.playJump();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (gameState === 'PLAYING') flap();
        else if (gameState === 'MENU') startGame();
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setGameState(prev => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState, flap, startGame]);

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
        // Bunny gravity
        g.bunnyVy += 820 * dt;
        g.bunnyY += g.bunnyVy * dt;

        // Boundaries check (ceiling or floor)
        if (g.bunnyY < 18 || g.bunnyY > 520) {
          sound.playHurt();
          sound.playGameOver();
          setGameState('GAME_OVER');

          const finalScore = g.score;
          const isNew = finalScore > (saveData.highScores?.flappy || 0);
          setIsRecord(isNew);

          onUpdateSave(prev => ({
            ...prev,
            carrots: prev.carrots + g.carrots,
            totalGames: prev.totalGames + 1,
            highScores: {
              ...prev.highScores,
              flappy: Math.max(prev.highScores?.flappy || 0, finalScore)
            }
          }));
        }

        // Spawn pipes (Sunflowers)
        g.nextPipeDist -= 140 * dt;
        if (g.nextPipeDist <= 0) {
          g.nextPipeDist = 180;
          const gap = 135;
          const topH = 60 + Math.random() * (520 - gap - 120);
          g.pipes.push({
            x: 480,
            topHeight: topH,
            gap,
            passed: false
          });
        }

        // Move pipes & collision
        for (let i = g.pipes.length - 1; i >= 0; i--) {
          const pipe = g.pipes[i];
          pipe.x -= 140 * dt;

          // Check passing for score
          if (!pipe.passed && pipe.x < 110) {
            pipe.passed = true;
            g.score += 1;
            g.carrots += 1;
            setScore(g.score);
            setCarrotsWon(g.carrots);
            sound.playCarrot();
          }

          // Collision check: Bunny at x: 120, y: bunnyY, radius 18
          const bx = 120;
          const by = g.bunnyY;
          const br = 16;

          const inHorizontalRange = bx + br > pipe.x && bx - br < pipe.x + 52;
          const hitTop = by - br < pipe.topHeight;
          const hitBottom = by + br > pipe.topHeight + pipe.gap;

          if (inHorizontalRange && (hitTop || hitBottom)) {
            sound.playHurt();
            sound.playGameOver();
            setGameState('GAME_OVER');

            const finalScore = g.score;
            const isNew = finalScore > (saveData.highScores?.flappy || 0);
            setIsRecord(isNew);

            onUpdateSave(prev => ({
              ...prev,
              carrots: prev.carrots + g.carrots,
              totalGames: prev.totalGames + 1,
              highScores: {
                ...prev.highScores,
                flappy: Math.max(prev.highScores?.flappy || 0, finalScore)
              }
            }));
            break;
          }

          if (pipe.x < -80) {
            g.pipes.splice(i, 1);
          }
        }
      }

      // --- RENDER ---
      ctx.clearRect(0, 0, 480, 540);

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, 540);
      sky.addColorStop(0, '#38BDF8');
      sky.addColorStop(0.7, '#BAE6FD');
      sky.addColorStop(1, '#86EFAC');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 480, 540);

      // Draw Sunflowers / Wooden Barn Obstacles
      g.pipes.forEach(pipe => {
        const pipeW = 52;
        // Top Stem / Fence
        ctx.fillStyle = '#15803D';
        ctx.fillRect(pipe.x, 0, pipeW, pipe.topHeight);
        // Sunflower head hanging at bottom of top stem
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(pipe.x + pipeW / 2, pipe.topHeight, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#78350F';
        ctx.beginPath();
        ctx.arc(pipe.x + pipeW / 2, pipe.topHeight, 9, 0, Math.PI * 2);
        ctx.fill();

        // Bottom Stem
        const bottomY = pipe.topHeight + pipe.gap;
        const bottomH = 540 - bottomY;
        ctx.fillStyle = '#15803D';
        ctx.fillRect(pipe.x, bottomY, pipeW, bottomH);
        // Sunflower head pointing up at top of bottom stem
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(pipe.x + pipeW / 2, bottomY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#78350F';
        ctx.beginPath();
        ctx.arc(pipe.x + pipeW / 2, bottomY, 9, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Player Bunny with Floating Balloons
      const bx = 120;
      const by = g.bunnyY;
      const { fur, belly, innerEar, nose, eyes, cheeks } = activeSkin.colors;

      ctx.save();
      ctx.translate(bx, by);

      // Tilt according to vertical speed
      const tilt = Math.max(-0.4, Math.min(0.5, g.bunnyVy * 0.002));
      ctx.rotate(tilt);

      // Balloons above bunny
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -10); ctx.lineTo(-12, -36);
      ctx.moveTo(0, -10); ctx.lineTo(12, -36);
      ctx.stroke();

      ctx.fillStyle = '#EC4899';
      ctx.beginPath();
      ctx.ellipse(-12, -46, 11, 14, -0.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#A855F7';
      ctx.beginPath();
      ctx.ellipse(12, -46, 11, 14, 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Bunny Body
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = belly;
      ctx.beginPath();
      ctx.ellipse(2, 2, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bunny Head
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.arc(8, -10, 12, 0, Math.PI * 2);
      ctx.fill();

      // Cheeks
      ctx.fillStyle = cheeks;
      ctx.beginPath();
      ctx.arc(12, -7, 3, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(2, -22, 4, 11, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = innerEar;
      ctx.beginPath();
      ctx.ellipse(2, -22, 2, 7, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = eyes;
      ctx.beginPath();
      ctx.arc(11, -12, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Nose
      ctx.fillStyle = nose;
      ctx.beginPath();
      ctx.arc(17, -9, 1.8, 0, Math.PI * 2);
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
    <div className="w-full max-w-md mx-auto flex flex-col items-center select-none touch-manipulation">
      {/* Top HUD - Compact for Mobile */}
      <div className="w-full bg-white/95 backdrop-blur-md border border-amber-200/80 rounded-2xl px-3 py-1.5 sm:px-5 sm:py-2.5 mb-2 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-amber-700/70 block leading-tight">
              Obstáculos
            </span>
            <span className="text-base sm:text-xl font-bold font-mono text-stone-900 tabular-nums">
              {score}
            </span>
          </div>

          <span className="text-stone-300 font-light" aria-hidden="true">|</span>

          <div className="flex items-center gap-1">
            <span className="text-base sm:text-lg">🥕</span>
            <span className="text-sm sm:text-base font-bold font-mono text-amber-900 tabular-nums">
              +{carrotsWon}
            </span>
          </div>
        </div>

        {gameState === 'PLAYING' && (
          <button
            type="button"
            onClick={() => setGameState('PAUSED')}
            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-amber-100/60 transition-colors"
          >
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      {/* Canvas (Portrait Mobile Friendly) */}
      <div 
        className="relative w-full aspect-[480/540] max-h-[58vh] sm:max-h-[540px] bg-sky-200 rounded-3xl overflow-hidden shadow-xl border-4 border-amber-200/90 cursor-pointer touch-none"
        onClick={() => {
          if (gameState === 'PLAYING') flap();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          if (gameState === 'PLAYING') flap();
        }}
      >
        <canvas
          ref={canvasRef}
          width={480}
          height={540}
          className="w-full h-full object-cover block"
        />

        {/* Start Menu */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl">🎈</span>
            </div>
            <h2 className="text-2xl font-bold font-display mb-1 text-white">
              Coelho Balão
            </h2>
            <p className="text-xs text-amber-100 max-w-xs mb-5 leading-relaxed">
              Toque na tela para dar impulsos no ar e passar entre os girassóis gigantes!
            </p>

            <button
              type="button"
              onClick={startGame}
              className="flex items-center gap-2 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-sm rounded-2xl shadow-lg transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Começar Voo
            </button>

            <div className="mt-4 text-xs text-amber-200/90 bg-black/30 px-3 py-1 rounded-full">
              Recorde: {(saveData.highScores?.flappy || 0).toLocaleString()} pontos
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
            <h3 className="text-2xl font-bold font-display mb-2">Bateu no Girassol!</h3>

            <div className="w-full max-w-xs bg-stone-900/80 border border-stone-800 rounded-2xl p-4 mb-4 text-left space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Pontuação:</span>
                <span className="font-mono font-bold text-white tabular-nums text-sm">{score} obstáculos</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Cenouras Ganhas:</span>
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
                Voar Novamente
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

      {/* Big Mobile Flap Button (Always Visible) */}
      <div className="mt-2.5 w-full max-w-md">
        <button
          type="button"
          onClick={flap}
          className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 active:from-amber-500 active:to-orange-500 text-stone-950 font-black text-sm sm:text-base rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 border-2 border-amber-300 ring-2 ring-amber-400/30 cursor-pointer"
        >
          <span className="text-xl">🎈</span>
          <span>IMPULSO NO AR / VOAR (PULAR)</span>
        </button>
      </div>
    </div>
  );
};

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { UserSaveData } from '../../types/game';
import { sound } from '../../utils/audio';
import { Play, RotateCcw, Sparkles, Box, Trophy } from 'lucide-react';

interface HarvestStackerProps {
  saveData: UserSaveData;
  onUpdateSave: (updater: (prev: UserSaveData) => UserSaveData) => void;
  onReturnToHub: () => void;
}

interface StackBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export const HarvestStacker: React.FC<HarvestStackerProps> = ({
  saveData,
  onUpdateSave,
  onReturnToHub
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAME_OVER'>('MENU');
  const [towerHeight, setTowerHeight] = useState<number>(0);
  const [carrotsWon, setCarrotsWon] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [isRecord, setIsRecord] = useState<boolean>(false);

  const BLOCK_HEIGHT = 28;

  const gameRef = useRef<{
    blocks: StackBlock[];
    currentBlock: { x: number; y: number; width: number; speed: number; dir: number; color: string };
    cameraY: number;
    score: number;
    combo: number;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; alpha: number; size: number }>;
    lastTime: number;
    animationId: number | null;
  }>({
    blocks: [],
    currentBlock: { x: 0, y: 0, width: 140, speed: 200, dir: 1, color: '#D97706' },
    cameraY: 0,
    score: 0,
    combo: 0,
    particles: [],
    lastTime: 0,
    animationId: null
  });

  const dropBlock = useCallback(() => {
    const g = gameRef.current;
    if (gameState !== 'PLAYING') return;

    const curr = g.currentBlock;
    const topBlock = g.blocks[g.blocks.length - 1];

    if (!topBlock) return;

    // Check overlap
    const diff = curr.x - topBlock.x;
    const absDiff = Math.abs(diff);

    // Perfect alignment check (< 6px tolerance)
    if (absDiff < 6) {
      sound.playGoldenCarrot();
      curr.x = topBlock.x; // snap
      g.combo += 1;
      setCombo(g.combo);

      // Restore a bit of width on combo streak
      if (g.combo >= 3 && curr.width < 140) {
        curr.width = Math.min(140, curr.width + 10);
      }

      // Sparkles
      for (let i = 0; i < 8; i++) {
        g.particles.push({
          x: curr.x + Math.random() * curr.width,
          y: curr.y,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 3,
          color: '#FACC15',
          alpha: 1,
          size: 4
        });
      }
    } else if (absDiff >= curr.width) {
      // Missed completely: TOWER COLLAPSED!
      sound.playHurt();
      sound.playGameOver();
      setGameState('GAME_OVER');

      const finalScore = g.blocks.length - 1;
      const isNew = finalScore > (saveData.highScores?.stacker || 0);
      setIsRecord(isNew);

      onUpdateSave(prev => ({
        ...prev,
        carrots: prev.carrots + finalScore,
        totalGames: prev.totalGames + 1,
        highScores: {
          ...prev.highScores,
          stacker: Math.max(prev.highScores?.stacker || 0, finalScore)
        }
      }));
      return;
    } else {
      // Sliced overhang
      sound.playCarrot();
      g.combo = 0;
      setCombo(0);

      const newWidth = curr.width - absDiff;
      if (diff > 0) {
        // Dropped to the right
        curr.width = newWidth;
      } else {
        // Dropped to the left
        curr.x = topBlock.x;
        curr.width = newWidth;
      }
    }

    // Place block onto stack
    g.blocks.push({
      x: curr.x,
      y: curr.y,
      width: curr.width,
      height: BLOCK_HEIGHT,
      color: curr.color
    });

    const newHeight = g.blocks.length - 1;
    setTowerHeight(newHeight);
    setCarrotsWon(newHeight);

    // Prepare next swinging block
    const blockColors = ['#D97706', '#EA580C', '#EAB308', '#16A34A', '#0D9488'];
    const nextColor = blockColors[g.blocks.length % blockColors.length];
    const nextSpeed = Math.min(420, 200 + newHeight * 8);

    g.currentBlock = {
      x: 0,
      y: curr.y - BLOCK_HEIGHT,
      width: curr.width,
      speed: nextSpeed,
      dir: Math.random() > 0.5 ? 1 : -1,
      color: nextColor
    };
  }, [gameState, onUpdateSave, saveData.highScores]);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    const baseWidth = 160;
    const baseY = 420;

    g.blocks = [
      { x: (480 - baseWidth) / 2, y: baseY, width: baseWidth, height: BLOCK_HEIGHT, color: '#78350F' }
    ];

    g.currentBlock = {
      x: 40,
      y: baseY - BLOCK_HEIGHT,
      width: baseWidth,
      speed: 210,
      dir: 1,
      color: '#D97706'
    };

    g.cameraY = 0;
    g.score = 0;
    g.combo = 0;
    g.particles = [];
    g.lastTime = 0;

    setTowerHeight(0);
    setCarrotsWon(0);
    setCombo(0);
    setIsRecord(false);
    setGameState('PLAYING');
    sound.playJump();
  }, []);

  // Keyboard Space
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (gameState === 'PLAYING') dropBlock();
        else if (gameState === 'MENU') startGame();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState, dropBlock, startGame]);

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
        // Move swinging block
        const b = g.currentBlock;
        b.x += b.speed * b.dir * dt;

        if (b.x < 10) {
          b.x = 10;
          b.dir = 1;
        } else if (b.x + b.width > 470) {
          b.x = 470 - b.width;
          b.dir = -1;
        }

        // Camera smoothly follows top of the tower
        const targetCamY = Math.max(0, 420 - b.y - 180);
        g.cameraY += (targetCamY - g.cameraY) * 0.1;
      }

      // Update particles
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const pt = g.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= dt * 2;
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

      ctx.save();
      ctx.translate(0, g.cameraY);

      // Base meadow ground
      ctx.fillStyle = '#15803D';
      ctx.fillRect(0, 420 + BLOCK_HEIGHT, 480, 150);

      // Draw Stacked Blocks
      g.blocks.forEach((blk, idx) => {
        ctx.fillStyle = blk.color;
        ctx.beginPath();
        ctx.roundRect(blk.x, blk.y, blk.width, blk.height, 6);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Wooden crate texture or carrots
        if (idx > 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(blk.x + 4, blk.y + 4, blk.width - 8, 3);
        }
      });

      // Draw Current Moving Block
      if (gameState === 'PLAYING') {
        const cb = g.currentBlock;
        ctx.fillStyle = cb.color;
        ctx.beginPath();
        ctx.roundRect(cb.x, cb.y, cb.width, BLOCK_HEIGHT, 6);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Particles
      g.particles.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();

      g.animationId = requestAnimationFrame(loop);
    };

    gameRef.current.animationId = requestAnimationFrame(loop);
    return () => {
      isRunning = false;
      if (gameRef.current.animationId) cancelAnimationFrame(gameRef.current.animationId);
    };
  }, [gameState]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center select-none touch-manipulation">
      {/* Top HUD - Compact for Mobile */}
      <div className="w-full bg-white/95 backdrop-blur-md border border-amber-200/80 rounded-2xl px-3 py-1.5 sm:px-5 sm:py-2.5 mb-2 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-amber-700/70 block leading-tight">
              Andares
            </span>
            <span className="text-base sm:text-xl font-bold font-mono text-stone-900 tabular-nums">
              {towerHeight}
            </span>
          </div>

          <span className="text-stone-300 font-light" aria-hidden="true">|</span>

          {combo > 1 && (
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full animate-bounce">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PERFEITO x{combo}</span>
            </div>
          )}
        </div>

        <div className="text-right">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-stone-400 block leading-tight">
            Cenouras
          </span>
          <span className="text-sm sm:text-base font-bold font-mono text-amber-900 tabular-nums">
            +{carrotsWon} 🥕
          </span>
        </div>
      </div>

      {/* Canvas (Portrait Mobile Friendly) */}
      <div 
        className="relative w-full aspect-[480/540] max-h-[58vh] sm:max-h-[500px] bg-sky-200 rounded-3xl overflow-hidden shadow-xl border-4 border-amber-200/90 cursor-pointer touch-none"
        onClick={() => {
          if (gameState === 'PLAYING') dropBlock();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          if (gameState === 'PLAYING') dropBlock();
        }}
      >
        <canvas
          ref={canvasRef}
          width={480}
          height={500}
          className="w-full h-full object-cover block"
        />

        {/* Start Menu */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl">📦</span>
            </div>
            <h2 className="text-2xl font-bold font-display mb-1 text-white">
              Torre da Colheita
            </h2>
            <p className="text-xs text-amber-100 max-w-xs mb-5 leading-relaxed">
              Toque na tela no momento exato em que o caixote estiver alinhado para empilhar com perfeição!
            </p>

            <button
              type="button"
              onClick={startGame}
              className="flex items-center gap-2 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-sm rounded-2xl shadow-lg transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Começar a Construir
            </button>

            <div className="mt-4 text-xs text-amber-200/90 bg-black/30 px-3 py-1 rounded-full">
              Recorde: {(saveData.highScores?.stacker || 0).toLocaleString()} andares
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
            <h3 className="text-2xl font-bold font-display mb-2">A Torre Desmoronou!</h3>

            <div className="w-full max-w-xs bg-stone-900/80 border border-stone-800 rounded-2xl p-4 mb-4 text-left space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Altura da Torre:</span>
                <span className="font-mono font-bold text-white tabular-nums text-sm">{towerHeight} andares</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Cenouras de Recompensa:</span>
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
                Empilhar Novamente
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

      {/* Big Mobile Drop Button (Always Visible) */}
      <div className="mt-2.5 w-full max-w-md">
        <button
          type="button"
          onClick={dropBlock}
          className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 active:from-amber-500 active:to-orange-500 text-stone-950 font-black text-sm sm:text-base rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 border-2 border-amber-300 ring-2 ring-amber-400/30 cursor-pointer"
        >
          <Box className="w-5 h-5 fill-current" />
          <span>SOLTAR CAIXOTE 📦 (TOQUE AQUI)</span>
        </button>
      </div>
    </div>
  );
};

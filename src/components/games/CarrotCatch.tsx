import React, { useRef, useEffect, useState, useCallback } from 'react';
import { UserSaveData } from '../../types/game';
import { BUNNY_SKINS, BUNNY_HATS } from '../../utils/constants';
import { sound } from '../../utils/audio';
import { Play, RotateCcw, Pause, Heart, Sparkles, ArrowLeft, ArrowRight, Trophy } from 'lucide-react';

interface CarrotCatchProps {
  saveData: UserSaveData;
  onUpdateSave: (updater: (prev: UserSaveData) => UserSaveData) => void;
  onReturnToHub: () => void;
}

interface FallingItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  type: 'carrot' | 'golden_carrot' | 'strawberry' | 'clover' | 'rock' | 'hedgehog';
  size: number;
  rotation: number;
  rotSpeed: number;
}

interface CatchParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export const CarrotCatch: React.FC<CarrotCatchProps> = ({
  saveData,
  onUpdateSave,
  onReturnToHub
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'>('MENU');
  const [score, setScore] = useState<number>(0);
  const [carrotsGained, setCarrotsGained] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [lives, setLives] = useState<number>(3);
  const [isRecord, setIsRecord] = useState<boolean>(false);

  const [leftPressed, setLeftPressed] = useState<boolean>(false);
  const [rightPressed, setRightPressed] = useState<boolean>(false);

  const activeSkin = BUNNY_SKINS.find(s => s.id === saveData.customization.skin) || BUNNY_SKINS[0];
  const activeHat = BUNNY_HATS.find(h => h.id === saveData.customization.hat) || BUNNY_HATS[0];

  const gameRef = useRef<{
    playerX: number;
    playerVx: number;
    facing: 'left' | 'right';
    basketWidth: number;
    score: number;
    carrotsCollected: number;
    lives: number;
    combo: number;
    comboTimer: number;
    items: FallingItem[];
    particles: CatchParticle[];
    nextSpawn: number;
    lastTime: number;
    animationId: number | null;
  }>({
    playerX: 400,
    playerVx: 0,
    facing: 'right',
    basketWidth: 84,
    score: 0,
    carrotsCollected: 0,
    lives: 3,
    combo: 1,
    comboTimer: 0,
    items: [],
    particles: [],
    nextSpawn: 0,
    lastTime: 0,
    animationId: null
  });

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.playerX = 400;
    g.playerVx = 0;
    g.score = 0;
    g.carrotsCollected = 0;
    g.lives = 3;
    g.combo = 1;
    g.comboTimer = 0;
    g.items = [];
    g.particles = [];
    g.nextSpawn = 0;
    g.lastTime = 0;

    setScore(0);
    setCarrotsGained(0);
    setCombo(1);
    setLives(3);
    setIsRecord(false);
    setGameState('PLAYING');
    sound.playJump();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setLeftPressed(true);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setRightPressed(true);
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setGameState(prev => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setLeftPressed(false);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setRightPressed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const addParticle = (x: number, y: number, color: string, count = 5) => {
      for (let i = 0; i < count; i++) {
        gameRef.current.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4 - 1,
          color,
          alpha: 1,
          size: 3 + Math.random() * 3
        });
      }
    };

    const loop = (timestamp: number) => {
      if (!isRunning) return;
      const g = gameRef.current;
      if (!g.lastTime) g.lastTime = timestamp;
      const dt = Math.min((timestamp - g.lastTime) / 1000, 0.05);
      g.lastTime = timestamp;

      if (gameState === 'PLAYING') {
        // Player movement
        if (leftPressed) {
          g.playerVx = -360 * dt;
          g.facing = 'left';
        } else if (rightPressed) {
          g.playerVx = 360 * dt;
          g.facing = 'right';
        } else {
          g.playerVx *= 0.8;
        }

        g.playerX += g.playerVx;
        g.playerX = Math.max(35, Math.min(445, g.playerX));

        // Combo timeout
        if (g.comboTimer > 0) {
          g.comboTimer -= dt;
          if (g.comboTimer <= 0) {
            g.combo = 1;
            setCombo(1);
          }
        }

        // Spawn items
        g.nextSpawn -= dt;
        if (g.nextSpawn <= 0) {
          const spawnInterval = Math.max(0.4, 1.2 - Math.min(0.8, g.score / 2000));
          g.nextSpawn = spawnInterval;

          const roll = Math.random();
          let type: FallingItem['type'] = 'carrot';
          let speed = 160 + Math.random() * 80 + Math.min(180, g.score * 0.06);

          if (roll < 0.12) {
            type = 'rock';
            speed += 40;
          } else if (roll < 0.22) {
            type = 'hedgehog';
            speed += 20;
          } else if (roll < 0.32) {
            type = 'strawberry';
          } else if (roll < 0.42) {
            type = 'golden_carrot';
            speed += 60;
          } else if (roll < 0.47) {
            type = 'clover';
          }

          g.items.push({
            id: Math.random(),
            x: 25 + Math.random() * 430,
            y: -20,
            speed,
            type,
            size: type === 'golden_carrot' ? 24 : 20,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 5
          });
        }

        // Update items
        const basketY = 560;
        const basketLeft = g.playerX - g.basketWidth / 2;
        const basketRight = g.playerX + g.basketWidth / 2;

        for (let i = g.items.length - 1; i >= 0; i--) {
          const item = g.items[i];
          item.y += item.speed * dt;
          item.rotation += item.rotSpeed * dt;

          // Catch collision check
          if (item.y >= basketY - 15 && item.y <= basketY + 15 && item.x >= basketLeft && item.x <= basketRight) {
            // CAUGHT!
            if (item.type === 'rock' || item.type === 'hedgehog') {
              // Hurt!
              sound.playHurt();
              g.lives -= 1;
              g.combo = 1;
              setLives(g.lives);
              setCombo(1);
              addParticle(item.x, item.y, '#78350F', 8);

              if (g.lives <= 0) {
                sound.playGameOver();
                setGameState('GAME_OVER');
                const finalScore = g.score;
                const isNew = finalScore > (saveData.highScores?.catch || 0);
                setIsRecord(isNew);
                onUpdateSave(prev => ({
                  ...prev,
                  carrots: prev.carrots + g.carrotsCollected,
                  totalGames: prev.totalGames + 1,
                  highScores: {
                    ...prev.highScores,
                    catch: Math.max(prev.highScores?.catch || 0, finalScore)
                  }
                }));
              }
            } else {
              // Good item caught
              g.combo = Math.min(5, g.combo + 1);
              g.comboTimer = 2.5;
              setCombo(g.combo);

              let points = 10;
              let addedCarrot = 1;

              if (item.type === 'strawberry') {
                points = 25;
                addedCarrot = 2;
                sound.playCarrot();
                addParticle(item.x, item.y, '#EF4444', 6);
              } else if (item.type === 'golden_carrot') {
                points = 60;
                addedCarrot = 5;
                sound.playGoldenCarrot();
                addParticle(item.x, item.y, '#FACC15', 10);
              } else if (item.type === 'clover') {
                points = 100;
                addedCarrot = 8;
                sound.playGoldenCarrot();
                addParticle(item.x, item.y, '#10B981', 8);
              } else {
                points = 15;
                addedCarrot = 1;
                sound.playCarrot();
                addParticle(item.x, item.y, '#F97316', 6);
              }

              const totalPts = points * g.combo;
              g.score += totalPts;
              g.carrotsCollected += addedCarrot;
              setScore(g.score);
              setCarrotsGained(g.carrotsCollected);
            }

            g.items.splice(i, 1);
            continue;
          }

          // Fall off ground
          if (item.y > 640) {
            if (item.type !== 'rock' && item.type !== 'hedgehog') {
              // dropped a veggie: reset combo
              if (g.combo > 1) {
                g.combo = 1;
                setCombo(1);
              }
            }
            g.items.splice(i, 1);
          }
        }
      }

      // Particles
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
      ctx.clearRect(0, 0, 480, 640);

      // Sky Background with rolling clouds
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 640);
      skyGrad.addColorStop(0, '#BAE6FD');
      skyGrad.addColorStop(0.7, '#FEF08A');
      skyGrad.addColorStop(1, '#86EFAC');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 480, 640);

      // Fluffy clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(80, 70, 34, 0, Math.PI * 2);
      ctx.arc(115, 60, 42, 0, Math.PI * 2);
      ctx.arc(150, 70, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(360, 110, 38, 0, Math.PI * 2);
      ctx.arc(400, 100, 46, 0, Math.PI * 2);
      ctx.arc(440, 110, 32, 0, Math.PI * 2);
      ctx.fill();

      // Meadow Hills Ground
      ctx.fillStyle = '#16A34A';
      ctx.beginPath();
      ctx.ellipse(240, 690, 320, 110, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.ellipse(240, 670, 280, 90, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw Falling Items
      g.items.forEach(item => {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);

        if (item.type === 'carrot') {
          ctx.fillStyle = '#F97316';
          ctx.beginPath();
          ctx.moveTo(-7, -10); ctx.lineTo(7, -10); ctx.lineTo(0, 16);
          ctx.closePath();
          ctx.fill();
          // Leaves
          ctx.fillStyle = '#15803D';
          ctx.beginPath();
          ctx.ellipse(0, -13, 3, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'golden_carrot') {
          ctx.shadowColor = '#FACC15';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#EAB308';
          ctx.beginPath();
          ctx.moveTo(-9, -12); ctx.lineTo(9, -12); ctx.lineTo(0, 18);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#84CC16';
          ctx.beginPath();
          ctx.ellipse(0, -15, 4, 8, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'strawberry') {
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(0, 2, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#16A34A';
          ctx.beginPath();
          ctx.ellipse(0, -7, 6, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'clover') {
          ctx.fillStyle = '#10B981';
          for (let c = 0; c < 4; c++) {
            const a = (c * Math.PI) / 2;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * 6, Math.sin(a) * 6, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (item.type === 'rock') {
          ctx.fillStyle = '#52525B';
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#71717A';
          ctx.beginPath();
          ctx.arc(-3, -3, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'hedgehog') {
          ctx.fillStyle = '#78350F';
          ctx.beginPath();
          ctx.arc(0, 0, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#451A03';
          for (let sp = 0; sp < 6; sp++) {
            const a = (sp * Math.PI) / 3;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
            ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18);
            ctx.stroke();
          }
        }
        ctx.restore();
      });

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

      // Draw Player Bunny with Wicker Basket
      const px = g.playerX;
      const py = 575;
      const { fur, belly, innerEar, nose, eyes, cheeks } = activeSkin.colors;

      ctx.save();
      ctx.translate(px, py);
      if (g.facing === 'left') ctx.scale(-1, 1);

      // Bunny Body & Feet
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(0, 10, 18, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = belly;
      ctx.beginPath();
      ctx.ellipse(2, 12, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bunny Head
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.arc(0, -6, 16, 0, Math.PI * 2);
      ctx.fill();

      // Cheeks
      ctx.fillStyle = cheeks;
      ctx.beginPath();
      ctx.arc(-10, -2, 4, 0, Math.PI * 2);
      ctx.arc(10, -2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(-6, -24, 5, 14, -0.1, 0, Math.PI * 2);
      ctx.ellipse(6, -24, 5, 14, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = innerEar;
      ctx.beginPath();
      ctx.ellipse(-6, -23, 2.5, 10, -0.1, 0, Math.PI * 2);
      ctx.ellipse(6, -23, 2.5, 10, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      const isBambi = activeSkin.id === 'bambi';
      if (isBambi) {
        ctx.fillStyle = '#3f3f46';
        ctx.beginPath();
        ctx.arc(-5, -8, 3.6, 0, Math.PI * 2);
        ctx.arc(6, -8, 3.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = isBambi ? '#09090b' : eyes;
      ctx.beginPath();
      ctx.arc(-5, -8, 2.8, 0, Math.PI * 2);
      ctx.arc(6, -8, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(-6, -9, 1, 0, Math.PI * 2);
      ctx.arc(5, -9, 1, 0, Math.PI * 2);
      ctx.fill();

      // Nose
      ctx.fillStyle = nose;
      ctx.beginPath();
      ctx.arc(0, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Paws holding the basket
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(-14, -12, 6, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(14, -12, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wicker Basket Above Bunny Head
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.ellipse(0, -15, 34, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#92400E';
      ctx.beginPath();
      ctx.roundRect(-30, -15, 60, 16, [0, 0, 12, 12]);
      ctx.fill();

      // Wicker weave texture lines
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.5;
      for (let wx = -24; wx <= 24; wx += 8) {
        ctx.beginPath();
        ctx.moveTo(wx, -15);
        ctx.lineTo(wx + 2, 1);
        ctx.stroke();
      }

      ctx.restore();

      gameRef.current.animationId = requestAnimationFrame(loop);
    };

    gameRef.current.animationId = requestAnimationFrame(loop);
    return () => {
      isRunning = false;
      if (gameRef.current.animationId) cancelAnimationFrame(gameRef.current.animationId);
    };
  }, [gameState, leftPressed, rightPressed, activeSkin, activeHat, onUpdateSave, saveData.highScores]);

  // Pointer drag controls on canvas
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = 480 / rect.width;
    const clickX = (e.clientX - rect.left) * scale;
    gameRef.current.playerX = Math.max(35, Math.min(445, clickX));
  };

  return (
    <div className="relative w-full max-w-md mx-auto flex flex-col items-center select-none">
      {/* Top HUD - Compact for Mobile */}
      <div className="w-full bg-white/95 backdrop-blur-md border border-amber-200/80 rounded-2xl px-3 py-1.5 sm:px-5 sm:py-2.5 mb-2 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-amber-700/70 block">
              Pontos
            </span>
            <span className="text-base sm:text-xl font-bold font-mono tabular-nums text-stone-900">
              {score.toLocaleString()}
            </span>
          </div>

          <span className="text-stone-300 font-light" aria-hidden="true">|</span>

          <div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-orange-700/70 block">
              Combo
            </span>
            <span className="text-base sm:text-xl font-bold font-mono tabular-nums text-orange-600">
              {combo}x
            </span>
          </div>

          <span className="text-stone-300 font-light" aria-hidden="true">|</span>

          {/* Lives Hearts */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {[1, 2, 3].map(heartIdx => (
              <Heart
                key={heartIdx}
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  heartIdx <= lives ? 'text-rose-500 fill-rose-500' : 'text-stone-300 fill-stone-200'
                }`}
              />
            ))}
          </div>
        </div>

        {gameState === 'PLAYING' && (
          <button
            onClick={() => setGameState('PAUSED')}
            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-amber-100/60 transition-colors"
          >
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      {/* Canvas Container (Portrait Mobile Friendly) */}
      <div className="relative w-full aspect-[480/640] max-h-[72vh] sm:max-h-[620px] bg-sky-100 rounded-3xl overflow-hidden shadow-xl border-4 border-amber-200/90">
        <canvas
          ref={canvasRef}
          width={480}
          height={640}
          onPointerDown={handlePointerMove}
          onPointerMove={handlePointerMove}
          className="w-full h-full object-cover block cursor-grab active:cursor-grabbing touch-none select-none"
        />

        {/* ON-SCREEN TACTILE TOUCH CONTROLS (Left & Right corner buttons matching user screenshot) */}
        {gameState === 'PLAYING' && (
          <>
            {/* Left Button */}
            <div className="absolute bottom-4 left-4 z-30 select-none touch-none">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLeftPressed(true);
                  setRightPressed(false);
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  setLeftPressed(false);
                }}
                onPointerCancel={(e) => {
                  e.preventDefault();
                  setLeftPressed(false);
                }}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-2xl transition-all backdrop-blur-md cursor-pointer ${
                  leftPressed
                    ? 'bg-amber-500 text-stone-950 scale-95 border-2 border-amber-300 ring-4 ring-amber-400/40'
                    : 'bg-stone-900/80 text-white border-2 border-stone-700/80 hover:bg-stone-800'
                }`}
                aria-label="Mover cesta para a esquerda"
              >
                <ArrowLeft className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
              </button>
            </div>

            {/* Right Button */}
            <div className="absolute bottom-4 right-4 z-30 select-none touch-none">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRightPressed(true);
                  setLeftPressed(false);
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  setRightPressed(false);
                }}
                onPointerCancel={(e) => {
                  e.preventDefault();
                  setRightPressed(false);
                }}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-2xl transition-all backdrop-blur-md cursor-pointer ${
                  rightPressed
                    ? 'bg-amber-500 text-stone-950 scale-95 border-2 border-amber-300 ring-4 ring-amber-400/40'
                    : 'bg-stone-900/80 text-white border-2 border-stone-700/80 hover:bg-stone-800'
                }`}
                aria-label="Mover cesta para a direita"
              >
                <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
              </button>
            </div>
          </>
        )}

        {/* Start Menu */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-20 h-20 mb-3 bg-amber-100 rounded-full flex items-center justify-center shadow-lg border-2 border-amber-300">
              <span className="text-4xl">🧺</span>
            </div>
            <h2 className="text-3xl font-extrabold font-display tracking-tight text-white mb-2">
              Chuva de Cenouras
            </h2>
            <p className="text-amber-100/90 text-sm max-w-xs mb-6">
              Mova o coelho com a cestinha para apanhar cenouras e morangos caindo do céu!
            </p>

            <button
              onClick={startGame}
              className="flex items-center gap-2 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-base rounded-2xl shadow-lg transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              Começar a Colheita
            </button>

            <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-200/90 bg-black/30 px-3 py-1 rounded-full">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>Recorde: {(saveData.highScores?.catch || 0).toLocaleString()} pts</span>
            </div>
          </div>
        )}

        {/* Paused */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
            <h3 className="text-2xl font-bold font-display mb-3">Pausa no Pomar</h3>
            <div className="flex flex-col gap-3 w-48">
              <button
                onClick={() => setGameState('PLAYING')}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 font-semibold text-stone-950 rounded-xl"
              >
                Continuar
              </button>
              <button
                onClick={startGame}
                className="w-full py-2.5 bg-stone-700 hover:bg-stone-600 font-semibold text-white rounded-xl"
              >
                Reiniciar
              </button>
            </div>
          </div>
        )}

        {/* Game Over */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
            {isRecord && (
              <div className="mb-2 inline-flex items-center gap-1 text-amber-300 text-xs font-bold uppercase tracking-wider bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/40 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                Novo Recorde!
              </div>
            )}
            <h3 className="text-3xl font-extrabold font-display mb-3">Fim da Colheita</h3>

            <div className="w-full max-w-xs bg-stone-900/80 border border-stone-800 rounded-2xl p-4 mb-5 text-left space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-400">Pontuação:</span>
                <span className="font-mono font-bold text-white tabular-nums text-base">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-400">Cenouras Salvas:</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">+{carrotsGained} 🥕</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full max-w-xs">
              <button
                onClick={startGame}
                className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold rounded-xl shadow-lg transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Jogar Novamente
              </button>
              <button
                onClick={onReturnToHub}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs rounded-xl transition-colors"
              >
                Voltar ao Salão de Jogos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserSaveData } from '../../types/game';
import { sound } from '../../utils/audio';
import { BunnyAvatar } from '../BunnyAvatar';
import { 
  Play, 
  RotateCcw, 
  Star, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';

interface BurrowMazeProps {
  saveData: UserSaveData;
  onUpdateSave: (updater: (prev: UserSaveData) => UserSaveData) => void;
  onReturnToHub: () => void;
}

// 0: empty tunnel, 1: solid rock, 2: soft diggable dirt, 3: carrot, 4: goal chest, 5: sleeping mole
type CellType = 0 | 1 | 2 | 3 | 4 | 5;

interface MazeLevel {
  name: string;
  maxTime: number;
  start: [number, number];
  grid: CellType[][];
}

const MAZE_LEVELS: MazeLevel[] = [
  {
    name: 'Fase 1: Toca da Primavera',
    maxTime: 40,
    start: [1, 1],
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 3, 2, 0, 3, 2, 3, 1],
      [1, 2, 1, 1, 0, 1, 1, 2, 1],
      [1, 0, 3, 0, 2, 0, 3, 0, 1],
      [1, 1, 1, 2, 1, 2, 1, 0, 1],
      [1, 3, 0, 0, 3, 5, 0, 2, 1],
      [1, 2, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 3, 2, 0, 2, 3, 4, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]
  },
  {
    name: 'Fase 2: Gruta dos Cogumelos',
    maxTime: 50,
    start: [1, 1],
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 2, 3, 1, 3, 2, 3, 1],
      [1, 3, 1, 0, 1, 0, 1, 0, 1],
      [1, 2, 1, 0, 0, 5, 1, 2, 1],
      [1, 0, 1, 1, 2, 1, 1, 0, 1],
      [1, 3, 0, 5, 0, 0, 3, 2, 1],
      [1, 2, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 3, 2, 3, 0, 2, 4, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]
  },
  {
    name: 'Fase 3: Tesouro do Rei Coelho',
    maxTime: 60,
    start: [1, 1],
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 3, 1, 3, 2, 0, 3, 1],
      [1, 2, 0, 1, 0, 1, 1, 2, 1],
      [1, 3, 1, 1, 2, 5, 2, 0, 1],
      [1, 0, 0, 3, 0, 1, 0, 3, 1],
      [1, 1, 2, 1, 0, 0, 2, 2, 1],
      [1, 3, 0, 1, 1, 0, 1, 0, 1],
      [1, 2, 3, 0, 2, 3, 2, 4, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]
  }
];

export const BurrowMaze: React.FC<BurrowMazeProps> = ({
  saveData,
  onUpdateSave,
  onReturnToHub
}) => {
  const [levelIndex, setLevelIndex] = useState<number>(0);
  // Initialize grid immediately so it never has 0 height or breaks on mobile
  const [grid, setGrid] = useState<CellType[][]>(() => 
    MAZE_LEVELS[0].grid.map(row => [...row])
  );
  const [playerPos, setPlayerPos] = useState<[number, number]>([1, 1]);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'LEVEL_CLEAR' | 'GAME_OVER'>('MENU');
  const [score, setScore] = useState<number>(0);
  const [carrotsCollected, setCarrotsCollected] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(MAZE_LEVELS[0].maxTime);

  // Touch Swipe tracking refs
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const currentLevel = MAZE_LEVELS[levelIndex];

  // Start/Restart a level
  const initLevel = useCallback((lvlIdx: number) => {
    const lvl = MAZE_LEVELS[lvlIdx];
    setLevelIndex(lvlIdx);
    setGrid(lvl.grid.map(row => [...row]));
    setPlayerPos([...lvl.start]);
    setTimeLeft(lvl.maxTime);
    setGameState('PLAYING');
    sound.playJump();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          sound.playGameOver();
          setGameState('GAME_OVER');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Movement execution
  const executeMove = useCallback((dr: number, dc: number) => {
    setPlayerPos(currPos => {
      setGrid(currGrid => {
        const [r, c] = currPos;
        const nr = r + dr;
        const nc = c + dc;

        if (nr < 0 || nr >= currGrid.length || nc < 0 || nc >= currGrid[0].length) {
          return currGrid;
        }

        const targetCell = currGrid[nr][nc];

        // Solid rock wall: cannot move
        if (targetCell === 1) {
          return currGrid;
        }

        // Soft diggable dirt: dig it!
        if (targetCell === 2) {
          sound.playPet();
          const nextGrid = currGrid.map(row => [...row]);
          nextGrid[nr][nc] = 0;
          setScore(s => s + 5);
          // Update player position
          setTimeout(() => setPlayerPos([nr, nc]), 0);
          return nextGrid;
        }

        // Carrot
        if (targetCell === 3) {
          sound.playCarrot();
          const nextGrid = currGrid.map(row => [...row]);
          nextGrid[nr][nc] = 0;
          setCarrotsCollected(cc => cc + 1);
          setScore(s => s + 25);
          setTimeout(() => setPlayerPos([nr, nc]), 0);
          return nextGrid;
        }

        // Sleeping Mole
        if (targetCell === 5) {
          sound.playHurt();
          setTimeLeft(t => Math.max(1, t - 5));
          return currGrid; // Don't move into mole
        }

        // Goal Chest
        if (targetCell === 4) {
          sound.playGoldenCarrot();
          setScore(s => {
            const finalScore = s + 150;
            onUpdateSave(prev => ({
              ...prev,
              carrots: prev.carrots + 10,
              highScores: {
                ...prev.highScores,
                maze: Math.max(prev.highScores?.maze || 0, finalScore)
              }
            }));
            return finalScore;
          });
          setCarrotsCollected(c => c + 10);
          setGameState('LEVEL_CLEAR');
          setTimeout(() => setPlayerPos([nr, nc]), 0);
          return currGrid;
        }

        // Normal tunnel (0)
        setTimeout(() => setPlayerPos([nr, nc]), 0);
        return currGrid;
      });

      return currPos;
    });
  }, [onUpdateSave]);

  // Direct cell click/tap to walk
  const handleCellClick = (targetR: number, targetC: number) => {
    if (gameState !== 'PLAYING') return;

    const [pr, pc] = playerPos;
    const dr = targetR - pr;
    const dc = targetC - pc;

    // Only allow adjacent moves (orthogonally)
    if (Math.abs(dr) + Math.abs(dc) === 1) {
      executeMove(dr, dc);
    }
  };

  // Touch Swipe handlers on board (Mobile first!)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || gameState !== 'PLAYING') return;
    if (e.changedTouches.length === 0) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const dx = endX - touchStartRef.current.x;
    const dy = endY - touchStartRef.current.y;

    const minDistance = 24; // Minimum swipe distance in px

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minDistance) {
      // Horizontal swipe
      if (dx > 0) executeMove(0, 1); // Right
      else executeMove(0, -1); // Left
    } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > minDistance) {
      // Vertical swipe
      if (dy > 0) executeMove(1, 0); // Down
      else executeMove(-1, 0); // Up
    }

    touchStartRef.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        executeMove(-1, 0);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        executeMove(1, 0);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        executeMove(0, -1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        executeMove(0, 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, executeMove]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center select-none touch-manipulation px-2 sm:px-0">
      {/* Top HUD */}
      <div className="w-full bg-white/95 backdrop-blur-md border border-amber-200/80 rounded-2xl px-4 py-2.5 mb-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-700/70 block leading-tight">
              Fase
            </span>
            <span className="text-sm font-bold text-stone-900 truncate block max-w-[120px]">
              {currentLevel.name.split(':')[1] || currentLevel.name}
            </span>
          </div>

          <span className="text-stone-300 font-light" aria-hidden="true">|</span>

          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700/70 block leading-tight">
              Tempo
            </span>
            <span className={`text-lg font-bold font-mono tabular-nums ${timeLeft < 10 ? 'text-rose-600 animate-pulse' : 'text-emerald-700'}`}>
              {timeLeft}s
            </span>
          </div>

          <span className="text-stone-300 font-light" aria-hidden="true">|</span>

          <div className="flex items-center gap-1">
            <span className="text-base">🥕</span>
            <span className="text-base font-bold font-mono tabular-nums text-amber-900">
              +{carrotsCollected}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 block leading-tight">
            Pontos
          </span>
          <span className="text-base font-bold font-mono tabular-nums text-stone-800">
            {score}
          </span>
        </div>
      </div>

      {/* Main Underground Maze Grid Container */}
      <div 
        className="relative w-full aspect-square bg-[#3E2723] border-4 border-amber-900/40 rounded-3xl p-2.5 sm:p-4 shadow-xl overflow-hidden flex items-center justify-center touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Soil Grid */}
        <div
          className="grid gap-1 w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${grid[0]?.length || 9}, minmax(0, 1fr))`
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isPlayer = playerPos[0] === r && playerPos[1] === c;
              const isAdjacent = Math.abs(playerPos[0] - r) + Math.abs(playerPos[1] - c) === 1;

              return (
                <button
                  type="button"
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`aspect-square rounded-lg flex items-center justify-center relative transition-all duration-100 ${
                    cell === 1
                      ? 'bg-[#2A1810] border border-stone-900/60 shadow-inner' // Rock wall
                      : cell === 2
                      ? 'bg-[#795548] border border-[#5D4037] active:bg-[#6D4C41]' // Soft diggable dirt
                      : 'bg-[#FFF8E7]/90' // Cleared tunnel
                  } ${isAdjacent && gameState === 'PLAYING' ? 'ring-1 ring-amber-300/40 cursor-pointer' : ''}`}
                >
                  {isPlayer ? (
                    <div className="w-full h-full flex items-center justify-center animate-pulse z-10 scale-110">
                      <BunnyAvatar
                        skinId={saveData.customization.skin}
                        hatId={saveData.customization.hat}
                        size={32}
                        animate={false}
                      />
                    </div>
                  ) : cell === 3 ? (
                    <span className="text-base sm:text-lg animate-bounce select-none">🥕</span>
                  ) : cell === 4 ? (
                    <span className="text-lg sm:text-xl animate-pulse select-none">🎁</span>
                  ) : cell === 5 ? (
                    <span className="text-sm select-none" title="Toupeira">🦔</span>
                  ) : cell === 2 ? (
                    <span className="text-[10px] text-amber-200/50 font-bold select-none">~</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        {/* Start Menu Overlay */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-20 animate-in fade-in">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl">🥕</span>
            </div>
            <h2 className="text-2xl font-bold font-display mb-1 text-amber-200">
              Labirinto da Toca
            </h2>
            <p className="text-xs text-stone-300 max-w-xs mb-4 leading-relaxed">
              Deslize o dedo na tela ou use os botões abaixo para cavar a terra fofa (<span className="text-amber-300 font-bold">~</span>), pegar cenouras e alcançar o baú (<span className="text-amber-300">🎁</span>)!
            </p>

            <button
              type="button"
              onClick={() => initLevel(0)}
              className="px-7 py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-sm rounded-2xl shadow-lg transition-all"
            >
              Começar a Cavar! ⛏️
            </button>
          </div>
        )}

        {/* Level Clear Overlay */}
        {gameState === 'LEVEL_CLEAR' && (
          <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-20 animate-in zoom-in-95">
            <div className="flex items-center gap-1 text-amber-400 mb-2">
              <Star className="w-6 h-6 fill-amber-400 animate-bounce" />
              <Star className="w-7 h-7 fill-amber-400 animate-bounce delay-75" />
              <Star className="w-6 h-6 fill-amber-400 animate-bounce delay-150" />
            </div>
            <h3 className="text-2xl font-bold font-display mb-1 text-amber-300">
              Baú do Tesouro Aberto!
            </h3>
            <p className="text-xs text-emerald-300 mb-4 font-semibold">
              +10 Cenouras Bônus adicionadas ao seu saldo!
            </p>

            <div className="flex flex-col gap-2.5 w-52">
              {levelIndex < MAZE_LEVELS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => initLevel(levelIndex + 1)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Próxima Fase ({levelIndex + 2}/3) →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => initLevel(0)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Reiniciar do Início 🏆
                </button>
              )}

              <button
                type="button"
                onClick={onReturnToHub}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl"
              >
                Voltar aos Jogos
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-20 animate-in zoom-in-95">
            <span className="text-3xl mb-2">⏳</span>
            <h3 className="text-xl font-bold font-display mb-1 text-rose-400">
              O Tempo Esgotou!
            </h3>
            <p className="text-xs text-stone-300 mb-4">
              O coelhinho precisou voltar para descansar na toca.
            </p>

            <div className="flex flex-col gap-2 w-48">
              <button
                type="button"
                onClick={() => initLevel(levelIndex)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs rounded-xl"
              >
                Tentar Novamente
              </button>
              <button
                type="button"
                onClick={onReturnToHub}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl"
              >
                Voltar aos Jogos
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile-Optimized Big Tactile D-Pad Controls */}
      <div className="mt-4 w-full flex flex-col items-center select-none">
        <div className="text-[11px] font-medium text-stone-500 mb-2 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          <span>Dica: Deslize o dedo na tela ou toque nas setas</span>
        </div>

        <div className="grid grid-cols-3 gap-2 w-48">
          <div />
          <button
            type="button"
            onClick={() => executeMove(-1, 0)}
            className="w-14 h-14 bg-white active:bg-amber-400 text-stone-800 active:text-stone-950 border-2 border-stone-200 active:border-amber-500 rounded-2xl flex items-center justify-center shadow-md active:scale-90 transition-transform mx-auto"
            aria-label="Cima"
          >
            <ArrowUp className="w-7 h-7 stroke-[2.5]" />
          </button>
          <div />

          <button
            type="button"
            onClick={() => executeMove(0, -1)}
            className="w-14 h-14 bg-white active:bg-amber-400 text-stone-800 active:text-stone-950 border-2 border-stone-200 active:border-amber-500 rounded-2xl flex items-center justify-center shadow-md active:scale-90 transition-transform mx-auto"
            aria-label="Esquerda"
          >
            <ArrowLeft className="w-7 h-7 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => executeMove(1, 0)}
            className="w-14 h-14 bg-white active:bg-amber-400 text-stone-800 active:text-stone-950 border-2 border-stone-200 active:border-amber-500 rounded-2xl flex items-center justify-center shadow-md active:scale-90 transition-transform mx-auto"
            aria-label="Baixo"
          >
            <ArrowDown className="w-7 h-7 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => executeMove(0, 1)}
            className="w-14 h-14 bg-white active:bg-amber-400 text-stone-800 active:text-stone-950 border-2 border-stone-200 active:border-amber-500 rounded-2xl flex items-center justify-center shadow-md active:scale-90 transition-transform mx-auto"
            aria-label="Direita"
          >
            <ArrowRight className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};

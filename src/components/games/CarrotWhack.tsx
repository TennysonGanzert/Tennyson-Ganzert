import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserSaveData } from '../../types/game';
import { sound } from '../../utils/audio';
import { BunnyAvatar } from '../BunnyAvatar';
import { Play, RotateCcw, Sparkles, Trophy, Zap } from 'lucide-react';

interface CarrotWhackProps {
  saveData: UserSaveData;
  onUpdateSave: (updater: (prev: UserSaveData) => UserSaveData) => void;
  onReturnToHub: () => void;
}

type HoleContent = 'empty' | 'bunny' | 'golden_bunny' | 'carrot' | 'fox' | 'hedgehog';

interface HoleState {
  id: number;
  content: HoleContent;
  visible: boolean;
  poppedAt: number;
  hit: boolean;
}

export const CarrotWhack: React.FC<CarrotWhackProps> = ({
  saveData,
  onUpdateSave,
  onReturnToHub
}) => {
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAME_OVER'>('MENU');
  const [score, setScore] = useState<number>(0);
  const [carrotsWon, setCarrotsWon] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [isRecord, setIsRecord] = useState<boolean>(false);

  const [holes, setHoles] = useState<HoleState[]>([
    { id: 0, content: 'empty', visible: false, poppedAt: 0, hit: false },
    { id: 1, content: 'empty', visible: false, poppedAt: 0, hit: false },
    { id: 2, content: 'empty', visible: false, poppedAt: 0, hit: false },
    { id: 3, content: 'empty', visible: false, poppedAt: 0, hit: false },
    { id: 4, content: 'empty', visible: false, poppedAt: 0, hit: false },
    { id: 5, content: 'empty', visible: false, poppedAt: 0, hit: false },
    { id: 6, content: 'empty', visible: false, poppedAt: 0, hit: false },
    { id: 7, content: 'empty', visible: false, poppedAt: 0, hit: false },
    { id: 8, content: 'empty', visible: false, poppedAt: 0, hit: false },
  ]);

  const scoreRef = useRef(0);
  const carrotsRef = useRef(0);
  const comboRef = useRef(1);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    carrotsRef.current = 0;
    comboRef.current = 1;
    setScore(0);
    setCarrotsWon(0);
    setCombo(1);
    setTimeLeft(35);
    setIsRecord(false);
    setGameState('PLAYING');
    sound.playJump();
  }, []);

  // Main countdown timer
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          sound.playGameOver();
          setGameState('GAME_OVER');

          const finalScore = scoreRef.current;
          const isNew = finalScore > (saveData.highScores?.whack || 0);
          setIsRecord(isNew);

          onUpdateSave(prev => ({
            ...prev,
            carrots: prev.carrots + carrotsRef.current,
            totalGames: prev.totalGames + 1,
            highScores: {
              ...prev.highScores,
              whack: Math.max(prev.highScores?.whack || 0, finalScore)
            }
          }));

          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, onUpdateSave, saveData.highScores]);

  // Mole pop-up loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const popInterval = setInterval(() => {
      setHoles(prev => {
        // Find an empty hole
        const availableIndices = prev
          .map((h, idx) => (!h.visible ? idx : -1))
          .filter(idx => idx !== -1);

        if (availableIndices.length === 0) return prev;

        const pickIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        const roll = Math.random();

        let content: HoleContent = 'bunny';
        if (roll < 0.15) content = 'golden_bunny';
        else if (roll < 0.35) content = 'carrot';
        else if (roll < 0.5) content = 'fox';
        else if (roll < 0.6) content = 'hedgehog';

        const updated = [...prev];
        updated[pickIdx] = {
          ...updated[pickIdx],
          content,
          visible: true,
          poppedAt: Date.now(),
          hit: false
        };
        return updated;
      });
    }, 550);

    // Auto-hide loop
    const hideInterval = setInterval(() => {
      const now = Date.now();
      setHoles(prev =>
        prev.map(h => {
          if (h.visible && now - h.poppedAt > 1100) {
            return { ...h, visible: false, content: 'empty', hit: false };
          }
          return h;
        })
      );
    }, 200);

    return () => {
      clearInterval(popInterval);
      clearInterval(hideInterval);
    };
  }, [gameState]);

  // Hole Tap Handler
  const handleTapHole = (holeId: number) => {
    if (gameState !== 'PLAYING') return;

    setHoles(prev => {
      const target = prev[holeId];
      if (!target.visible || target.hit) return prev;

      const updated = [...prev];
      updated[holeId] = { ...target, hit: true };

      if (target.content === 'fox' || target.content === 'hedgehog') {
        // Bad tap!
        sound.playHurt();
        comboRef.current = 1;
        setCombo(1);
        scoreRef.current = Math.max(0, scoreRef.current - 20);
        setScore(scoreRef.current);
      } else {
        // Good tap!
        comboRef.current = Math.min(8, comboRef.current + 1);
        setCombo(comboRef.current);

        let pts = 15;
        let cGained = 1;

        if (target.content === 'golden_bunny') {
          pts = 50;
          cGained = 4;
          sound.playGoldenCarrot();
        } else if (target.content === 'carrot') {
          pts = 25;
          cGained = 2;
          sound.playCarrot();
        } else {
          sound.playCarrot();
        }

        const totalPts = pts * comboRef.current;
        scoreRef.current += totalPts;
        carrotsRef.current += cGained;
        setScore(scoreRef.current);
        setCarrotsWon(carrotsRef.current);
      }

      // Hide promptly after hit
      setTimeout(() => {
        setHoles(cur => {
          const c = [...cur];
          c[holeId] = { ...c[holeId], visible: false, content: 'empty', hit: false };
          return c;
        });
      }, 150);

      return updated;
    });
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center select-none">
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
            <span className="text-base sm:text-xl font-bold font-mono tabular-nums text-orange-600 flex items-center gap-0.5">
              <Zap className="w-3.5 h-3.5 fill-current" />
              {combo}x
            </span>
          </div>

          <span className="text-stone-300 font-light" aria-hidden="true">|</span>

          <div className="flex items-center gap-1">
            <span className="text-base sm:text-lg">🥕</span>
            <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-amber-900">
              +{carrotsWon}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-emerald-700/70 block text-right">
            Tempo
          </span>
          <span className={`text-base sm:text-xl font-bold font-mono tabular-nums ${timeLeft < 10 ? 'text-rose-600 animate-pulse' : 'text-emerald-700'}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* 3x3 Holes Meadow Card (Optimized for Mobile Portrait) */}
      <div className="relative w-full aspect-square max-h-[68vh] sm:max-h-[440px] bg-gradient-to-b from-emerald-100 via-emerald-200/70 to-emerald-300 border-4 border-amber-200/90 rounded-3xl p-3 sm:p-5 shadow-xl flex items-center justify-center overflow-hidden">
        {/* Background Meadow flowers */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <span className="absolute top-4 left-6 text-xl">🌼</span>
          <span className="absolute top-6 right-8 text-xl">🌸</span>
          <span className="absolute bottom-6 left-10 text-xl">🍀</span>
          <span className="absolute bottom-4 right-10 text-xl">🌼</span>
        </div>

        {/* 9 Holes Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full h-full max-w-[380px] max-h-[380px] relative z-10">
          {holes.map(hole => {
            return (
              <button
                key={hole.id}
                onClick={() => handleTapHole(hole.id)}
                className="relative bg-amber-950/40 border-4 border-amber-900/60 rounded-full shadow-inner flex items-center justify-center overflow-hidden active:scale-95 transition-transform cursor-pointer"
              >
                {/* Hole Depth Shadow */}
                <div className="absolute inset-x-2 top-2 h-4 bg-black/40 rounded-full blur-xs" />

                {/* Content emerging from hole */}
                {hole.visible && (
                  <div
                    className={`transition-all duration-150 transform ${
                      hole.hit ? 'scale-75 opacity-70' : 'scale-100 animate-in zoom-in-75'
                    }`}
                  >
                    {hole.content === 'bunny' && (
                      <BunnyAvatar
                        skinId={saveData.customization.skin}
                        hatId={saveData.customization.hat}
                        size={64}
                        animate={false}
                      />
                    )}
                    {hole.content === 'golden_bunny' && (
                      <div className="relative">
                        <BunnyAvatar skinId="caramel" hatId="royal_crown" size={68} animate={false} />
                        <span className="absolute -top-1 -right-1 text-xs">✨</span>
                      </div>
                    )}
                    {hole.content === 'carrot' && (
                      <span className="text-4xl drop-shadow-md">🥕</span>
                    )}
                    {hole.content === 'fox' && (
                      <span className="text-4xl drop-shadow-md">🦊</span>
                    )}
                    {hole.content === 'hedgehog' && (
                      <span className="text-4xl drop-shadow-md">🦔</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Start Menu Overlay */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl">🕳️</span>
            </div>
            <h2 className="text-2xl font-bold font-display mb-1">Toca Rápida</h2>
            <p className="text-xs text-amber-100 max-w-xs mb-5">
              Toque nos coelhinhos felizes e cenouras! Não toque na raposa nem nos espinhos!
            </p>

            <button
              onClick={startGame}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-sm rounded-xl shadow-lg transition-all"
            >
              Começar Desafio
            </button>

            <div className="mt-4 text-xs text-amber-200/90 bg-black/30 px-3 py-1 rounded-full">
              Recorde: {(saveData.highScores?.whack || 0).toLocaleString()} pts
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-20">
            {isRecord && (
              <div className="mb-2 inline-flex items-center gap-1 text-amber-300 text-xs font-bold uppercase tracking-wider bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/40 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                Novo Recorde!
              </div>
            )}
            <h3 className="text-2xl font-bold font-display mb-2">Tempo Esgotado!</h3>

            <div className="w-full max-w-xs bg-stone-900/80 border border-stone-800 rounded-2xl p-4 mb-4 text-left space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Pontuação Total:</span>
                <span className="font-mono font-bold text-white tabular-nums text-sm">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Cenouras Ganhas:</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">+{carrotsWon} 🥕</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-48">
              <button
                onClick={startGame}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Jogar Novamente
              </button>
              <button
                onClick={onReturnToHub}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs rounded-xl transition-colors"
              >
                Voltar aos Jogos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

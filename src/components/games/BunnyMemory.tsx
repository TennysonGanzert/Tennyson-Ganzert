import React, { useState, useEffect, useCallback } from 'react';
import { UserSaveData } from '../../types/game';
import { sound } from '../../utils/audio';
import { Play, RotateCcw, Star, Trophy, Sparkles } from 'lucide-react';

interface BunnyMemoryProps {
  saveData: UserSaveData;
  onUpdateSave: (updater: (prev: UserSaveData) => UserSaveData) => void;
  onReturnToHub: () => void;
}

interface MemoryCard {
  id: number;
  pairKey: string;
  icon: string;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_PAIRS = [
  { pairKey: 'bunny_white', icon: '🐰', label: 'Pipoca' },
  { pairKey: 'bunny_caramel', icon: '🐇', label: 'Canela' },
  { pairKey: 'carrot', icon: '🥕', label: 'Cenoura' },
  { pairKey: 'strawberry', icon: '🍓', label: 'Morango' },
  { pairKey: 'clover', icon: '🍀', label: 'Trevo' },
  { pairKey: 'mushroom', icon: '🍄', label: 'Cogumelo' },
  { pairKey: 'crown', icon: '👑', label: 'Coroa' },
  { pairKey: 'water', icon: '💧', label: 'Regador' },
];

export const BunnyMemory: React.FC<BunnyMemoryProps> = ({
  saveData,
  onUpdateSave,
  onReturnToHub
}) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matchesCount, setMatchesCount] = useState<number>(0);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'VICTORY'>('MENU');

  // Initialize fresh card deck
  const startNewGame = useCallback(() => {
    const deck: MemoryCard[] = [];
    let idCounter = 0;

    CARD_PAIRS.forEach(pair => {
      // Add two of each
      deck.push({
        id: idCounter++,
        pairKey: pair.pairKey,
        icon: pair.icon,
        label: pair.label,
        isFlipped: false,
        isMatched: false
      });
      deck.push({
        id: idCounter++,
        pairKey: pair.pairKey,
        icon: pair.icon,
        label: pair.label,
        isFlipped: false,
        isMatched: false
      });
    });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIds([]);
    setMoves(0);
    setMatchesCount(0);
    setTimeSeconds(0);
    setGameState('PLAYING');
    sound.playJump();
  }, []);

  // Timer
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = setInterval(() => {
      setTimeSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Handle card click
  const handleCardClick = (card: MemoryCard) => {
    if (gameState !== 'PLAYING' || card.isFlipped || card.isMatched || flippedIds.length >= 2) {
      return;
    }

    sound.playPet();
    const newFlipped = [...flippedIds, card.id];
    setFlippedIds(newFlipped);

    // Flip card visually
    setCards(prev => prev.map(c => (c.id === card.id ? { ...c, isFlipped: true } : c)));

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const firstCard = cards.find(c => c.id === newFlipped[0]);
      const secondCard = card;

      if (firstCard && firstCard.pairKey === secondCard.pairKey) {
        // MATCH!
        sound.playCarrot();
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === firstCard.id || c.id === secondCard.id
                ? { ...c, isMatched: true }
                : c
            )
          );
          setFlippedIds([]);
          setMatchesCount(m => {
            const nextMatches = m + 1;
            if (nextMatches >= CARD_PAIRS.length) {
              // VICTORY!
              sound.playGoldenCarrot();
              setGameState('VICTORY');
              const finalScore = Math.max(100, 1000 - moves * 25 - timeSeconds * 10);

              onUpdateSave(prev => ({
                ...prev,
                carrots: prev.carrots + 12,
                totalGames: prev.totalGames + 1,
                highScores: {
                  ...prev.highScores,
                  memory: Math.max(prev.highScores?.memory || 0, finalScore)
                }
              }));
            }
            return nextMatches;
          });
        }, 400);
      } else {
        // NO MATCH: flip back after delay
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === firstCard?.id || c.id === secondCard.id
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedIds([]);
        }, 850);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center select-none">
      {/* Top HUD - Compact for Mobile */}
      <div className="w-full bg-white/95 backdrop-blur-md border border-amber-200/80 rounded-2xl px-3 py-1.5 sm:px-5 sm:py-2.5 mb-2 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-amber-700/70 block">
              Jogadas
            </span>
            <span className="text-base sm:text-xl font-bold font-mono tabular-nums text-stone-900">
              {moves}
            </span>
          </div>

          <span className="text-stone-300 font-light" aria-hidden="true">|</span>

          <div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-emerald-700/70 block">
              Pares
            </span>
            <span className="text-base sm:text-xl font-bold font-mono tabular-nums text-emerald-700">
              {matchesCount}/{CARD_PAIRS.length}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-stone-400 block text-right">
            Tempo
          </span>
          <span className="text-base sm:text-xl font-bold font-mono tabular-nums text-stone-800">
            {timeSeconds}s
          </span>
        </div>
      </div>

      {/* Cards Board Card (Optimized for Mobile Portrait) */}
      <div className="relative w-full bg-white border border-stone-200/80 rounded-3xl p-2.5 sm:p-5 shadow-sm min-h-[360px] sm:min-h-[440px] flex items-center justify-center">
        {gameState === 'PLAYING' && (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-[390px]">
            {cards.map(card => {
              const showFace = card.isFlipped || card.isMatched;

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={showFace}
                  className={`aspect-[3/4] rounded-xl sm:rounded-2xl border transition-all flex flex-col items-center justify-center p-1 sm:p-2 text-center cursor-pointer ${
                    card.isMatched
                      ? 'border-emerald-300 bg-emerald-50/70 opacity-75'
                      : showFace
                      ? 'border-amber-400 bg-amber-50 shadow-md ring-2 ring-amber-300/40'
                      : 'border-stone-200 bg-stone-100 hover:border-amber-300 hover:bg-stone-50 active:scale-95 shadow-xs'
                  }`}
                >
                  {showFace ? (
                    <div className="flex flex-col items-center animate-in zoom-in-75 duration-150">
                      <span className="text-2xl sm:text-3xl mb-0.5">{card.icon}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-stone-700 truncate max-w-full">
                        {card.label}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center opacity-40">
                      <span className="text-xl sm:text-2xl">🥕</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Start Menu Overlay */}
        {gameState === 'MENU' && (
          <div className="flex flex-col items-center text-center p-6 text-stone-800">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl">🃏</span>
            </div>
            <h2 className="text-2xl font-bold font-display mb-1">Memória dos Coelhinhos</h2>
            <p className="text-xs text-stone-500 max-w-xs mb-5">
              Vire as cartas e encontre todos os pares de coelhos, cenouras e trevos!
            </p>

            <button
              onClick={startNewGame}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-sm rounded-xl shadow-xs transition-all"
            >
              Começar Jogo da Memória
            </button>
          </div>
        )}

        {/* Victory Screen Overlay */}
        {gameState === 'VICTORY' && (
          <div className="flex flex-col items-center text-center p-6 text-stone-800">
            <div className="flex items-center gap-1 text-amber-500 mb-2">
              <Star className="w-7 h-7 fill-amber-400" />
              <Star className="w-8 h-8 fill-amber-400" />
              <Star className="w-7 h-7 fill-amber-400" />
            </div>
            <h3 className="text-2xl font-bold font-display mb-1">Parabéns!</h3>
            <p className="text-xs text-stone-500 mb-2">Você encontrou todos os pares em {moves} jogadas!</p>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-5">
              +12 Cenouras adicionadas ao seu saldo! 🥕
            </span>

            <div className="flex flex-col gap-2 w-48">
              <button
                onClick={startNewGame}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                Jogar Novamente
              </button>
              <button
                onClick={onReturnToHub}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl"
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

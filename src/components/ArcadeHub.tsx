import React, { useState } from 'react';
import { GameId, GameCategory, UserSaveData } from '../types/game';
import { MINI_GAMES } from '../utils/constants';
import { BunnyAvatar } from './BunnyAvatar';
import { Play, ArrowRight, Sparkles, Filter } from 'lucide-react';

interface ArcadeHubProps {
  saveData: UserSaveData;
  onSelectGame: (gameId: GameId) => void;
  onGoToBurrow: () => void;
  onGoToCloset: () => void;
  onGoToAdventure?: () => void;
}

export const ArcadeHub: React.FC<ArcadeHubProps> = ({
  saveData,
  onSelectGame,
  onGoToBurrow,
  onGoToCloset,
  onGoToAdventure
}) => {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');

  const filteredGames = MINI_GAMES.filter(g => 
    selectedCategory === 'all' ? true : g.category === selectedCategory
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 select-none touch-manipulation">
      {/* Shortcut to Main Game (Mundo Aberto) */}
      {onGoToAdventure && (
        <div className="p-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="text-3xl">🌍</span>
            <div>
              <div className="font-extrabold text-sm flex items-center justify-center sm:justify-start gap-2">
                <span>Modo Principal: Mundo Aberto</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase font-bold">Oficial</span>
              </div>
              <p className="text-emerald-100 text-xs">
                Explore a floresta e o jardim, atire cenouras e derrote monstros!
              </p>
            </div>
          </div>
          <button
            onClick={onGoToAdventure}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer"
          >
            Entrar no Mundo Aberto 🚀
          </button>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-100 via-orange-50 to-emerald-50 border border-amber-200/80 rounded-3xl p-5 sm:p-7 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-amber-800 tracking-wide uppercase">
            <span>Arcade dos Coelhinhos</span>
            <span aria-hidden="true">·</span>
            <span>10 Jogos Diversos</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-stone-900 tracking-tight">
            Salão de Jogos do Bosque
          </h2>
          <p className="text-stone-600 text-xs sm:text-sm max-w-lg leading-relaxed">
            10 joguinhos variados de ação, reflexos, tiros, pulos e quebra-cabeças! As cenouras ganhas em qualquer jogo acumulam na sua carteira.
          </p>
        </div>

        {/* Bunny Status & Carrots Balance */}
        <div className="flex items-center gap-3.5 bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-amber-200 shadow-2xs shrink-0">
          <div className="cursor-pointer" onClick={onGoToCloset} title="Personalizar Coelhinho">
            <BunnyAvatar
              skinId={saveData.customization.skin}
              hatId={saveData.customization.hat}
              size={58}
              animate={true}
            />
          </div>
          <div>
            <span className="text-[10px] text-stone-500 font-medium block">Cenouras Salvas</span>
            <div className="flex items-center gap-1 text-2xl font-bold font-mono text-amber-900 tabular-nums">
              <span>🥕</span>
              <span>{saveData.carrots.toLocaleString()}</span>
            </div>
            <button
              onClick={onGoToCloset}
              className="text-[10px] font-bold text-amber-700 hover:text-amber-900 hover:underline block"
            >
              Armário de Acessórios →
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl overflow-x-auto max-w-full">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          🌟 Todos (10)
        </button>
        <button
          onClick={() => setSelectedCategory('arcade')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            selectedCategory === 'arcade'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          🕹️ Arcade (2)
        </button>
        <button
          onClick={() => setSelectedCategory('action')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            selectedCategory === 'action'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          ⚡ Ação & Corte (2)
        </button>
        <button
          onClick={() => setSelectedCategory('puzzle')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            selectedCategory === 'puzzle'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          🧩 Puzzle & Memória (3)
        </button>
        <button
          onClick={() => setSelectedCategory('skill')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            selectedCategory === 'skill'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          🎯 Mira & Habilidade (3)
        </button>
      </div>

      {/* Grid of 10 Games */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredGames.map(game => {
          const record = saveData.highScores?.[game.id as GameId] || 0;

          return (
            <div
              key={game.id}
              className="bg-white border border-stone-200/80 hover:border-amber-300 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-3.5 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2.5 mb-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/70 border border-amber-200/60 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                    {game.icon}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block mb-0.5">
                      Jogo {game.number} · {game.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-600 tabular-nums block">
                      {record > 0 ? `${record.toLocaleString()} pts` : 'Sem Recorde'}
                    </span>
                  </div>
                </div>

                <h4 className="text-base font-bold font-display text-stone-900">
                  {game.title}
                </h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed line-clamp-2">
                  {game.shortDesc}
                </p>
              </div>

              <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                <span className="text-[10px] text-stone-400 font-medium truncate max-w-[140px]">
                  {game.genre}
                </span>

                <button
                  type="button"
                  onClick={() => onSelectGame(game.id as GameId)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs rounded-xl shadow-2xs transition-all whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Jogar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

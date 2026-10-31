import React from 'react';

export type AppTab = 'ADVENTURE' | 'ARCADE' | 'GAME' | 'BURROW' | 'CLOSET' | 'STATS';

interface HeaderProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  carrotsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  carrotsCount
}) => {
  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-amber-200/80 sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3 sm:py-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('ADVENTURE')}
          className="text-base sm:text-lg font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="text-xl">🐰</span>
          <span className="font-display font-extrabold text-stone-900">Rabbit Garden</span>
          <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Mundo Aberto
          </span>
        </button>

        {/* Zone 2: Concise single-line text navigation links (desktop) */}
        <nav className="hidden md:flex items-center gap-5 sm:gap-7 text-sm font-medium text-stone-600">
          <button
            onClick={() => onSelectTab('ADVENTURE')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'ADVENTURE'
                ? 'text-amber-700 font-bold underline underline-offset-8 decoration-2 decoration-amber-500'
                : 'hover:text-stone-900'
            }`}
          >
            🌍 Mundo Aberto
          </button>

          <button
            onClick={() => onSelectTab('ARCADE')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'ARCADE' || currentTab === 'GAME'
                ? 'text-amber-700 font-bold underline underline-offset-8 decoration-2 decoration-amber-500'
                : 'hover:text-stone-900'
            }`}
          >
            🎪 Mini-Jogos (10)
          </button>

          <button
            onClick={() => onSelectTab('BURROW')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'BURROW'
                ? 'text-amber-700 font-bold underline underline-offset-8 decoration-2 decoration-amber-500'
                : 'hover:text-stone-900'
            }`}
          >
            🏡 Toca & Horta
          </button>

          <button
            onClick={() => onSelectTab('CLOSET')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'CLOSET'
                ? 'text-amber-700 font-bold underline underline-offset-8 decoration-2 decoration-amber-500'
                : 'hover:text-stone-900'
            }`}
          >
            👒 Armário
          </button>

          <button
            onClick={() => onSelectTab('STATS')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'STATS'
                ? 'text-amber-700 font-bold underline underline-offset-8 decoration-2 decoration-amber-500'
                : 'hover:text-stone-900'
            }`}
          >
            🏆 Recordes
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onSelectTab('ADVENTURE')}
            className="px-3.5 sm:px-4 py-2 text-xs font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span>🥕 {carrotsCount}</span>
            <span aria-hidden="true">·</span>
            <span>Aventura</span>
          </button>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { AppTab } from './Header';
import {
  X,
  ArrowRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  HelpCircle,
  Sparkles,
  Trophy,
  ShoppingBag,
  Home,
  Gamepad2,
  Globe
} from 'lucide-react';

interface SideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  carrotsCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenHelp: () => void;
}

export const SideMenuDrawer: React.FC<SideMenuDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  carrotsCount,
  soundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
  onOpenHelp,
}) => {
  if (!isOpen) return null;

  const handleTabClick = (tab: AppTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex justify-start animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs h-full bg-stone-900 border-r border-amber-500/30 p-4 sm:p-5 flex flex-col justify-between shadow-2xl text-white animate-in slide-in-from-left duration-200 overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐰</span>
              <div>
                <h3 className="font-extrabold font-display text-amber-300 text-sm">
                  Rabbit Garden
                </h3>
                <span className="text-[10px] text-stone-400">Menu Principal</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Fechar Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5 text-xs font-bold">
            {/* 1. Mundo Aberto */}
            <button
              onClick={() => handleTabClick('ADVENTURE')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                currentTab === 'ADVENTURE'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-xs'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🌍</span>
                <span>Mundo Aberto</span>
              </div>
              {currentTab === 'ADVENTURE' ? (
                <span className="text-[10px] bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full uppercase font-black">
                  Ativo
                </span>
              ) : (
                <ArrowRight className="w-4 h-4 text-stone-500" />
              )}
            </button>

            {/* 2. Mini-Jogos Arcade */}
            <button
              onClick={() => handleTabClick('ARCADE')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                currentTab === 'ARCADE' || currentTab === 'GAME'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-xs'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🎪</span>
                <span>Mini-Jogos (10 Modos)</span>
              </div>
              {currentTab === 'ARCADE' || currentTab === 'GAME' ? (
                <span className="text-[10px] bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full uppercase font-black">
                  Ativo
                </span>
              ) : (
                <ArrowRight className="w-4 h-4 text-stone-500" />
              )}
            </button>

            {/* 3. Toca & Horta */}
            <button
              onClick={() => handleTabClick('BURROW')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                currentTab === 'BURROW'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-xs'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🏡</span>
                <span>Toca & Horta</span>
              </div>
              {currentTab === 'BURROW' ? (
                <span className="text-[10px] bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full uppercase font-black">
                  Ativo
                </span>
              ) : (
                <ArrowRight className="w-4 h-4 text-stone-500" />
              )}
            </button>

            {/* 4. Armário & Acessórios */}
            <button
              onClick={() => handleTabClick('CLOSET')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                currentTab === 'CLOSET'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-xs'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">👒</span>
                <span>Armário & Skins</span>
              </div>
              {currentTab === 'CLOSET' ? (
                <span className="text-[10px] bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full uppercase font-black">
                  Ativo
                </span>
              ) : (
                <ArrowRight className="w-4 h-4 text-stone-500" />
              )}
            </button>

            {/* 5. Recordes & Conquistas */}
            <button
              onClick={() => handleTabClick('STATS')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                currentTab === 'STATS'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-xs'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🏆</span>
                <span>Recordes & Medalhas</span>
              </div>
              {currentTab === 'STATS' ? (
                <span className="text-[10px] bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full uppercase font-black">
                  Ativo
                </span>
              ) : (
                <ArrowRight className="w-4 h-4 text-stone-500" />
              )}
            </button>
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-stone-800 pt-3 space-y-2 mt-4">
          {/* Carrots balance */}
          <div className="flex items-center justify-between text-xs text-stone-400 py-1 bg-stone-800/60 px-3 rounded-xl border border-stone-700/50">
            <span>Carteira de Cenouras:</span>
            <span className="font-mono font-bold text-amber-300 text-sm">
              🥕 {carrotsCount.toLocaleString()}
            </span>
          </div>

          {/* Quick toggle controls */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onToggleFullscreen}
              className="py-2 px-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Tela Cheia"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
              <span>{isFullscreen ? 'Janela' : 'Tela Cheia'}</span>
            </button>

            <button
              onClick={onToggleSound}
              className="py-2 px-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Alternar Som"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
              <span>{soundEnabled ? 'Som: On' : 'Som: Off'}</span>
            </button>

            <button
              onClick={() => {
                onOpenHelp();
                onClose();
              }}
              className="py-2 px-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Guia do Jogo"
            >
              <HelpCircle className="w-4 h-4 text-amber-300" />
              <span>Regras</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            Voltar ao Jogo 🐰
          </button>
        </div>
      </div>
    </div>
  );
};

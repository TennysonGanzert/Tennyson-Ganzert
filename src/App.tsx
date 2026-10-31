import React, { useState, useEffect } from 'react';
import { UserSaveData, GameId } from './types/game';
import { loadSaveData, saveUserData } from './utils/storage';
import { AppTab } from './components/Header';
import { sound } from './utils/audio';
import { SideMenuDrawer } from './components/SideMenuDrawer';
import { ArcadeHub } from './components/ArcadeHub';
import { BunnyGame } from './components/BunnyGame';
import { CarrotCatch } from './components/games/CarrotCatch';
import { BurrowMaze } from './components/games/BurrowMaze';
import { CarrotWhack } from './components/games/CarrotWhack';
import { BunnyMemory } from './components/games/BunnyMemory';
import { BunnyRunner } from './components/games/BunnyRunner';
import { FlappyBunny } from './components/games/FlappyBunny';
import { CarrotCannon } from './components/games/CarrotCannon';
import { CarrotSlicer } from './components/games/CarrotSlicer';
import { HarvestStacker } from './components/games/HarvestStacker';
import { BunnyBurrow } from './components/BunnyBurrow';
import { BunnyCloset } from './components/BunnyCloset';
import { BunnyStats } from './components/BunnyStats';
import { RabbitAdventure } from './components/RabbitAdventure';
import { HowToPlayModal } from './components/HowToPlayModal';
import { BunnyAvatar } from './components/BunnyAvatar';
import { BUNNY_SKINS, BUNNY_HATS, MINI_GAMES } from './utils/constants';
import {
  Menu,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCw,
  LayoutGrid,
  Heart,
  Globe,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [saveData, setSaveData] = useState<UserSaveData>(loadSaveData);
  const [currentTab, setCurrentTab] = useState<AppTab>('ADVENTURE');
  const [activeGameId, setActiveGameId] = useState<GameId>('hopper');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [dismissRotatePrompt, setDismissRotatePrompt] = useState<boolean>(false);

  // Auto-save whenever saveData changes
  const handleUpdateSave = (updater: (prev: UserSaveData) => UserSaveData) => {
    setSaveData(prev => {
      const next = updater(prev);
      saveUserData(next);
      return next;
    });
  };

  const handleLaunchGame = (gameId: GameId) => {
    setActiveGameId(gameId);
    setCurrentTab('GAME');
  };

  const activeSkin = BUNNY_SKINS.find(s => s.id === saveData.customization.skin) || BUNNY_SKINS[0];
  const activeHat = BUNNY_HATS.find(h => h.id === saveData.customization.hat) || BUNNY_HATS[0];
  const happiness = saveData.bunnyHappiness[saveData.customization.skin] ?? 70;
  const currentGameMeta = MINI_GAMES.find(g => g.id === activeGameId) || MINI_GAMES[0];

  // Monitor orientation
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 800;
        setIsPortrait(portrait);
      }
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Monitor fullscreen
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        if ('orientation' in screen && 'lock' in (screen.orientation as unknown as { lock: (s: string) => Promise<void> })) {
          try {
            await (screen.orientation as unknown as { lock: (s: string) => Promise<void> }).lock('landscape');
          } catch {
            // Orientation lock fallback
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      // Fullscreen fallback
    }
  };

  const handleToggleSound = () => {
    const next = !saveData.soundEnabled;
    sound.setSoundEnabled(next);
    handleUpdateSave(u => ({ ...u, soundEnabled: next }));
  };

  // Vertical (portrait) games list specified by user
  const VERTICAL_GAMES: GameId[] = ['hopper', 'catch', 'whack', 'memory', 'flappy', 'stacker'];
  const isCurrentGameVertical = currentTab === 'GAME' && VERTICAL_GAMES.includes(activeGameId);
  const isMenuOrOtherTab = currentTab === 'ARCADE' || currentTab === 'BURROW' || currentTab === 'CLOSET' || currentTab === 'STATS';
  const shouldShowRotateAdvice = isPortrait && !dismissRotatePrompt && !isCurrentGameVertical && !isMenuOrOtherTab;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-stone-950 font-sans select-none overflow-hidden flex flex-col text-stone-100">
      {/* GLOBAL ORIENTATION ADVICE (Only for landscape-designed modes, never for vertical games) */}
      {shouldShowRotateAdvice && (
        <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 animate-spin">
            <RotateCw className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-display text-amber-300">
            Vire o celular na Horizontal! 🔄
          </h2>
          <p className="text-stone-300 text-xs max-w-xs leading-relaxed">
            Este modo foi planejado para tela cheia na horizontal. Os jogos verticais (Coelho Saltador, Chuva de Cenouras, Toca Rápida, Memória, Coelho Balão e Torre) abrem normalmente em pé!
          </p>
          <div className="flex flex-col gap-2.5 w-full max-w-xs pt-2">
            <button
              onClick={toggleFullscreen}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 font-bold text-stone-950 text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Girar para Tela Cheia ⛶</span>
            </button>
            <button
              onClick={() => setDismissRotatePrompt(true)}
              className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-xl transition-all cursor-pointer"
            >
              Jogar em Pé / Continuar
            </button>
          </div>
        </div>
      )}

      {/* RENDER CURRENT TAB */}
      {currentTab === 'ADVENTURE' ? (
        <RabbitAdventure
          saveData={saveData}
          activeSkin={activeSkin}
          activeHat={activeHat}
          onUpdateSave={handleUpdateSave}
          onOpenArcade={() => setCurrentTab('ARCADE')}
          onNavigateTab={setCurrentTab}
          onOpenMenu={() => setIsMenuOpen(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900">
          {/* CONSISTENT HORIZONTAL CONSOLE TOP BAR */}
          <header className="w-full h-12 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0 z-20">
            {/* Left: Minimized Menu Trigger & Mode Title */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-bold rounded-xl border border-amber-400/30 transition-all active:scale-95 cursor-pointer shadow-xs"
                aria-label="Abrir Menu Lateral"
              >
                <Menu className="w-4 h-4 text-amber-400" />
                <span className="hidden xs:inline">Menu</span>
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-stone-200">
                {currentTab === 'ARCADE' && (
                  <span className="flex items-center gap-1.5">
                    <span>🎪</span>
                    <span>Mini-Jogos Arcade (10)</span>
                  </span>
                )}
                {currentTab === 'GAME' && (
                  <span className="flex items-center gap-1.5">
                    <span>{currentGameMeta.icon}</span>
                    <span className="truncate max-w-[140px] sm:max-w-none">{currentGameMeta.title}</span>
                  </span>
                )}
                {currentTab === 'BURROW' && (
                  <span className="flex items-center gap-1.5">
                    <span>🏡</span>
                    <span>Toca & Horta do Coelho</span>
                  </span>
                )}
                {currentTab === 'CLOSET' && (
                  <span className="flex items-center gap-1.5">
                    <span>👒</span>
                    <span>Armário & Visual</span>
                  </span>
                )}
                {currentTab === 'STATS' && (
                  <span className="flex items-center gap-1.5">
                    <span>🏆</span>
                    <span>Recordes & Conquistas</span>
                  </span>
                )}
              </div>
            </div>

            {/* Center: Carrots Balance Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-800/80 rounded-full border border-stone-700/60 shadow-xs text-xs font-bold text-amber-300">
              <span>🥕</span>
              <span className="font-mono">{saveData.carrots.toLocaleString()}</span>
            </div>

            {/* Right: Quick Adventure Button & System Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentTab('ADVENTURE')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <span>🌍</span>
                <span>Mundo Aberto</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                title="Tela Cheia"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleToggleSound}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                title="Som"
              >
                {saveData.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
              </button>

              <button
                onClick={() => setIsHelpOpen(true)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                title="Regras"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </header>

          {/* MAIN RESPONSIVE CONTENT AREA */}
          <main className="flex-1 w-full h-[calc(100dvh-48px)] overflow-y-auto px-1.5 sm:px-6 py-1.5 sm:py-4">
            {/* 1. Arcade Hub (10 Games) */}
            {currentTab === 'ARCADE' && (
              <div className="max-w-5xl mx-auto pb-6">
                <ArcadeHub
                  saveData={saveData}
                  onSelectGame={handleLaunchGame}
                  onGoToBurrow={() => setCurrentTab('BURROW')}
                  onGoToCloset={() => setCurrentTab('CLOSET')}
                  onGoToAdventure={() => setCurrentTab('ADVENTURE')}
                />
              </div>
            )}

            {/* 2. Active Mini-Game */}
            {currentTab === 'GAME' && (
              <div className={`w-full mx-auto space-y-2 pb-4 ${isCurrentGameVertical ? 'max-w-lg' : 'max-w-5xl'}`}>
                {/* Responsive Game Switcher Strip */}
                <div className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 rounded-2xl p-1 sm:p-1.5 flex items-center justify-between gap-1.5 sm:gap-2 overflow-x-auto shadow-2xs">
                  <button
                    onClick={() => setCurrentTab('ARCADE')}
                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Todos (10)</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {MINI_GAMES.map(game => {
                      const isActive = activeGameId === game.id;
                      const isVert = VERTICAL_GAMES.includes(game.id as GameId);
                      return (
                        <button
                          key={game.id}
                          onClick={() => setActiveGameId(game.id as GameId)}
                          className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                            isActive
                              ? 'bg-amber-500 text-stone-950 shadow-xs'
                              : 'text-stone-400 hover:text-white hover:bg-stone-800'
                          }`}
                        >
                          <span>{game.icon}</span>
                          <span className="hidden sm:inline">{game.title}</span>
                          {isVert && <span className="text-[9px] text-amber-200 sm:hidden">📱</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Game Container with Companion Column */}
                <div className={isCurrentGameVertical ? 'w-full flex justify-center' : 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'}>
                  {/* Desktop Companion Column (Only shown for non-vertical games on desktop) */}
                  {!isCurrentGameVertical && (
                    <div className="hidden lg:flex lg:col-span-3 flex-col gap-4">
                      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xs flex flex-col items-center text-center">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-2">
                          Seu Coelhinho
                        </span>
                        <div className="w-24 h-24 bg-stone-800 rounded-2xl border border-stone-700/60 p-2 flex items-center justify-center mb-2">
                          <BunnyAvatar
                            skinId={saveData.customization.skin}
                            hatId={saveData.customization.hat}
                            size={80}
                            animate={true}
                          />
                        </div>
                        <h3 className="text-base font-bold text-stone-100 font-display">
                          {activeSkin.name}
                        </h3>
                        <p className="text-xs text-stone-400 mb-3">
                          {activeHat.id !== 'none' ? activeHat.name : 'Sem chapéu'}
                        </p>

                        <div className="w-full pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-stone-400">
                            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                            Felicidade
                          </span>
                          <span className="font-mono font-bold text-amber-300 tabular-nums">{happiness}%</span>
                        </div>

                        <button
                          onClick={() => setCurrentTab('CLOSET')}
                          className="mt-4 w-full py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                          Mudar Visual 👗
                        </button>
                      </div>

                      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-4 shadow-xs space-y-2">
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full inline-block">
                          Jogo {currentGameMeta.number} · {currentGameMeta.genre}
                        </span>
                        <h4 className="text-sm font-bold text-stone-100">
                          {currentGameMeta.title}
                        </h4>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          {currentGameMeta.shortDesc}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Active Game Component */}
                  <div className={isCurrentGameVertical ? 'w-full flex justify-center' : 'col-span-1 lg:col-span-9 flex justify-center'}>
                    {activeGameId === 'hopper' && (
                      <BunnyGame
                        saveData={saveData}
                        onUpdateSave={handleUpdateSave}
                        onGoToBurrow={() => setCurrentTab('BURROW')}
                      />
                    )}
                    {activeGameId === 'catch' && (
                      <CarrotCatch
                        saveData={saveData}
                        onUpdateSave={handleUpdateSave}
                        onReturnToHub={() => setCurrentTab('ARCADE')}
                      />
                    )}
                    {activeGameId === 'maze' && (
                      <BurrowMaze
                        saveData={saveData}
                        onUpdateSave={handleUpdateSave}
                        onReturnToHub={() => setCurrentTab('ARCADE')}
                      />
                    )}
                    {activeGameId === 'whack' && (
                      <CarrotWhack
                        saveData={saveData}
                        onUpdateSave={handleUpdateSave}
                        onReturnToHub={() => setCurrentTab('ARCADE')}
                      />
                    )}
                    {activeGameId === 'memory' && (
                      <BunnyMemory
                        saveData={saveData}
                        onUpdateSave={handleUpdateSave}
                        onReturnToHub={() => setCurrentTab('ARCADE')}
                      />
                    )}
                    {activeGameId === 'runner' && (
                      <BunnyRunner
                        saveData={saveData}
                        onUpdateSave={handleUpdateSave}
                        onReturnToHub={() => setCurrentTab('ARCADE')}
                      />
                    )}
                    {activeGameId === 'flappy' && (
                      <FlappyBunny
                        saveData={saveData}
                        onUpdateSave={handleUpdateSave}
                        onReturnToHub={() => setCurrentTab('ARCADE')}
                      />
                    )}
                    {activeGameId === 'cannon' && (
                      <CarrotCannon
                        saveData={saveData}
                        onUpdateSave={handleUpdateSave}
                        onReturnToHub={() => setCurrentTab('ARCADE')}
                      />
                    )}
                    {activeGameId === 'slicer' && (
                      <CarrotSlicer
                        saveData={saveData}
                        onUpdateSave={handleUpdateSave}
                        onReturnToHub={() => setCurrentTab('ARCADE')}
                      />
                    )}
                    {activeGameId === 'stacker' && (
                      <HarvestStacker
                        saveData={saveData}
                        onUpdateSave={handleUpdateSave}
                        onReturnToHub={() => setCurrentTab('ARCADE')}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Burrow & Garden */}
            {currentTab === 'BURROW' && (
              <div className="max-w-4xl mx-auto pb-6">
                <BunnyBurrow
                  saveData={saveData}
                  onUpdateSave={handleUpdateSave}
                  onPlayGame={() => handleLaunchGame('hopper')}
                />
              </div>
            )}

            {/* 4. Closet & Outfits */}
            {currentTab === 'CLOSET' && (
              <div className="max-w-4xl mx-auto pb-6">
                <BunnyCloset
                  saveData={saveData}
                  onUpdateSave={handleUpdateSave}
                  onPlayGame={() => handleLaunchGame('hopper')}
                />
              </div>
            )}

            {/* 5. Records & Stats */}
            {currentTab === 'STATS' && (
              <div className="max-w-4xl mx-auto pb-6">
                <BunnyStats
                  saveData={saveData}
                  onUpdateSave={handleUpdateSave}
                  onPlayGame={() => handleLaunchGame('hopper')}
                />
              </div>
            )}
          </main>
        </div>
      )}

      {/* UNIFIED SIDE MENU DRAWER (Available in all screens!) */}
      <SideMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        carrotsCount={saveData.carrots}
        soundEnabled={saveData.soundEnabled}
        onToggleSound={handleToggleSound}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* HOW TO PLAY MODAL */}
      <HowToPlayModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}

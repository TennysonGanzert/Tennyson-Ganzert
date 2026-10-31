import React, { useState, useEffect } from 'react';
import { UserSaveData, GardenPlot, CropType, BunnySkinId } from '../types/game';
import { CROPS, BUNNY_SKINS } from '../utils/constants';
import { BunnyAvatar } from './BunnyAvatar';
import { sound } from '../utils/audio';
import { 
  Heart, 
  Sprout, 
  Droplet, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Coins, 
  Plus
} from 'lucide-react';

interface BunnyBurrowProps {
  saveData: UserSaveData;
  onUpdateSave: (updater: (prev: UserSaveData) => UserSaveData) => void;
  onPlayGame: () => void;
}

export const BunnyBurrow: React.FC<BunnyBurrowProps> = ({
  saveData,
  onUpdateSave,
  onPlayGame
}) => {
  const [selectedBunnyId, setSelectedBunnyId] = useState<BunnySkinId>(saveData.customization.skin);
  const [pettingAnimation, setPettingAnimation] = useState<boolean>(false);
  const [selectedCropToPlant, setSelectedCropToPlant] = useState<CropType>('carrot');
  const [, setTimerTick] = useState<number>(0);

  // Interval to update countdown timers for crops
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeBunny = BUNNY_SKINS.find(b => b.id === selectedBunnyId) || BUNNY_SKINS[0];
  const happiness = saveData.bunnyHappiness[selectedBunnyId] ?? 60;

  // Pet the bunny
  const handlePetBunny = () => {
    sound.playPet();
    setPettingAnimation(true);
    setTimeout(() => setPettingAnimation(false), 900);

    onUpdateSave(prev => ({
      ...prev,
      bunnyHappiness: {
        ...prev.bunnyHappiness,
        [selectedBunnyId]: Math.min(100, (prev.bunnyHappiness[selectedBunnyId] || 50) + 4)
      }
    }));
  };

  // Feed the bunny a carrot
  const handleFeedBunny = () => {
    if (saveData.carrots < 1) return;
    sound.playCarrot();
    setPettingAnimation(true);
    setTimeout(() => setPettingAnimation(false), 900);

    onUpdateSave(prev => ({
      ...prev,
      carrots: prev.carrots - 1,
      bunnyHappiness: {
        ...prev.bunnyHappiness,
        [selectedBunnyId]: Math.min(100, (prev.bunnyHappiness[selectedBunnyId] || 50) + 8)
      }
    }));
  };

  // Plant a crop on a plot
  const handlePlant = (plotId: number) => {
    const cropDef = CROPS[selectedCropToPlant];
    if (!cropDef) return;

    if (saveData.carrots < cropDef.seedCost) {
      alert(`Você precisa de ${cropDef.seedCost} cenouras para plantar esta semente!`);
      return;
    }

    sound.playWater();

    const now = Date.now();
    const readyAt = now + cropDef.growthTimeSeconds * 1000;

    onUpdateSave(prev => ({
      ...prev,
      carrots: prev.carrots - cropDef.seedCost,
      gardenPlots: prev.gardenPlots.map(plot => {
        if (plot.id === plotId) {
          return {
            ...plot,
            crop: selectedCropToPlant,
            plantedAt: now,
            readyAt: readyAt,
            watered: true
          };
        }
        return plot;
      })
    }));
  };

  // Water plot to speed up growth
  const handleWater = (plotId: number) => {
    sound.playWater();
    onUpdateSave(prev => ({
      ...prev,
      gardenPlots: prev.gardenPlots.map(plot => {
        if (plot.id === plotId && plot.readyAt && !plot.watered) {
          // Fast-forward by 30%
          const remaining = Math.max(0, plot.readyAt - Date.now());
          return {
            ...plot,
            readyAt: Date.now() + Math.round(remaining * 0.7),
            watered: true
          };
        }
        return plot;
      })
    }));
  };

  // Harvest ready crop
  const handleHarvest = (plot: GardenPlot) => {
    if (!plot.crop) return;
    const cropDef = CROPS[plot.crop];
    if (!cropDef) return;

    sound.playBuy();

    onUpdateSave(prev => ({
      ...prev,
      carrots: prev.carrots + cropDef.yieldCarrots,
      gardenPlots: prev.gardenPlots.map(p => {
        if (p.id === plot.id) {
          return {
            ...p,
            crop: null,
            plantedAt: null,
            readyAt: null,
            watered: false
          };
        }
        return p;
      })
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 select-none">
      {/* Top Welcome / Sanctuary Header */}
      <div className="bg-gradient-to-r from-amber-100 via-orange-50 to-emerald-50 border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-amber-800 tracking-wide uppercase">
            <span>Santuário dos Coelhinhos</span>
            <span aria-hidden="true">·</span>
            <span>Toca & Horta</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-stone-900 tracking-tight">
            Aconchego na Toca
          </h2>
          <p className="text-stone-600 text-sm max-w-md">
            Cuide dos seus coelhinhos com carinho, cultive sementes fresquinhas na horta e colha cenouras crocantes!
          </p>
        </div>

        {/* Currency & Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-amber-200 shadow-xs">
          <div className="text-center sm:text-left">
            <span className="text-xs text-stone-500 font-medium block">Suas Cenouras</span>
            <div className="flex items-center gap-1.5 text-2xl font-bold font-mono text-amber-900 tabular-nums">
              <span>🥕</span>
              <span>{saveData.carrots.toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={onPlayGame}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-sm rounded-xl shadow-sm transition-all whitespace-nowrap"
          >
            Ir Saltar no Jogo 🚀
          </button>
        </div>
      </div>

      {/* Main Grid: Bunny Caring Area & Garden */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Bunny Sanctuary (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm space-y-6">
          {/* Bunny Selector Tabs */}
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-3">
              Escolha o Coelhinho
            </span>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {BUNNY_SKINS.map(skin => {
                const isUnlocked = saveData.unlockedSkins.includes(skin.id);
                const isSelected = selectedBunnyId === skin.id;

                return (
                  <button
                    key={skin.id}
                    onClick={() => {
                      if (isUnlocked) setSelectedBunnyId(skin.id);
                    }}
                    disabled={!isUnlocked}
                    className={`flex flex-col items-center p-2 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 shadow-xs ring-2 ring-amber-500/20'
                        : isUnlocked
                        ? 'border-stone-200 hover:border-amber-300 hover:bg-stone-50'
                        : 'border-dashed border-stone-200 opacity-40 cursor-not-allowed bg-stone-50'
                    }`}
                  >
                    <BunnyAvatar skinId={skin.id} size={40} animate={false} />
                    <span className="text-xs font-medium text-stone-800 mt-1 truncate max-w-full">
                      {skin.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Featured Active Bunny Showcase */}
          <div className="relative bg-gradient-to-b from-amber-50/60 to-orange-50/40 border border-amber-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center overflow-hidden">
            {/* Floating hearts animation on pet */}
            {pettingAnimation && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <span className="text-3xl animate-ping opacity-75">💖</span>
                <span className="absolute text-2xl -translate-y-8 translate-x-6 animate-bounce">✨</span>
              </div>
            )}

            <div className="cursor-pointer transition-transform active:scale-95" onClick={handlePetBunny}>
              <BunnyAvatar
                skinId={selectedBunnyId}
                hatId={selectedBunnyId === saveData.customization.skin ? saveData.customization.hat : 'none'}
                size={140}
                animate={true}
                mood={pettingAnimation ? 'excited' : happiness > 75 ? 'happy' : 'sleepy'}
              />
            </div>

            <h3 className="text-xl font-bold font-display text-stone-900 mt-3">
              {activeBunny.name}
            </h3>
            <p className="text-xs text-stone-500 max-w-xs mt-1">
              {activeBunny.description}
            </p>

            {/* Happiness Level Meter */}
            <div className="w-full mt-4 bg-white p-3 rounded-2xl border border-amber-100 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-stone-600 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  Nível de Felicidade:
                </span>
                <span className="font-mono font-bold text-stone-800 tabular-nums">
                  {happiness}%
                </span>
              </div>
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full transition-all duration-500"
                  style={{ width: `${happiness}%` }}
                />
              </div>
            </div>

            {/* Action Buttons: Fazer Carinho & Alimentar */}
            <div className="flex items-center gap-3 mt-4 w-full">
              <button
                onClick={handlePetBunny}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-all"
              >
                <Heart className="w-4 h-4 fill-rose-500" />
                Fazer Carinho
              </button>

              <button
                onClick={handleFeedBunny}
                disabled={saveData.carrots < 1}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 font-semibold text-xs rounded-xl border transition-all ${
                  saveData.carrots >= 1
                    ? 'bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 border-amber-300'
                    : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                }`}
              >
                <span>🥕</span>
                Alimentar (-1)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Carrot Garden (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-xl font-bold font-display text-stone-900 flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-600" />
                Horta dos Coelhinhos
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Plante sementes, regue as mudas e faça a colheita das delícias do campo.
              </p>
            </div>
          </div>

          {/* Seed Selector Bar */}
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2.5">
              Escolher Semente para Plantar
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.values(CROPS).map(crop => {
                const isSelected = selectedCropToPlant === crop.type;
                const canAfford = saveData.carrots >= crop.seedCost;

                return (
                  <button
                    key={crop.type}
                    onClick={() => setSelectedCropToPlant(crop.type)}
                    className={`flex flex-col items-center text-center p-2.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-2xl mb-1">{crop.icon}</span>
                    <span className="text-xs font-semibold text-stone-800 leading-tight">
                      {crop.name.split(' ')[0]}
                    </span>
                    <span className="text-[11px] text-stone-500 mt-1 font-mono tabular-nums">
                      {crop.growthTimeSeconds}s
                    </span>
                    <span className={`text-[10px] font-bold mt-1 ${canAfford ? 'text-amber-800' : 'text-rose-600'}`}>
                      {crop.seedCost} 🥕
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6 Garden Soil Plots Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {saveData.gardenPlots.map(plot => {
              const now = Date.now();
              const hasCrop = !!plot.crop;
              const cropDef = plot.crop ? CROPS[plot.crop] : null;
              const isReady = hasCrop && plot.readyAt && now >= plot.readyAt;
              const secondsLeft = hasCrop && plot.readyAt ? Math.max(0, Math.ceil((plot.readyAt - now) / 1000)) : 0;
              const progressPct = hasCrop && plot.plantedAt && plot.readyAt
                ? Math.min(100, Math.max(0, Math.round(((now - plot.plantedAt) / (plot.readyAt - plot.plantedAt)) * 100)))
                : 0;

              return (
                <div
                  key={plot.id}
                  className="bg-amber-950/5 border border-amber-900/10 rounded-2xl p-4 flex flex-col items-center justify-between min-h-[160px] relative transition-all"
                >
                  {/* Soil Texture Accent */}
                  <div className="absolute bottom-2 inset-x-3 h-2 bg-amber-900/15 rounded-full" />

                  {/* Empty Plot State */}
                  {!hasCrop ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center my-auto">
                      <div className="w-10 h-10 rounded-full bg-amber-200/60 flex items-center justify-center text-amber-800 mb-2">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-stone-600 mb-2">Canteiro Vazio</span>
                      <button
                        onClick={() => handlePlant(plot.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                      >
                        Plantar 🌱
                      </button>
                    </div>
                  ) : isReady ? (
                    /* Ready to Harvest State */
                    <div className="flex-1 flex flex-col items-center justify-center text-center my-auto">
                      <span className="text-4xl animate-bounce mb-1">
                        {cropDef?.icon}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 mb-0.5">
                        Pronto para Colher!
                      </span>
                      <span className="text-[11px] font-mono text-amber-700 font-semibold mb-2">
                        +{cropDef?.yieldCarrots} 🥕
                      </span>
                      <button
                        onClick={() => handleHarvest(plot)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Colher
                      </button>
                    </div>
                  ) : (
                    /* Growing State with Progress Bar */
                    <div className="flex-1 flex flex-col items-center justify-center text-center w-full my-auto">
                      <span className="text-2xl mb-1 opacity-90 animate-pulse">
                        🌱
                      </span>
                      <span className="text-xs font-semibold text-stone-800 truncate max-w-full">
                        {cropDef?.name}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-stone-500 my-1">
                        <Clock className="w-3 h-3" />
                        <span>{secondsLeft}s restantes</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden my-1">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {/* Optional Watering to speed up */}
                      {!plot.watered ? (
                        <button
                          onClick={() => handleWater(plot.id)}
                          className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200 transition-colors"
                        >
                          <Droplet className="w-3 h-3" />
                          Regar (+30%)
                        </button>
                      ) : (
                        <span className="text-[10px] text-blue-600/80 font-medium mt-1">
                          💧 Regado
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

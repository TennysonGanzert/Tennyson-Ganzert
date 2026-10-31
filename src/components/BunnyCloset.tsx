import React, { useState } from 'react';
import { UserSaveData, BunnySkinId, BunnyHatId, TrailId } from '../types/game';
import { BUNNY_SKINS, BUNNY_HATS, TRAILS } from '../utils/constants';
import { BunnyAvatar } from './BunnyAvatar';
import { sound } from '../utils/audio';
import { Check, Sparkles, ShoppingBag, Palette, Crown } from 'lucide-react';

interface BunnyClosetProps {
  saveData: UserSaveData;
  onUpdateSave: (updater: (prev: UserSaveData) => UserSaveData) => void;
  onPlayGame: () => void;
}

export const BunnyCloset: React.FC<BunnyClosetProps> = ({
  saveData,
  onUpdateSave,
  onPlayGame
}) => {
  const [activeTab, setActiveTab] = useState<'skins' | 'hats' | 'trails'>('hats');

  const { skin, hat, trail } = saveData.customization;

  // Equip or Buy a Skin
  const handleSkinAction = (skinId: BunnySkinId, price: number) => {
    const isUnlocked = saveData.unlockedSkins.includes(skinId);

    if (isUnlocked) {
      sound.playJump();
      onUpdateSave(prev => ({
        ...prev,
        customization: { ...prev.customization, skin: skinId }
      }));
    } else {
      if (saveData.carrots < price) {
        alert(`Você precisa de mais ${price - saveData.carrots} cenouras para desbloquear este coelhinho!`);
        return;
      }
      sound.playBuy();
      onUpdateSave(prev => ({
        ...prev,
        carrots: prev.carrots - price,
        unlockedSkins: [...prev.unlockedSkins, skinId],
        customization: { ...prev.customization, skin: skinId }
      }));
    }
  };

  // Equip or Buy a Hat
  const handleHatAction = (hatId: BunnyHatId, price: number) => {
    const isUnlocked = saveData.unlockedHats.includes(hatId);

    if (isUnlocked) {
      sound.playJump();
      onUpdateSave(prev => ({
        ...prev,
        customization: { ...prev.customization, hat: hatId }
      }));
    } else {
      if (saveData.carrots < price) {
        alert(`Você precisa de mais ${price - saveData.carrots} cenouras para comprar este acessório!`);
        return;
      }
      sound.playBuy();
      onUpdateSave(prev => ({
        ...prev,
        carrots: prev.carrots - price,
        unlockedHats: [...prev.unlockedHats, hatId],
        customization: { ...prev.customization, hat: hatId }
      }));
    }
  };

  // Equip or Buy a Trail
  const handleTrailAction = (trailId: TrailId, price: number) => {
    const isUnlocked = saveData.unlockedTrails.includes(trailId);

    if (isUnlocked) {
      sound.playJump();
      onUpdateSave(prev => ({
        ...prev,
        customization: { ...prev.customization, trail: trailId }
      }));
    } else {
      if (saveData.carrots < price) {
        alert(`Você precisa de mais ${price - saveData.carrots} cenouras para desbloquear este rastro!`);
        return;
      }
      sound.playBuy();
      onUpdateSave(prev => ({
        ...prev,
        carrots: prev.carrots - price,
        unlockedTrails: [...prev.unlockedTrails, trailId],
        customization: { ...prev.customization, trail: trailId }
      }));
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-100 via-rose-50 to-amber-50 border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-amber-800 tracking-wide uppercase">
            <span>Boutique do Reino</span>
            <span aria-hidden="true">·</span>
            <span>Estilo & Acessórios</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-stone-900 tracking-tight">
            Armário & Customização
          </h2>
          <p className="text-stone-600 text-sm max-w-md">
            Personalize seu coelhinho com chapéus elegantes, laços e rastros brilhantes para seus saltos.
          </p>
        </div>

        {/* Currency Display & Action */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-amber-200 shadow-xs">
          <div className="text-center sm:text-left">
            <span className="text-xs text-stone-500 font-medium block">Cenouras Disponíveis</span>
            <div className="flex items-center gap-1.5 text-2xl font-bold font-mono text-amber-900 tabular-nums">
              <span>🥕</span>
              <span>{saveData.carrots.toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={onPlayGame}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-sm rounded-xl shadow-sm transition-all whitespace-nowrap"
          >
            Testar no Jogo 🐰
          </button>
        </div>
      </div>

      {/* Main Grid: Preview on Left, Catalog on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Live Character Showcase (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Visual Atual
          </span>

          <div className="w-full aspect-square max-w-[200px] bg-gradient-to-b from-amber-50 to-stone-100 rounded-3xl border border-amber-200/60 p-4 flex items-center justify-center shadow-inner">
            <BunnyAvatar
              skinId={skin}
              hatId={hat}
              size={150}
              animate={true}
              mood="happy"
            />
          </div>

          <div className="w-full space-y-1">
            <h3 className="text-lg font-bold font-display text-stone-900">
              {BUNNY_SKINS.find(s => s.id === skin)?.name}
            </h3>
            <p className="text-xs text-stone-500">
              {hat !== 'none' ? BUNNY_HATS.find(h => h.id === hat)?.name : 'Sem chapéu'}
            </p>
          </div>

          {/* Active Trail Indicator */}
          <div className="w-full pt-3 border-t border-stone-100 text-xs text-stone-600 flex justify-between items-center">
            <span>Efeito de Salto:</span>
            <span className="font-semibold text-amber-800">
              {TRAILS.find(t => t.id === trail)?.name}
            </span>
          </div>
        </div>

        {/* Right Column: Shop / Tabs Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm space-y-6">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-stone-100 rounded-2xl">
            <button
              onClick={() => setActiveTab('hats')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'hats'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              Chapéus & Acessórios
            </button>

            <button
              onClick={() => setActiveTab('skins')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'skins'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              Coelhinhos (Pelagens)
            </button>

            <button
              onClick={() => setActiveTab('trails')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'trails'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Efeitos de Salto
            </button>
          </div>

          {/* 1. HATS TAB */}
          {activeTab === 'hats' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {BUNNY_HATS.map(item => {
                const isUnlocked = saveData.unlockedHats.includes(item.id);
                const isEquipped = hat === item.id;
                const canAfford = saveData.carrots >= item.price;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isEquipped
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                        : isUnlocked
                        ? 'border-stone-200 bg-white hover:border-amber-300'
                        : 'border-stone-200 bg-stone-50/60'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="w-12 h-12 rounded-xl bg-amber-100/50 flex items-center justify-center overflow-hidden">
                          <BunnyAvatar skinId={skin} hatId={item.id} size={44} animate={false} />
                        </div>

                        {isEquipped ? (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check className="w-3 h-3" /> Em Uso
                          </span>
                        ) : isUnlocked ? (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Adquirido
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 text-xs font-bold font-mono text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md tabular-nums">
                            <span>🥕</span>
                            <span>{item.price}</span>
                          </div>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-stone-900">{item.name}</h4>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100">
                      {isEquipped ? (
                        <button
                          disabled
                          className="w-full py-1.5 text-xs font-semibold text-stone-400 bg-stone-100 rounded-lg cursor-default"
                        >
                          Equipado
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleHatAction(item.id, item.price)}
                          className="w-full py-1.5 text-xs font-bold text-stone-900 bg-stone-100 hover:bg-amber-400 rounded-lg transition-colors"
                        >
                          Equipar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleHatAction(item.id, item.price)}
                          className={`w-full py-1.5 text-xs font-bold rounded-lg transition-all ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 active:scale-95 shadow-xs'
                              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          Comprar por {item.price} 🥕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. SKINS TAB */}
          {activeTab === 'skins' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {BUNNY_SKINS.map(item => {
                const isUnlocked = saveData.unlockedSkins.includes(item.id);
                const isEquipped = skin === item.id;
                const canAfford = saveData.carrots >= item.price;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isEquipped
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                        : isUnlocked
                        ? 'border-stone-200 bg-white hover:border-amber-300'
                        : 'border-stone-200 bg-stone-50/60'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="w-14 h-14 rounded-xl bg-amber-100/50 flex items-center justify-center overflow-hidden">
                          <BunnyAvatar skinId={item.id} hatId="none" size={50} animate={false} />
                        </div>

                        {isEquipped ? (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check className="w-3 h-3" /> Em Uso
                          </span>
                        ) : isUnlocked ? (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Desbloqueado
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 text-xs font-bold font-mono text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md tabular-nums">
                            <span>🥕</span>
                            <span>{item.price}</span>
                          </div>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-stone-900">{item.name}</h4>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100">
                      {isEquipped ? (
                        <button
                          disabled
                          className="w-full py-1.5 text-xs font-semibold text-stone-400 bg-stone-100 rounded-lg cursor-default"
                        >
                          Equipado
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleSkinAction(item.id, item.price)}
                          className="w-full py-1.5 text-xs font-bold text-stone-900 bg-stone-100 hover:bg-amber-400 rounded-lg transition-colors"
                        >
                          Adotar & Equipar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSkinAction(item.id, item.price)}
                          className={`w-full py-1.5 text-xs font-bold rounded-lg transition-all ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 active:scale-95 shadow-xs'
                              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          Desbloquear ({item.price} 🥕)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. TRAILS TAB */}
          {activeTab === 'trails' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {TRAILS.map(item => {
                const isUnlocked = saveData.unlockedTrails.includes(item.id);
                const isEquipped = trail === item.id;
                const canAfford = saveData.carrots >= item.price;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isEquipped
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                        : isUnlocked
                        ? 'border-stone-200 bg-white hover:border-amber-300'
                        : 'border-stone-200 bg-stone-50/60'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-100/50 flex items-center justify-center text-xl">
                          {item.id === 'stars' ? '⭐' : item.id === 'hearts' ? '💖' : item.id === 'carrots' ? '🥕' : item.id === 'rainbow' ? '🌈' : '💨'}
                        </div>

                        {isEquipped ? (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check className="w-3 h-3" /> Em Uso
                          </span>
                        ) : isUnlocked ? (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Adquirido
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 text-xs font-bold font-mono text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md tabular-nums">
                            <span>🥕</span>
                            <span>{item.price}</span>
                          </div>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-stone-900">{item.name}</h4>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100">
                      {isEquipped ? (
                        <button
                          disabled
                          className="w-full py-1.5 text-xs font-semibold text-stone-400 bg-stone-100 rounded-lg cursor-default"
                        >
                          Equipado
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => handleTrailAction(item.id, item.price)}
                          className="w-full py-1.5 text-xs font-bold text-stone-900 bg-stone-100 hover:bg-amber-400 rounded-lg transition-colors"
                        >
                          Equipar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTrailAction(item.id, item.price)}
                          className={`w-full py-1.5 text-xs font-bold rounded-lg transition-all ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 active:scale-95 shadow-xs'
                              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          Comprar por {item.price} 🥕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { UserSaveData } from '../types/game';
import { Trophy, Award, Flame, Compass, RefreshCw, Gamepad2 } from 'lucide-react';
import { INITIAL_SAVE_DATA, saveUserData } from '../utils/storage';
import { MINI_GAMES } from '../utils/constants';

interface BunnyStatsProps {
  saveData: UserSaveData;
  onUpdateSave: (updater: (prev: UserSaveData) => UserSaveData) => void;
  onPlayGame: () => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progressText?: string;
}

export const BunnyStats: React.FC<BunnyStatsProps> = ({
  saveData,
  onUpdateSave,
  onPlayGame
}) => {
  const achievements: Achievement[] = [
    {
      id: 'adventure_guardian',
      title: 'Guardião da Pradaria',
      description: 'Alcance 100 pontos no Mundo Aberto derrotando monstros e coletando cenouras.',
      icon: '🌍',
      unlocked: (saveData.highScores?.adventure || 0) >= 100,
      progressText: `${saveData.highScores?.adventure || 0}/100 pts`
    },
    {
      id: 'first_jump',
      title: 'Primeiro Salto',
      description: 'Dê seu primeiro impulso no céu.',
      icon: '🐾',
      unlocked: saveData.totalJumps > 0,
      progressText: `${Math.min(1, saveData.totalJumps)}/1`
    },
    {
      id: 'height_100',
      title: 'Acima das Copas',
      description: 'Atinja 100 metros de altura no Coelho Saltador.',
      icon: '🌲',
      unlocked: saveData.maxHeight >= 100,
      progressText: `${saveData.maxHeight}/100m`
    },
    {
      id: 'catch_pro',
      title: 'Cesta Mágica',
      description: 'Atinja 300 pontos na Chuva de Cenouras.',
      icon: '🧺',
      unlocked: (saveData.highScores?.catch || 0) >= 300,
      progressText: `${saveData.highScores?.catch || 0}/300 pts`
    },
    {
      id: 'maze_explorer',
      title: 'Explorador da Toca',
      description: 'Alcance 200 pontos no Labirinto subterrâneo.',
      icon: '⛏️',
      unlocked: (saveData.highScores?.maze || 0) >= 200,
      progressText: `${saveData.highScores?.maze || 0}/200 pts`
    },
    {
      id: 'whack_master',
      title: 'Reflexos de Lince',
      description: 'Alcance 300 pontos na Toca Rápida.',
      icon: '⚡',
      unlocked: (saveData.highScores?.whack || 0) >= 300,
      progressText: `${saveData.highScores?.whack || 0}/300 pts`
    },
    {
      id: 'memory_pro',
      title: 'Mente Brilhante',
      description: 'Encontre pares e atinja 400 pontos na Memória.',
      icon: '🧠',
      unlocked: (saveData.highScores?.memory || 0) >= 400,
      progressText: `${saveData.highScores?.memory || 0}/400 pts`
    },
    {
      id: 'runner_pro',
      title: 'Velocista da Pradaria',
      description: 'Atinja 300 metros de corrida sem tropeçar.',
      icon: '🏃',
      unlocked: (saveData.highScores?.runner || 0) >= 300,
      progressText: `${saveData.highScores?.runner || 0}/300 pts`
    },
    {
      id: 'flappy_pilot',
      title: 'Voo Suave',
      description: 'Passe por 5 girassóis com o balão no Voo do Coelhinho.',
      icon: '🎈',
      unlocked: (saveData.highScores?.flappy || 0) >= 5,
      progressText: `${saveData.highScores?.flappy || 0}/5 pts`
    },
    {
      id: 'cannon_sniper',
      title: 'Mira Certeira',
      description: 'Alcance 250 pontos no Canhão de Cenouras.',
      icon: '🎯',
      unlocked: (saveData.highScores?.cannon || 0) >= 250,
      progressText: `${saveData.highScores?.cannon || 0}/250 pts`
    },
    {
      id: 'slicer_ninja',
      title: 'Ninja Vegetal',
      description: 'Fatie 250 vegetais voadores sem detonar bombas.',
      icon: '⚔️',
      unlocked: (saveData.highScores?.slicer || 0) >= 250,
      progressText: `${saveData.highScores?.slicer || 0}/250 pts`
    },
    {
      id: 'stacker_architect',
      title: 'Torre do Celeiro',
      description: 'Empilhe 8 caixas de colheita com perfeição.',
      icon: '📦',
      unlocked: (saveData.highScores?.stacker || 0) >= 8,
      progressText: `${saveData.highScores?.stacker || 0}/8 caixas`
    },
    {
      id: 'collector_50',
      title: 'Banquete de Cenouras',
      description: 'Acumule 50 cenouras no seu saldo.',
      icon: '🥕',
      unlocked: saveData.carrots >= 50,
      progressText: `${saveData.carrots}/50`
    },
    {
      id: 'fashion_bunny',
      title: 'Coelho Elegante',
      description: 'Desbloqueie pelo menos 3 chapéus ou acessórios.',
      icon: '🎩',
      unlocked: saveData.unlockedHats.length >= 3,
      progressText: `${saveData.unlockedHats.length}/3 chapéus`
    },
    {
      id: 'all_bunnies',
      title: 'Família Completa',
      description: 'Adote e desbloqueie todas as 5 raças de coelho.',
      icon: '🐰',
      unlocked: saveData.unlockedSkins.length >= 5,
      progressText: `${Math.min(5, saveData.unlockedSkins.length)}/5 coelhinhos`
    }
  ];

  const handleResetProgress = () => {
    if (confirm('Tem certeza de que deseja reiniciar todo o progresso do jogo? Isso apagará seu recorde e cenouras salvas.')) {
      saveUserData(INITIAL_SAVE_DATA);
      onUpdateSave(() => INITIAL_SAVE_DATA);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-100 via-emerald-50 to-amber-50 border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-emerald-800 tracking-wide uppercase">
            <span>Quadro de Honra</span>
            <span aria-hidden="true">·</span>
            <span>Recordes em Todos os 10 Jogos</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-stone-900 tracking-tight">
            Recordes do Reino
          </h2>
          <p className="text-stone-600 text-sm max-w-md">
            Veja seus recordes individuais em cada mini-game e acompanhe suas medalhas.
          </p>
        </div>

        <button
          onClick={onPlayGame}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-900 font-bold text-sm rounded-xl shadow-sm transition-all whitespace-nowrap"
        >
          Jogar Agora 🚀
        </button>
      </div>

      {/* 10 Mini-Games High Scores Grid */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="text-lg font-bold font-display text-stone-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Recordes por Jogo
          </h3>
          <span className="text-xs text-stone-500">Mundo Aberto + 10 Mini-Jogos</span>
        </div>

        {/* Featured Card for Mundo Aberto (Rabbit Garden) */}
        <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌍</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-stone-900">
                  Mundo Aberto (Rabbit Garden)
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  Jogo Principal
                </span>
              </div>
              <span className="text-xs text-stone-500">
                Monstros derrotados, colheitas e exploração livre
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xl font-bold font-mono text-emerald-800 tabular-nums block">
              {(saveData.highScores?.adventure || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-stone-400">pontos</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {MINI_GAMES.map(game => {
            const score = saveData.highScores?.[game.id] || (game.id === 'hopper' ? saveData.highScore : 0);

            return (
              <div
                key={game.id}
                className="p-3.5 bg-amber-50/50 border border-amber-200/70 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{game.icon}</span>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block truncate max-w-[120px]">
                      {game.title}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      Jogo {game.number}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-bold font-mono text-stone-900 tabular-nums block">
                    {score.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-stone-400">pontos</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* General Stats Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-amber-700 mb-1">
            <span className="text-sm">🥕</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Saldo de Cenouras</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900 tabular-nums">
            {saveData.carrots.toLocaleString()}
          </div>
          <span className="text-[11px] text-stone-400">disponíveis na carteira</span>
        </div>

        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <Compass className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Altitude no Salto</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {saveData.maxHeight}m
          </div>
          <span className="text-[11px] text-stone-400">metros acima do solo</span>
        </div>

        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-rose-600 mb-1">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Total de Partidas</span>
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
            {saveData.totalGames.toLocaleString()}
          </div>
          <span className="text-[11px] text-stone-400">partidas jogadas no arcade</span>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-stone-100 pb-3">
          <h3 className="text-lg font-bold font-display text-stone-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Conquistas Desbloqueáveis
          </h3>
          <span className="text-xs font-medium text-stone-500">
            {achievements.filter(a => a.unlocked).length} de {achievements.length} completas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {achievements.map(ach => (
            <div
              key={ach.id}
              className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all ${
                ach.unlocked
                  ? 'border-amber-300 bg-amber-50/50'
                  : 'border-stone-200 bg-stone-50/60 opacity-60'
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-white border border-amber-200/80 flex items-center justify-center text-2xl shadow-xs shrink-0">
                {ach.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-stone-900 truncate">{ach.title}</h4>
                  {ach.unlocked ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                      Concluída
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-stone-500 tabular-nums shrink-0">
                      {ach.progressText}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-1">{ach.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Data Button */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={handleResetProgress}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-rose-600 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reiniciar dados do jogo
        </button>
      </div>
    </div>
  );
};

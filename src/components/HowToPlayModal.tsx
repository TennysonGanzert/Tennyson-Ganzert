import React from 'react';
import { X, Sparkles, ArrowLeftRight, Shield, Gamepad2 } from 'lucide-react';
import { MINI_GAMES } from '../utils/constants';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <h3 className="text-lg font-bold font-display text-stone-900">
              Guia do Arcade dos Coelhinhos
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-stone-600 leading-relaxed">
          {/* Main Game: Mundo Aberto */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-amber-50 border-2 border-emerald-400/80 rounded-2xl space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 text-stone-900 font-extrabold text-sm">
              <span className="text-2xl">🌍</span>
              <span>Fase 1: O Bosque Ancestral (Mundo Aberto)</span>
            </div>
            <p className="text-stone-700">
              Explore livremente a grande floresta, fazenda e santuário! Colete cenouras pelo mapa para abastecer sua munição, <strong>derrote o lendário Boss Gorgon, o Rei Chifrudo</strong> no Santuário ao Norte e <strong>retorne à fazenda dos animais no canto inferior esquerdo</strong> para resgatar as recompensas e concluir a Fase 1!
            </p>
            <div className="bg-white/80 p-2 rounded-xl space-y-1 text-[11px] text-stone-600">
              <div>👑 <strong>Missão da Fase 1:</strong> Derrotar o chefe Gorgon (20 HP) e depois entrar na fazenda dos animais no canto inferior esquerdo para receber a premiação e concluir a fase!</div>
              <div>🛡️ <strong>Toca Segura:</strong> Entre no círculo da toca para ficar imune a ataques e curar 1 coração a cada 1,5 segundos.</div>
              <div>🎒 <strong>Munição:</strong> Colete cenouras selvagens para abastecer seu disparador. Acerte monstros para ganhar pontos e chances de cenouras extras!</div>
              <div>🎪 <strong>Mini-Jogos Arcade:</strong> Acesse os 10 mini-jogos opcionais a qualquer momento pelo Menu lateral!</div>
            </div>
            <div className="pt-1 text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Controles: Analógico virtual (bolinha) para andar · Botão "Atirar 🥕" ou toque na tela para mirar e disparar!</span>
            </div>
          </div>

          <div className="text-stone-400 font-bold uppercase tracking-wider text-[10px] pt-1">
            Modos Opcionais · Os 10 Mini-Jogos Arcade:
          </div>

          {MINI_GAMES.map(game => (
            <div key={game.id} className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <span className="text-xl">{game.icon}</span>
                <span>{game.number}. {game.title} ({game.badge})</span>
              </div>
              <p className="text-stone-600">{game.fullDesc}</p>
              <div className="pt-1 text-[11px] font-semibold text-amber-800 flex items-center gap-1">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Controles: {game.controlsSummary}</span>
              </div>
            </div>
          ))}

          <div className="p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl space-y-1">
            <div className="flex items-center gap-2 text-emerald-950 font-bold">
              <span className="text-xl">🏡</span>
              <span>Toca & Horta Compartilhada</span>
            </div>
            <p className="text-stone-600">
              Todas as cenouras coletadas em qualquer um dos 10 jogos vão direto para seu cofrinho! Plante vegetais na horta para multiplicar suas cenouras e compre chapéus e roupinhas no Armário para desfilar em todos os jogos.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-stone-950 text-xs rounded-xl shadow-xs transition-all"
        >
          Entendi, Vamos Jogar! 🐰
        </button>
      </div>
    </div>
  );
};

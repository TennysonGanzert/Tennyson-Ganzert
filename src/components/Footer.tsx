import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-stone-200/80 bg-white/60 py-6 px-6 mt-12 text-center text-xs text-stone-500">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-700">Coelho Saltador</span>
          <span aria-hidden="true">·</span>
          <span>Aventuras na Toca & Colheita de Cenouras</span>
        </div>

        <div className="flex items-center gap-4 text-stone-400">
          <span>Feito com carinho para os amantes de coelhos</span>
          <span aria-hidden="true">·</span>
          <span>2026</span>
        </div>
      </div>
    </footer>
  );
};

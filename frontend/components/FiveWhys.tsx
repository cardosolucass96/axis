import React from 'react';
import { ds } from '../styles/design-tokens';

interface FiveWhysProps {
  causes: string[];
  onChange: (index: number, value: string) => void;
}

export const FiveWhys: React.FC<FiveWhysProps> = ({ causes = [], onChange }) => {
  // Ensure we always have 5 slots
  const slots = [0, 1, 2, 3, 4];

  return (
    <div className="space-y-3">
      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">Análise de Causa (5 Porquês)</h4>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Aprofunde-se na causa raiz do problema perguntando "Por quê?" cinco vezes.</p>
      
      {/* Container Background */}
      <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3 transition-colors duration-150">
        {slots.map((index) => (
          <div key={index} className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-full text-sm font-bold text-zinc-700 dark:text-zinc-300 shadow-sm transition-colors duration-150">
              {index + 1}º
            </span>
            <div className="flex-1">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">Por quê?</label>
              <input
                type="text"
                value={causes[index] || ''}
                onChange={(e) => onChange(index, e.target.value)}
                placeholder={index === 0 ? "Motivo inicial..." : "Por causa do anterior..."}
                className={ds.input.sm}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { CharacterState } from '../../types';
import { Heart, Zap, Coffee, Sparkles } from 'lucide-react';

interface StatsDisplayProps {
  state: CharacterState;
}

const ProgressBar: React.FC<{ value: number; color: string; label: string; icon: React.ReactNode }> = ({ value, color, label, icon }) => (
  <div className="flex items-center gap-3">
    <div className="w-[84px] flex items-center gap-1.5 text-[11px] font-bold text-vibrant-dark uppercase">
      <span className="text-vibrant-pink">{icon}</span>
      {label}
    </div>
    <div className="flex-1 h-[12px] bg-white rounded-full border border-vibrant-light-pink overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        style={{ backgroundColor: color }}
        className="h-full rounded-full"
      />
    </div>
    <span className="text-vibrant-accent text-[11px] font-bold w-10 text-right">
      {Math.round(value)}%
    </span>
  </div>
);

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ state }) => {
  return (
    <div className="absolute top-5 left-5 z-20 flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white/90 backdrop-blur-sm border-[3px] border-vibrant-pink rounded-[40px] px-6 py-4 w-72 shadow-[0_8px_20px_rgba(255,105,180,0.2)]"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-vibrant-pink rounded-full border-2 border-white flex items-center justify-center text-white">
            <Sparkles size={20} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-vibrant-dark font-bold text-lg leading-tight">{state.name}</h2>
            <p className="text-vibrant-accent text-xs font-bold">Lv. {state.level} 콜롬비나</p>
          </div>
        </div>

        <div className="space-y-2">
          <ProgressBar value={state.happiness} color="#ff4081" label="호감도" icon={<Heart size={12} />} />
          <ProgressBar value={state.energy} color="#4caf50" label="체력" icon={<Zap size={12} />} />
          <ProgressBar value={state.hunger} color="#ffb300" label="허기" icon={<Coffee size={12} />} />
          <ProgressBar value={state.cleanliness} color="#00bcd4" label="청결도" icon={<Sparkles size={12} />} />
        </div>
        
        <div className="mt-3 bg-vibrant-light-pink/20 rounded-full h-1 w-full overflow-hidden">
          <motion.div 
            animate={{ width: `${state.xp}%` }}
            className="h-full bg-vibrant-pink"
          />
        </div>
      </motion.div>
    </div>
  );
};

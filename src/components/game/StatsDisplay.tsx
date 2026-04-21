/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterState } from '../../types';
import { Heart, Zap, Coffee, Sparkles, Brain, Clock, Book, X } from 'lucide-react';

interface StatsDisplayProps {
  state: CharacterState;
  className?: string;
}

const getTitleForLevel = (level: number) => {
  if (level <= 5) return "넌 누구니?";
  if (level <= 15) return "내 이름은 하나의 호칭일 뿐...";
  if (level <= 25) return "나를 가두는 빈 껍데기이자...";
  if (level <= 35) return "나 자신과는 별개의 것이지";
  if (level <= 45) return "하지만 널 만나면서";
  if (level <= 60) return "이름엔 너의 마음이 담겨 있고";
  if (level <= 75) return "나와 이 세계를 이어주는";
  if (level <= 85) return "연결고리라는 걸...";
  if (level <= 92) return "나, 이 이름...";
  if (level <= 96) return "콜롬비나...";
  if (level <= 99) return "하이포셀레니아...";
  return "소중히 간직할 거야!";
};

const fullMemoryLog = [
  "넌 누구니?",
  "내 이름은 하나의 호칭일 뿐...",
  "나를 가두는 빈 껍데기이자...",
  "나 자신과는 별개의 것이지.",
  "하지만 널 만나면서,",
  "이름엔 너의 마음이 담겨 있고,",
  "나와 이 세계를 이어주는",
  "연결고리라는 걸...",
  "나, 이 이름...",
  "콜롬비나...",
  "하이포셀레니아...",
  "소중히 간직할 거야!"
];

const ProgressBar: React.FC<{ value: number; color: string; label: string; icon: React.ReactNode }> = ({ value, color, label, icon }) => (
  <div className="flex items-center gap-3">
    <div className="w-[84px] flex items-center gap-1.5 text-[11px] font-bold text-vibrant-dark uppercase">
      <span className="text-[12px]" style={{ color }}>{icon}</span>
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
    <span className="text-[11px] font-bold w-10 text-right" style={{ color }}>
      {Math.round(value)}%
    </span>
  </div>
);

const getDynamicTime = (phase: string, ap: number, maxAp: number) => {
  let startMins = 0;
  let durationMins = 0;
  
  switch (phase) {
    case '새벽': startMins = 5 * 60 + 30; durationMins = 120; break; // 05:30 ~ 07:30
    case '아침': startMins = 8 * 60; durationMins = 240; break; // 08:00 ~ 12:00
    case '낮': startMins = 13 * 60; durationMins = 300; break; // 13:00 ~ 18:00
    case '저녁': startMins = 19 * 60; durationMins = 180; break; // 19:00 ~ 22:00
    case '밤': startMins = 22 * 60 + 30; durationMins = 120; break; // 22:30 ~ 24:30
    default: startMins = 12 * 60; durationMins = 60; break;
  }

  const usedAp = Math.max(0, maxAp - ap);
  const safeMax = Math.max(1, maxAp);
  
  // 남은 AP에 비례하여 흘러간 분(minute) 계산
  const elapsedMins = Math.floor((durationMins / safeMax) * usedAp);
  // 자연스러움을 위해 10분 단위로 자름 (예: 13:28 -> 13:20)
  const roundedElapsed = Math.floor(elapsedMins / 10) * 10;
  
  const totalMins = startMins + roundedElapsed;
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ state, className }) => {
  const [showLog, setShowLog] = useState(false);
  
  const titleText = getTitleForLevel(state.level);
  const isTrueName = state.level >= 97 && state.level <= 99;
  const isMaxLevel = state.level >= 100;

  return (
    <>
      <div className={className || "absolute top-5 left-5 z-20 flex flex-col gap-4"}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/90 backdrop-blur-sm border-[3px] border-vibrant-pink rounded-[40px] px-6 py-4 w-80 shadow-[0_8px_20px_rgba(255,105,180,0.2)]"
        >
          <div className="flex justify-between items-center mb-3 text-xs font-bold text-gray-500 bg-gray-100 rounded-xl px-3 py-1.5">
            <div className="flex items-center gap-1">
              <Clock size={12} /> Day {state.day} - {state.phase} {getDynamicTime(state.phase, state.ap, state.maxAp)}
            </div>
            <div className="text-vibrant-pink">
              AP : {state.ap} / {state.maxAp}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 bg-vibrant-pink rounded-full border-2 border-white flex items-center justify-center text-white ${isTrueName ? 'animate-pulse drop-shadow-[0_0_8px_rgba(255,105,180,0.8)]' : ''}`}>
              <Sparkles size={20} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-vibrant-dark font-bold text-lg leading-tight">콜롬비나</h2>
                <span className="text-gray-400 text-xs font-bold bg-gray-100 px-2 py-0.5 rounded-full">Lv.{state.level}</span>
              </div>
              <p className={`text-xs font-bold mt-1 max-w-[200px] leading-relaxed break-keep
                 ${isTrueName ? 'text-transparent bg-clip-text bg-gradient-to-r from-vibrant-pink to-purple-500 drop-shadow-[0_0_12px_rgba(255,105,180,0.6)] animate-pulse' : 'text-vibrant-accent'}`}>
                {titleText}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <ProgressBar value={state.happiness} color="#ff4081" label="호감도" icon={<Heart size={12} />} />
            <ProgressBar value={state.energy} color="#4caf50" label="체력" icon={<Zap size={12} />} />
            <ProgressBar value={state.hunger} color="#ffb300" label="허기" icon={<Coffee size={12} />} />
            <ProgressBar value={state.cleanliness} color="#00bcd4" label="청결도" icon={<Sparkles size={12} />} />
            <ProgressBar value={state.stress} color="#9c27b0" label="스트레스" icon={<Brain size={12} />} />
          </div>
          
          <div className="mt-3 bg-vibrant-light-pink/20 rounded-full h-1 w-full overflow-hidden">
            <motion.div 
              animate={{ width: `${state.xp}%` }}
              className="h-full bg-vibrant-pink"
            />
          </div>

          {isMaxLevel && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLog(true)}
              className="mt-4 w-full py-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white font-bold text-sm rounded-xl shadow-md flex justify-center items-center gap-2 hover:from-pink-500 hover:to-purple-500 transition-colors"
            >
              <Book size={14} />
              진정한 이름의 기록
            </motion.button>
          )}

        </motion.div>
      </div>

      <AnimatePresence>
        {showLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-vibrant-pink relative"
            >
              <button 
                onClick={() => setShowLog(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-vibrant-pink transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-pink-300 to-purple-300 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Book className="text-white drop-shadow-md" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-vibrant-dark">
                  진정한 이름의 기록
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  두 사람이 함께 찾아낸 이름의 의미
                </p>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-gray-700 leading-loose text-center font-medium">
                  {fullMemoryLog.map((line, idx) => (
                    <span key={idx} className={`block ${idx >= 8 ? 'text-vibrant-pink font-bold' : ''} ${idx === 10 ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600' : ''}`}>
                      {line}
                    </span>
                  ))}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { CharacterState, GameStats, Mood } from '../types';

const INITIAL_STATS: GameStats = {
  hunger: 50,
  energy: 80,
  happiness: 60,
  cleanliness: 100,
  level: 1,
  xp: 0,
};

export function useGameState() {
  const [state, setState] = useState<CharacterState>({
    ...INITIAL_STATS,
    name: '콜롬비나',
    mood: 'neutral',
    lastInteraction: Date.now(),
  });

  // 분당 1~10% 무작위 감소 (배고픔, 피곤함, 청결도)
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const hungerDrop = Math.floor(Math.random() * 10) + 1; // 1 ~ 10
        const energyDrop = Math.floor(Math.random() * 10) + 1; // 1 ~ 10
        const cleanlinessDrop = Math.floor(Math.random() * 10) + 1; // 1 ~ 10

        return {
          ...prev,
          hunger: Math.max(0, prev.hunger - hungerDrop),
          energy: Math.max(0, prev.energy - energyDrop),
          cleanliness: Math.max(0, prev.cleanliness - cleanlinessDrop),
        };
      });
    }, 60000); // 1분 (60000ms)마다 발동
    return () => clearInterval(interval);
  }, []);

  const updateStats = useCallback((updates: Partial<GameStats>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // Level up logic
      let newLevel = newState.level;
      let newXp = newState.xp;
      if (newXp >= 100) {
        newLevel += 1;
        newXp -= 100;
      }

      return {
        ...newState,
        level: newLevel,
        xp: newXp,
      };
    });
  }, []);

  const setMood = useCallback((mood: Mood) => {
    setState(prev => {
      if (prev.mood === mood) return prev; // 이미 같은 기분이면 무시

      const newState = { ...prev, mood };
      
      // 호감도가 낮을수록 화나거나 슬플 때 더 크게 스탯(happiness)이 감소하도록 적용
      if (mood === 'angry') {
        let penalty = 5; // 기본 감소
        if (newState.happiness < 50) penalty = 10;
        if (newState.happiness < 20) penalty = 15;
        newState.happiness = Math.max(0, newState.happiness - penalty);
      } else if (mood === 'sad') {
        // sad는 angry보다 약하지만 그래도 감소
        let penalty = 2; // 기본 감소
        if (newState.happiness < 50) penalty = 4;
        if (newState.happiness < 20) penalty = 7;
        newState.happiness = Math.max(0, newState.happiness - penalty);
      }
      
      return newState;
    });
  }, []);

  const interact = useCallback(() => {
    setState(prev => ({ ...prev, lastInteraction: Date.now() }));
    updateStats({ xp: state.xp + 5, happiness: Math.min(100, state.happiness + 2) });
  }, [state.happiness, state.xp, updateStats]);

  return {
    state,
    updateStats,
    setMood,
    interact,
  };
}

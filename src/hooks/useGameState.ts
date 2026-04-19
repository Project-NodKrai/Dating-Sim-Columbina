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

  // Decay stats over time
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        hunger: Math.max(0, prev.hunger - 0.1),
        energy: Math.max(0, prev.energy - 0.05),
        happiness: Math.max(0, prev.happiness - 0.05),
      }));
    }, 5000);
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
    setState(prev => ({ ...prev, mood }));
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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { CharacterState, GameStats, Mood, TimePhase } from '../types';

function getBaseAp(phase: TimePhase): number {
  if (phase === '새벽') return 4;
  if (phase === '아침') return 4;
  if (phase === '낮') return 6;
  if (phase === '저녁') return 4;
  if (phase === '밤') return 2;
  return 4;
}

function getBonusAp(happiness: number): number {
  if (happiness >= 90) return 4;
  if (happiness >= 60) return 3;
  if (happiness >= 30) return 2;
  return 1;
}

function getStressPenalty(stress: number): number {
  if (stress >= 80) return 3;
  if (stress >= 50) return 2;
  if (stress >= 30) return 1;
  return 0;
}

const INITIAL_HAPPINESS = 60;
const INITIAL_STRESS = 0;
const INITIAL_AP = Math.max(1, getBaseAp('아침') + getBonusAp(INITIAL_HAPPINESS) - getStressPenalty(INITIAL_STRESS));

const INITIAL_STATS: GameStats = {
  hunger: 50,
  energy: 80,
  happiness: INITIAL_HAPPINESS,
  cleanliness: 100,
  stress: INITIAL_STRESS,
  level: 1,
  xp: 0,
  day: 1,
  phase: '아침',
  ap: INITIAL_AP,
  maxAp: INITIAL_AP,
};

function getNextPhaseState(prev: CharacterState): CharacterState {
  let nextPhase: TimePhase = prev.phase;
  let nextDay = prev.day;

  if (prev.phase === '새벽') { nextPhase = '아침'; }
  else if (prev.phase === '아침') { nextPhase = '낮'; }
  else if (prev.phase === '낮') { nextPhase = '저녁'; }
  else if (prev.phase === '저녁') { nextPhase = '밤'; }
  else if (prev.phase === '밤') { nextPhase = '새벽'; nextDay += 1; }
  else { nextPhase = '아침'; }

  // Turn-based decay when phase changes
  const hungerDrop = Math.floor(Math.random() * 8) + 5; // 5 ~ 12
  const energyDrop = (nextPhase === '밤' || nextPhase === '새벽') ? 20 : (Math.floor(Math.random() * 8) + 5);
  const cleanlinessDrop = Math.floor(Math.random() * 5) + 3; // 3 ~ 7

  let newHunger = Math.max(0, prev.hunger - hungerDrop);
  let newEnergy = Math.max(0, prev.energy - energyDrop);
  let newCleanliness = Math.max(0, prev.cleanliness - cleanlinessDrop);
  let newStress = prev.stress;
  
  // Increase stress if stats are very low
  if (newHunger < 30) newStress += 5;
  if (newEnergy < 30) newStress += 5;
  
  newStress = Math.min(100, newStress);

  let nextAp = Math.max(1, getBaseAp(nextPhase) + getBonusAp(prev.happiness) - getStressPenalty(newStress));

  return {
    ...prev,
    day: nextDay,
    phase: nextPhase,
    ap: nextAp,
    maxAp: nextAp,
    hunger: newHunger,
    energy: newEnergy,
    cleanliness: newCleanliness,
    stress: newStress,
  };
}

export function useGameState() {
  const [state, setState] = useState<CharacterState>({
    ...INITIAL_STATS,
    name: '콜롬비나',
    mood: 'neutral',
    lastInteraction: Date.now(),
  });

  const updateStats = useCallback((updates: Partial<GameStats>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // Bounds
      if (newState.hunger !== undefined) newState.hunger = Math.max(0, Math.min(100, newState.hunger));
      if (newState.energy !== undefined) newState.energy = Math.max(0, Math.min(100, newState.energy));
      if (newState.happiness !== undefined) newState.happiness = Math.max(0, Math.min(100, newState.happiness));
      if (newState.cleanliness !== undefined) newState.cleanliness = Math.max(0, Math.min(100, newState.cleanliness));
      if (newState.stress !== undefined) newState.stress = Math.max(0, Math.min(100, newState.stress));
      
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

  const advancePhase = useCallback(() => {
    setState(prev => getNextPhaseState(prev));
  }, []);

  const sleepToNextDay = useCallback(() => {
    setState(prev => {
      let nextDay = prev.day + 1;
      let nextPhase: TimePhase = '아침';
      
      // Sleep specific stats restore
      let newEnergy = 100;
      let newHunger = Math.max(0, prev.hunger - 20);
      let newStress = Math.max(0, prev.stress - 30);
      let newCleanliness = Math.max(0, prev.cleanliness - 10);
      
      let nextAp = Math.max(1, getBaseAp(nextPhase) + getBonusAp(prev.happiness) - getStressPenalty(newStress));

      return {
        ...prev,
        day: nextDay,
        phase: nextPhase,
        ap: nextAp,
        maxAp: nextAp,
        energy: newEnergy,
        hunger: newHunger,
        cleanliness: newCleanliness,
        stress: newStress,
        xp: prev.xp + 10,
      };
    });
  }, []);

  const takeNap = useCallback(() => {
    setState(prev => {
      let firstHop = getNextPhaseState(prev);
      let secondHop = getNextPhaseState(firstHop);
      return {
        ...secondHop,
        energy: Math.min(100, secondHop.energy + 30),
        stress: Math.max(0, secondHop.stress - 10)
      };
    });
  }, []);

  const useAp = useCallback((amount: number = 1) => {
    setState(prev => {
      let currentAp = Math.max(0, prev.ap - amount);
      return { ...prev, ap: currentAp };
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
        newState.stress = Math.min(100, newState.stress + 10);
      } else if (mood === 'sad') {
        // sad는 angry보다 약하지만 그래도 감소
        let penalty = 2; // 기본 감소
        if (newState.happiness < 50) penalty = 4;
        if (newState.happiness < 20) penalty = 7;
        newState.happiness = Math.max(0, newState.happiness - penalty);
        newState.stress = Math.min(100, newState.stress + 5);
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
    advancePhase,
    useAp,
    sleepToNextDay,
    takeNap,
  };
}

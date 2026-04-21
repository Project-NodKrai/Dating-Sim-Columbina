/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TimePhase = '새벽' | '아침' | '낮' | '저녁' | '밤';

export interface GameStats {
  hunger: number;
  energy: number;
  happiness: number;
  cleanliness: number;
  stress: number;
  level: number;
  xp: number;
  day: number;
  phase: TimePhase;
  ap: number;
  maxAp: number;
}

export type Mood = 'happy' | 'neutral' | 'sad' | 'excited' | 'tired' | 'angry' | 'surprised' | 'shy';

export interface CharacterState extends GameStats {
  name: string;
  mood: Mood;
  lastInteraction: number;
}

export interface Dialogue {
  speaker: string;
  text: string;
  mood?: Mood;
  actions?: string[];
  timestamp?: number;
}

export interface Choice {
  label: string;
  action: () => void;
  apCost?: number;
}

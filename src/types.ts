/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GameStats {
  hunger: number;
  energy: number;
  happiness: number;
  cleanliness: number;
  level: number;
  xp: number;
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


import type { Timestamp } from 'firebase/firestore';

export interface Session {
  id: string;
  rotationDirection: 'kanan' | 'kiri';
  theme: 'light' | 'dark';
  status: 'active' | 'locked';
  lastRoundNumber: number;
  createdAt: Timestamp;
}

export interface Player {
  id: string;
  name: string;
  totalPoints: number;
  addedAt: Timestamp;
  order?: number;
}

export interface Round {
    id: string;
    roundNumber: number;
    createdAt: Timestamp;
    scores?: ScoreEntry[];
}

export interface ScoreEntry {
  id:string;
  playerId: string;
  points: number;
  inputType: 'shortcut' | 'manual';
  actionLabel: string;
  timestamp: Timestamp;
}

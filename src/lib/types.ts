import { Timestamp } from 'firebase/firestore';

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface ScoreEntry {
  id: string;
  points: number;
  timestamp: Timestamp;
  playerName: string;
}

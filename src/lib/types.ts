import { Timestamp } from 'firebase/firestore';

export interface Player {
  id: string;
  name: string;
  score: number;
  ownerId: string;
}

export interface ScoreEntry {
  id: string;
  points: number;
  timestamp: Timestamp;
}

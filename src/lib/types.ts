
export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface ScoreEntry {
  id: string;
  points: number;
  timestamp: Date;
  playerName: string;
}

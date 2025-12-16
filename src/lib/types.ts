
export interface Player {
  id: string;
  name: string;
}

export interface ScoreEntry {
  id: string;
  points: number;
  timestamp: any;
  playerId: string;
}

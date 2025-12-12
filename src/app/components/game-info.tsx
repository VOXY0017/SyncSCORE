
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import type { Player, ScoreEntry } from '@/lib/types';
import { useSyncedState } from '@/hooks/use-synced-state';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Gamepad2, UserX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface HighestPlayerData {
    name: string;
    score: number;
}

export default function GameInfo() {
  const [players] = useSyncedState<Player[]>('players', []);
  const [history] = useSyncedState<ScoreEntry[]>('scoreHistory', []);
  const [isLoading, setIsLoading] = useState(true);
  const [gameInfo, setGameInfo] = useState<{
    nextGame: number;
    direction: 'Kanan' | 'Kiri';
    Icon: React.FC<any>;
  } | null>(null);
  const [highestPlayer, setHighestPlayer] = useState<HighestPlayerData | null>(null);

  useEffect(() => {
    if (players !== undefined && history !== undefined) {
      let completedRounds = 0;
      const playerGameCounts: Record<string, number> = {};

      if (players.length > 0) {
        players.forEach(player => {
            playerGameCounts[player.name] = history.filter(h => h.playerName === player.name).length;
        });
        if (Object.keys(playerGameCounts).length === players.length) {
            completedRounds = Math.min(...Object.values(playerGameCounts));
        }
      }

      const nextGameNumber = completedRounds + 1;
      
      if (nextGameNumber % 2 !== 0) { // Ganjil (Odd) -> Kanan -> A-Z
        setGameInfo({ nextGame: nextGameNumber, direction: 'Kanan', Icon: ArrowRight });
      } else { // Genap (Even) -> Kiri -> Z-A
        setGameInfo({ nextGame: nextGameNumber, direction: 'Kiri', Icon: ArrowLeft });
      }

      // Find player with the highest score from the previous round
      if (completedRounds > 0) {
          const previousRoundIndex = completedRounds - 1;
          let highestScorePlayer: HighestPlayerData | null = null;

          const playerHistories = players.map(player => ({
            player,
            history: history.filter(h => h.playerName === player.name)
                            .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          }));

          playerHistories.forEach(({ player, history }) => {
              if (history.length > previousRoundIndex) {
                  const previousGameScore = history[previousRoundIndex].points;
                  if (highestScorePlayer === null || previousGameScore > highestScorePlayer.score) {
                      highestScorePlayer = { name: player.name, score: previousGameScore };
                  }
              }
          });
          setHighestPlayer(highestScorePlayer);
      } else {
        setHighestPlayer(null);
      }

      setIsLoading(false);
    }
  }, [players, history]);

  const InfoSkeleton = () => (
      <div className="grid grid-cols-2 gap-4">
        <div className='space-y-1'>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
        </div>
        <div className='space-y-1 text-right'>
            <Skeleton className="h-5 w-28 ml-auto" />
            <Skeleton className="h-4 w-20 ml-auto" />
        </div>
        <div className='space-y-1'>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-20" />
        </div>
      </div>
  );

  return (
    <Card>
        <CardContent className="p-4">
           {isLoading ? (
               <InfoSkeleton />
           ) : gameInfo ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className='flex items-center gap-3'>
                    <Gamepad2 className="h-8 w-8 text-primary" />
                    <div>
                        <p className="text-muted-foreground">Game Berikutnya</p>
                        <p className="font-bold text-lg">{gameInfo.nextGame}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-muted-foreground">Arah Permainan</p>
                    <div className="flex items-center gap-2 justify-end">
                       <p className="font-bold text-lg">{gameInfo.direction}</p>
                       <gameInfo.Icon className="h-5 w-5" />
                    </div>
                </div>

                {highestPlayer && gameInfo.nextGame > 1 && (
                 <>
                    <div className='flex items-center gap-3 col-span-2'>
                        <UserX className="h-8 w-8 text-destructive" />
                        <div>
                            <p className="text-muted-foreground">Pemain Pertama (Skor Game {gameInfo.nextGame - 1} Tertinggi)</p>
                            <div className="flex items-baseline gap-2">
                                <p className="font-bold text-lg">{highestPlayer.name}</p>
                                <p className="font-bold text-sm text-destructive">({highestPlayer.score > 0 ? `+${highestPlayer.score}`: highestPlayer.score})</p>
                            </div>
                        </div>
                    </div>
                 </>
                )}

            </div>
           ) : <InfoSkeleton />}
        </CardContent>
    </Card>
  );
}

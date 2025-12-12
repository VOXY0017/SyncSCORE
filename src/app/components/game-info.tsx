
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import type { Player, ScoreEntry } from '@/lib/types';
import { useSyncedState } from '@/hooks/use-synced-state';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Gamepad2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function GameInfo() {
  const [players] = useSyncedState<Player[]>('players', []);
  const [history] = useSyncedState<ScoreEntry[]>('scoreHistory', []);
  const [isLoading, setIsLoading] = useState(true);
  const [gameInfo, setGameInfo] = useState<{
    nextGame: number;
    direction: 'Kanan' | 'Kiri';
    Icon: React.FC<any>;
  } | null>(null);

  useEffect(() => {
    if (players !== undefined && history !== undefined) {
      let completedRounds = 0;
      if (players.length > 0 && history.length > 0) {
        const playerGameCounts = players.reduce((acc, player) => {
            acc[player.name] = history.filter(h => h.playerName === player.name).length;
            return acc;
        }, {} as Record<string, number>);
        completedRounds = Math.min(...Object.values(playerGameCounts));
      }

      const nextGameNumber = completedRounds + 1;
      
      if (nextGameNumber % 2 !== 0) { // Ganjil (Odd) -> Kanan -> A-Z
        setGameInfo({ nextGame: nextGameNumber, direction: 'Kanan', Icon: ArrowRight });
      } else { // Genap (Even) -> Kiri -> Z-A
        setGameInfo({ nextGame: nextGameNumber, direction: 'Kiri', Icon: ArrowLeft });
      }
      setIsLoading(false);
    }
  }, [players, history]);

  const InfoSkeleton = () => (
      <div className="flex justify-between items-center">
        <div className='space-y-1'>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
        </div>
        <div className='space-y-1 text-right'>
            <Skeleton className="h-5 w-28 ml-auto" />
            <Skeleton className="h-4 w-20 ml-auto" />
        </div>
      </div>
  );

  return (
    <Card>
        <CardContent className="p-4">
           {isLoading ? (
               <InfoSkeleton />
           ) : gameInfo ? (
            <div className="flex justify-between items-center text-sm">
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
            </div>
           ) : <InfoSkeleton />}
        </CardContent>
    </Card>
  );
}

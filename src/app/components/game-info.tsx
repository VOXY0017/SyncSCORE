
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTheme } from "next-themes"
import { useData } from '@/app/context/data-context';
import type { Player, ScoreEntry } from '@/lib/types';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft, Trophy, Crown, Medal, Moon, Sun } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TopPlayerData {
    name: string;
    score: number;
}

export default function GameInfo() {
  const { players, history } = useData();
  const { setTheme, theme } = useTheme()
  const [isLoading, setIsLoading] = useState(true);
  const [gameInfo, setGameInfo] = useState<{
    direction: 'Kanan' | 'Kiri';
    Icon: React.FC<any>;
  } | null>(null);
  const [topPlayers, setTopPlayers] = useState<TopPlayerData[]>([]);

  useEffect(() => {
    if (players !== undefined && history !== undefined) {
      let completedRounds = 0;
      const playerGameCounts: Record<string, number> = {};

      if (players.length > 0) {
        players.forEach(player => {
            playerGameCounts[player.name] = history.filter(h => h.playerName === player.name).length;
        });
        if (Object.keys(playerGameCounts).length === players.length && players.length > 0) {
            completedRounds = Math.min(...Object.values(playerGameCounts));
        }
      }

      const nextGameNumber = completedRounds + 1;
      
      if (nextGameNumber % 2 !== 0) { // Ganjil (Odd) -> Kanan -> A-Z
        setGameInfo({ direction: 'Kanan', Icon: ArrowRight });
      } else { // Genap (Even) -> Kiri -> Z-A
        setGameInfo({ direction: 'Kiri', Icon: ArrowLeft });
      }

      if (completedRounds > 0) {
          const previousRoundIndex = completedRounds - 1;
          const scoresFromPreviousRound: TopPlayerData[] = [];

          const playerHistories = players.map(player => ({
            player,
            history: history.filter(h => h.playerName === player.name)
                            .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          }));

          playerHistories.forEach(({ player, history }) => {
              if (history.length > previousRoundIndex) {
                  const previousGameScore = history[previousRoundIndex].points;
                  scoresFromPreviousRound.push({ name: player.name, score: previousGameScore });
              }
          });

          scoresFromPreviousRound.sort((a, b) => b.score - a.score);
          setTopPlayers(scoresFromPreviousRound.slice(0, 3));
      } else {
        setTopPlayers([]);
      }

      setIsLoading(false);
    }
  }, [players, history]);

  const InfoSkeleton = () => (
      <div className="grid grid-cols-1 gap-4">
        <div className='space-y-1 text-left'>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-20" />
        </div>
        <div className='space-y-1'>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-20" />
        </div>
      </div>
  );

  const renderTopPlayer = (player: TopPlayerData, rank: number) => {
    let Icon, iconColor, title;
    switch (rank) {
      case 1:
        Icon = Trophy;
        iconColor = 'text-yellow-400';
        title = 'Pemain Pertama';
        break;
      case 2:
        Icon = Crown;
        iconColor = 'text-slate-400';
        title = 'Pemain Kedua';
        break;
      case 3:
        Icon = Medal;
        iconColor = 'text-orange-400';
        title = 'Pemain Ketiga';
        break;
      default:
        return null;
    }

    return (
      <div key={player.name} className='flex items-center gap-3'>
        <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${iconColor}`} />
        <div className='text-left'>
          <p className="text-muted-foreground text-xs sm:text-sm">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="font-bold text-base sm:text-lg">{player.name}</p>
            <p className="font-bold text-xs sm:text-sm text-destructive">({player.score > 0 ? `+${player.score}`: player.score})</p>
          </div>
        </div>
      </div>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Card>
        <CardContent className="p-4">
           {isLoading ? (
               <InfoSkeleton />
           ) : gameInfo ? (
            <div className="flex flex-col sm:flex-row gap-4 text-sm items-center justify-between">
                <div className="flex items-center gap-2 justify-start">
                   <p className="text-muted-foreground">Arah Permainan</p>
                   <p className="font-bold text-lg">{gameInfo.direction}</p>
                   <gameInfo.Icon className="h-5 w-5" />
                </div>
                
                <div className="flex flex-1 flex-col sm:flex-row items-center sm:justify-end gap-3 sm:gap-4">
                  {topPlayers.length > 0 && (
                      topPlayers.map((player, index) => renderTopPlayer(player, index + 1))
                  )}
                </div>

                <Button variant="outline" size="icon" onClick={toggleTheme} className="hidden sm:inline-flex">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
            </div>
           ) : <InfoSkeleton />}
        </CardContent>
    </Card>
  );
}

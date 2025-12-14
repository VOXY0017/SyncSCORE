
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import type { Player, ScoreEntry } from '@/lib/types';
import { useData } from '@/app/context/data-context';
import { CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


interface PivotData {
  players: string[];
  games: {
    gameNumber: number;
    scores: Record<string, number | null>;
  }[];
}

export default function GlobalScoreHistory() {
  const { players, history } = useData();
  const [pivotData, setPivotData] = useState<PivotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      if (history === undefined || players === undefined) return;

      if (players.length > 0) {
        const allPlayerNames = players.map(p => p.name);
        
        const playerGameCounts = players.reduce((acc, player) => {
            acc[player.name] = history.filter(h => h.playerName === player.name).length;
            return acc;
        }, {} as Record<string, number>);
        
        const completedRounds = players.length > 0 ? Math.min(...Object.values(playerGameCounts)) : 0;
        const maxGames = Math.max(0, ...Object.values(playerGameCounts));
        const totalGamesToDisplay = maxGames > completedRounds ? maxGames : completedRounds + 1;
        const nextGameNumber = completedRounds + 1;
        
        if (nextGameNumber % 2 !== 0) { // Ganjil (Odd) -> A-Z
          allPlayerNames.sort((a, b) => a.localeCompare(b)); 
        } else { // Genap (Even) -> Z-A
          allPlayerNames.sort((a, b) => b.localeCompare(a)); 
        }

        const gameData: PivotData['games'] = [];
        
        // Group history by game round
        const historyByPlayer: Record<string, ScoreEntry[]> = {};
        allPlayerNames.forEach(name => {
          historyByPlayer[name] = history
            .filter(h => h.playerName === name)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });

        for (let i = 0; i < totalGamesToDisplay; i++) {
            const gameScores: Record<string, number | null> = {};
            allPlayerNames.forEach(playerName => {
                const playerHistory = historyByPlayer[playerName];
                if (playerHistory && playerHistory[i]) {
                    gameScores[playerName] = playerHistory[i].points;
                } else {
                    gameScores[playerName] = null;
                }
            });
            gameData.push({
                gameNumber: i + 1,
                scores: gameScores
            });
        }

        setPivotData({
          players: allPlayerNames,
          games: gameData,
        });

      } else {
        setPivotData({ players: [], games: [] });
      }

      setIsLoading(false);
  }, [history, players]);

  const HistorySkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-17.5rem)] sm:h-[calc(100vh-16rem)] w-full whitespace-nowrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 font-bold min-w-[80px]">Game</TableHead>
                {isLoading ? (
                  [...Array(4)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-24" /></TableHead>)
                ) : (
                  pivotData && pivotData.players.map((player) => (
                    <TableHead key={player} className="text-center">{player}</TableHead>
                  ))
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <HistorySkeleton />
              ) : pivotData && pivotData.games.length > 0 ? (
                pivotData.games.map((game) => (
                  <TableRow key={game.gameNumber}>
                    <TableCell className="sticky left-0 bg-card z-10 font-medium">
                      Game {game.gameNumber}
                    </TableCell>
                    {pivotData.players.map((player) => {
                      const score = game.scores[player];
                      return (
                        <TableCell key={`${game.gameNumber}-${player}`} className="text-center">
                          {score !== null ? (
                            <span
                              className={cn(
                                "font-bold",
                                score > 0 ? "text-green-400" : "text-red-400"
                              )}
                            >
                              {score > 0 ? `+${score}` : score}
                            </span>
                          ) : (
                            <span className="text-muted-foreground"> – </span>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={pivotData ? pivotData.players.length + 1 : 2} className="h-24 text-center text-muted-foreground">
                    Belum ada riwayat skor.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
  );
}

'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import type { Player, ScoreEntry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSyncedState } from '@/hooks/use-synced-state';


interface PivotData {
  players: string[];
  games: number;
  scores: Record<string, (number | null)[]>;
}

export default function GlobalScoreHistory() {
  const [players] = useSyncedState<Player[]>('players', []);
  const [history] = useSyncedState<ScoreEntry[]>('scoreHistory', []);
  const [pivotData, setPivotData] = useState<PivotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      if (history === undefined || players === undefined) return;

      const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (players.length > 0) {
        let allPlayers = [...players].map(p => p.name);
        
        const playerGameCounts = players.reduce((acc, player) => {
            acc[player.name] = history.filter(h => h.playerName === player.name).length;
            return acc;
        }, {} as Record<string, number>);
        
        const completedRounds = players.length > 0 ? Math.min(...Object.values(playerGameCounts)) : 0;
        const maxGames = Math.max(0, ...Object.values(playerGameCounts));
        const totalGamesToDisplay = maxGames + 1;
        const nextGameNumber = completedRounds + 1;


        // Player rotation logic
        if (nextGameNumber % 2 !== 0) { // Ganjil (Odd) -> A-Z
          allPlayers.sort((a, b) => a.name.localeCompare(b.name)); 
        } else { // Genap (Even) -> Z-A
          allPlayers.sort((a, b) => b.name.localeCompare(a.name)); 
        }

        const pivotedScores: Record<string, (number | null)[]> = {};
        allPlayers.forEach(player => {
            pivotedScores[player] = Array(totalGamesToDisplay).fill(null);
            const playerHistory = sortedHistory.filter(h => h.playerName === player);
            playerHistory.forEach((entry, index) => {
                if (index < totalGamesToDisplay) {
                    pivotedScores[player][index] = entry.points;
                }
            });
        });

        setPivotData({
          players: allPlayers,
          games: totalGamesToDisplay,
          scores: pivotedScores,
        });

      } else {
        setPivotData({ players: [], games: 1, scores: {} });
      }

      setIsLoading(false);
  }, [history, players]);

  const HistorySkeleton = () => (
    <>
      <TableRow>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        {[...Array(5)].map((_, i) => (
          <TableCell key={i}><Skeleton className="h-5 w-16" /></TableCell>
        ))}
      </TableRow>
       <TableRow>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        {[...Array(5)].map((_, i) => (
          <TableCell key={i}><Skeleton className="h-5 w-16" /></TableCell>
        ))}
      </TableRow>
       <TableRow>
        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
        {[...Array(5)].map((_, i) => (
          <TableCell key={i}><Skeleton className="h-5 w-16" /></TableCell>
        ))}
      </TableRow>
    </>
  );

  return (
    <Card className="shadow-md h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
          <History className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          Skor per Game
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-14rem)] sm:h-[calc(100vh-15rem)] w-full whitespace-nowrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 font-bold min-w-[120px]">Player</TableHead>
                {isLoading ? (
                  [...Array(5)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-20" /></TableHead>)
                ) : (
                  pivotData && [...Array(pivotData.games)].map((_, i) => (
                    <TableHead key={i} className="text-center">Game {i + 1}</TableHead>
                  ))
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <HistorySkeleton />
              ) : pivotData && pivotData.players.length > 0 ? (
                pivotData.players.map((player) => (
                  <TableRow key={player}>
                    <TableCell className="sticky left-0 bg-card z-10 font-medium">
                      {player}
                    </TableCell>
                    {pivotData.scores[player].map((score, gameIndex) => (
                      <TableCell key={gameIndex} className="text-center">
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
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    Belum ada riwayat skor.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

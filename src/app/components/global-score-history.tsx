'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import type { ScoreEntry } from '@/lib/types';
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
  const [history] = useSyncedState<ScoreEntry[]>('scoreHistory', []);
  const [pivotData, setPivotData] = useState<PivotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      if (!history) return;

      // Sort history by timestamp to determine game order
      const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (sortedHistory.length > 0) {
        const playerNames = [...new Set(sortedHistory.map(entry => entry.playerName))].sort();
        const gamesCount = sortedHistory.length;

        const scores: Record<string, (number | null)[]> = {};
        playerNames.forEach(player => {
          scores[player] = Array(gamesCount).fill(null);
        });

        const playerGameCount: Record<string, number> = {};

        sortedHistory.forEach((entry, _) => {
            const player = entry.playerName;
            // Find the first empty slot for this player
            const gameIndex = scores[player].findIndex(s => s === null);
            if (scores[player] && gameIndex !== -1) {
                scores[player][gameIndex] = entry.points;
            }
        });
        
        // This transformation logic is a bit complex. Let's pivot the data correctly.
        const allPlayers = [...new Set(history.map(h => h.playerName))].sort();
        const gameTimestamps = [...new Set(history.map(h => h.timestamp))].sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
        const numGames = gameTimestamps.length;

        const pivotedScores: Record<string, (number | null)[]> = {};
        allPlayers.forEach(p => {
            pivotedScores[p] = Array(numGames).fill(null);
        });

        history.forEach(entry => {
            const playerIndex = allPlayers.indexOf(entry.playerName);
            const gameIndex = gameTimestamps.indexOf(entry.timestamp);
            if(playerIndex > -1 && gameIndex > -1) {
                pivotedScores[entry.playerName][gameIndex] = entry.points;
            }
        });


        setPivotData({
          players: allPlayers,
          games: numGames,
          scores: pivotedScores,
        });

      } else {
        setPivotData({ players: [], games: 0, scores: {} });
      }

      setIsLoading(false);
  }, [history]);

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

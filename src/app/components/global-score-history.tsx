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

// Static data
const staticHistory: ScoreEntry[] = [
  { id: 'h1', points: 10, timestamp: new Date(Date.now() - 60000 * 15), playerName: 'Pemain Satu' },
  { id: 'h2', points: -5, timestamp: new Date(Date.now() - 60000 * 14), playerName: 'Pemain Dua' },
  { id: 'h3', points: 20, timestamp: new Date(Date.now() - 60000 * 10), playerName: 'Pemain Tiga' },
  { id: 'h4', points: 5, timestamp: new Date(Date.now() - 60000 * 8), playerName: 'Pemain Satu' },
  { id: 'h5', points: -10, timestamp: new Date(Date.now() - 60000 * 5), playerName: 'Pemain Empat' },
  { id: 'h6', points: 15, timestamp: new Date(Date.now() - 60000 * 2), playerName: 'Pemain Dua' },
];

interface PivotData {
  players: string[];
  games: number;
  scores: Record<string, (number | null)[]>;
}

export default function GlobalScoreHistory() {
  const [pivotData, setPivotData] = useState<PivotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      // Sort history by timestamp to determine game order
      const sortedHistory = [...staticHistory].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      if (sortedHistory.length > 0) {
        const playerNames = [...new Set(sortedHistory.map(entry => entry.playerName))].sort();
        const gamesCount = sortedHistory.length;

        const scores: Record<string, (number | null)[]> = {};
        playerNames.forEach(player => {
          scores[player] = Array(gamesCount).fill(null);
        });

        sortedHistory.forEach((entry, index) => {
          if (scores[entry.playerName]) {
            scores[entry.playerName][index] = entry.points;
          }
        });

        setPivotData({
          players: playerNames,
          games: gamesCount,
          scores: scores,
        });
      } else {
        setPivotData({ players: [], games: 0, scores: {} });
      }

      setIsLoading(false);
    }, 1000);
  }, []);

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
                  <TableCell colSpan={1} className="h-24 text-center text-muted-foreground">
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

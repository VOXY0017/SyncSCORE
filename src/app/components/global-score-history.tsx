
'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import type { Player, ScoreEntry, Round } from '@/lib/types';
import { useData } from '@/app/context/data-context';
import { CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PivotData {
  players: Player[];
  games: {
    gameNumber: number;
    scores: Record<string, number | null>;
    highestScore: number | null;
  }[];
}

export default function GlobalScoreHistory() {
  const { players, rounds, scores, isDataLoading } = useData();
  const [pivotData, setPivotData] = useState<PivotData | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDataLoading || !players || !scores || !rounds) return;

    if (players.length > 0) {
      const sortedPlayers = [...players].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      
      const scoresByPlayer: Record<string, ScoreEntry[]> = {};
      sortedPlayers.forEach(p => {
        scoresByPlayer[p.id] = scores
          .filter(s => s.playerId === p.id)
          .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
      });

      const maxGames = Math.max(0, ...Object.values(scoresByPlayer).map(s => s.length));
      
      const gameData: PivotData['games'] = [];

      for (let i = 0; i < maxGames; i++) {
          const gameScores: Record<string, number | null> = {};
          let highestScoreInRound: number | null = null;
          
          sortedPlayers.forEach(player => {
              const scoreEntry = scoresByPlayer[player.id]?.[i];
              if (scoreEntry) {
                  gameScores[player.id] = scoreEntry.points;
                  if (highestScoreInRound === null || scoreEntry.points > highestScoreInRound) {
                      highestScoreInRound = scoreEntry.points;
                  }
              } else {
                  gameScores[player.id] = null;
              }
          });

          gameData.push({
              gameNumber: i + 1,
              scores: gameScores,
              highestScore: highestScoreInRound
          });
      }

      setPivotData({
        players: sortedPlayers,
        games: gameData.reverse(), // Show latest game first
      });

    } else {
      setPivotData({ players: [], games: [] });
    }

  }, [isDataLoading, players, rounds, scores]);


  const HistorySkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
            {[...Array(4)].map((_, j) => (
              <TableCell key={j} className="text-center p-1 sm:p-2"><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
            ))}
        </TableRow>
      ))}
    </>
  );

  return (
      <CardContent className="p-0 h-full">
        <ScrollArea className="h-full w-full whitespace-nowrap" ref={scrollAreaRef}>
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                {isDataLoading ? (
                  [...Array(4)].map((_, i) => <TableHead key={i} className="text-center p-1 sm:p-2"><Skeleton className="h-5 w-16 mx-auto" /></TableHead>)
                ) : pivotData && pivotData.players.length > 0 ? (
                  pivotData.players.map((player) => (
                    <TableHead key={player.id} className="text-center min-w-[80px] p-1 sm:p-2">{player.name}</TableHead>
                  ))
                ) : (
                    <TableHead className="text-center p-2 w-full">Riwayat Skor</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDataLoading ? (
                <HistorySkeleton />
              ) : pivotData && pivotData.games.length > 0 ? (
                pivotData.games.map((game) => (
                  <TableRow key={game.gameNumber}>
                    {pivotData.players.map((player) => {
                      const score = game.scores[player.id];
                      const isHighest = score !== null && score === game.highestScore && game.highestScore > 0;
                      return (
                        <TableCell 
                          key={`${game.gameNumber}-${player.id}`} 
                          className={cn(
                            "text-center p-1 sm:p-2 text-sm transition-colors",
                            isHighest && "bg-yellow-400/10"
                          )}
                        >
                          {score !== null ? (
                            <span
                              className={cn(
                                "font-bold",
                                score > 0 ? "text-destructive" : "text-success",
                                isHighest && "text-yellow-500 dark:text-yellow-400"
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
                  <TableCell colSpan={pivotData ? pivotData.players.length || 1 : 1} className="h-24 text-center text-muted-foreground">
                    {players && players.length > 0 ? "Belum ada riwayat skor." : "Tambahkan pemain untuk melihat riwayat."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
  );
}

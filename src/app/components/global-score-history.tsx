'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import type { Player, ScoreEntry } from '@/lib/types';
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
  const { players, history } = useData();
  const [pivotData, setPivotData] = useState<PivotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (history === undefined || players === undefined) return;

    if (players.length > 0) {
      const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));
      
      const playerGameCounts = sortedPlayers.reduce((acc, player) => {
          acc[player.id] = history.filter(h => h.playerId === player.id).length;
          return acc;
      }, {} as Record<string, number>);
      
      const completedRounds = players.length > 0 ? Math.min(...Object.values(playerGameCounts)) : 0;
      const maxGames = Math.max(0, ...Object.values(playerGameCounts));
      const totalGamesToDisplay = maxGames > completedRounds ? maxGames : completedRounds + 1;
      
      const gameData: PivotData['games'] = [];
      
      const historyByPlayer: Record<string, ScoreEntry[]> = {};
      sortedPlayers.forEach(p => {
        historyByPlayer[p.id] = history
          .filter(h => h.playerId === p.id)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      });

      for (let i = 0; i < totalGamesToDisplay; i++) {
          const gameScores: Record<string, number | null> = {};
          let highestScoreInRound: number | null = null;
          
          sortedPlayers.forEach(player => {
              const playerHistory = historyByPlayer[player.id];
              const scoreEntry = playerHistory && playerHistory[i];
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
        games: gameData,
      });

    } else {
      setPivotData({ players: [], games: [] });
    }

    setIsLoading(false);
  }, [history, players]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [pivotData]);

  const HistorySkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
            {[...Array(5)].map((_, j) => (
              <TableCell key={j} className="text-center p-1 sm:p-2"><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
            ))}
        </TableRow>
      ))}
    </>
  );

  return (
      <CardContent className="p-0 h-full">
        <ScrollArea className="h-full w-full whitespace-nowrap" viewportRef={scrollAreaRef}>
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                {isLoading ? (
                  [...Array(5)].map((_, i) => <TableHead key={i} className="text-center p-1 sm:p-2"><Skeleton className="h-5 w-16 mx-auto" /></TableHead>)
                ) : (
                  pivotData && pivotData.players.map((player) => (
                    <TableHead key={player.id} className="text-center min-w-[80px] p-1 sm:p-2">{player.name}</TableHead>
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
                                score > 0 ? "text-success" : "text-destructive",
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
                  <TableCell colSpan={pivotData ? pivotData.players.length : 1} className="h-24 text-center text-muted-foreground">
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

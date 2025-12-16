'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import type { Player } from '@/lib/types';
import { useData } from '@/app/context/data-context';

import { CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PlayerStats extends Player {
  gamesPlayed: number;
  averageScore: number;
}

export default function Leaderboard() {
  const { players, history } = useData();
  const [sortedPlayers, setSortedPlayers] = useState<PlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (players !== undefined && history !== undefined) {
      const playerStats: PlayerStats[] = players.map(player => {
        const playerHistory = history.filter(h => h.playerName === player.name);
        const gamesPlayed = playerHistory.length;
        const totalPoints = playerHistory.reduce((acc, curr) => acc + curr.points, 0);
        // Correctly calculate total score from history, should match player.score if history is the source of truth
        const calculatedScore = playerHistory.reduce((acc, curr) => acc + curr.points, 0);
        const averageScore = gamesPlayed > 0 ? parseFloat((calculatedScore / gamesPlayed).toFixed(1)) : 0;
        
        return {
          ...player,
          score: calculatedScore, // Use calculated score for consistency
          gamesPlayed,
          averageScore
        };
      });

      // Sort by score descending
      playerStats.sort((a, b) => b.score - a.score);

      setSortedPlayers(playerStats);
      setIsLoading(false);
    }
  }, [players, history]);

  const PlayerListSkeleton = () => (
    <>
        {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-5 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                <TableCell><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
            </TableRow>
        ))}
    </>
  );

  return (
      <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-22rem)] sm:h-[calc(100vh-20rem)]">
              <Table>
                  <TableHeader>
                      <TableRow>
                      <TableHead className="w-[50px] text-center font-bold p-1 sm:p-2">Peringkat</TableHead>
                      <TableHead className="font-bold p-1 sm:p-2">Pemain</TableHead>
                      <TableHead className="w-[80px] text-right font-bold p-1 sm:p-2">Skor</TableHead>
                      <TableHead className="w-[50px] text-right font-bold p-1 sm:p-2">Jarak</TableHead>
                      <TableHead className="w-[80px] text-right font-bold p-1 sm:p-2">Total Main</TableHead>
                      <TableHead className="w-[80px] text-right font-bold p-1 sm:p-2">Rata-rata</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {isLoading ? <PlayerListSkeleton /> : (
                          sortedPlayers && sortedPlayers.map((player, index) => {
                              const gap = index > 0 && sortedPlayers ? sortedPlayers[index - 1].score - player.score : null;
                              return (
                                  <TableRow 
                                      key={player.id}
                                  >
                                    <TableCell className={cn("text-center font-medium text-base p-1 sm:p-2", 
                                      index === 0 ? "text-warning" :
                                      index === 1 ? "text-slate-400" :
                                      index === 2 ? "text-orange-400" :
                                      "text-muted-foreground"
                                    )}>
                                      {index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm sm:text-base p-1 sm:p-2">{player.name}</TableCell>
                                    <TableCell className={cn("text-right font-bold text-base sm:text-lg tabular-nums p-1 sm:p-2",
                                        player.score > 0 ? 'text-success' : player.score < 0 ? 'text-destructive' : 'text-foreground'
                                    )}>
                                      {player.score > 0 ? `+${player.score}` : player.score}
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground tabular-nums p-1 sm:p-2">
                                      {gap !== null && gap > 0 ? `-${gap}` : '–'}
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground tabular-nums p-1 sm:p-2">
                                      {player.gamesPlayed}x
                                    </TableCell>
                                    <TableCell className={cn("text-right text-sm tabular-nums p-1 sm:p-2",
                                      player.averageScore > 0 ? 'text-success' : player.averageScore < 0 ? 'text-destructive' : 'text-muted-foreground'
                                    )}>
                                      {player.averageScore > 0 ? `+${player.averageScore}` : player.averageScore}
                                    </TableCell>
                                  </TableRow>
                              );
                          })
                      )}
                        {!isLoading && (!sortedPlayers || sortedPlayers.length === 0) && (
                          <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                  Belum ada pemain. Tambahkan di menu Kelola.
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </ScrollArea>
      </CardContent>
  );
}

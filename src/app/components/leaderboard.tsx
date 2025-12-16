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

export default function Leaderboard() {
  const { players, history } = useData();
  const [sortedPlayers, setSortedPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (players !== undefined && history !== undefined) {
      const playerScores = players.map(player => {
        const calculatedScore = history
          .filter(h => h.playerName === player.name)
          .reduce((acc, curr) => acc + curr.points, 0);
        return {
          ...player,
          score: calculatedScore,
        };
      });

      playerScores.sort((a, b) => b.score - a.score);

      setSortedPlayers(playerScores);
      setIsLoading(false);
    }
  }, [players, history]);

  const PlayerListSkeleton = () => (
    <>
        {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-5 rounded-full mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
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
                      <TableHead className="w-[60px] text-center font-bold p-1 sm:p-2">Peringkat</TableHead>
                      <TableHead className="font-bold p-1 sm:p-2">Pemain</TableHead>
                      <TableHead className="w-[80px] text-right font-bold p-1 sm:p-2">Skor</TableHead>
                      <TableHead className="w-[60px] text-right font-bold p-1 sm:p-2">Jarak</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {isLoading ? <PlayerListSkeleton /> : (
                          sortedPlayers && sortedPlayers.map((player, index) => {
                              const gap = index > 0 && sortedPlayers ? sortedPlayers[index - 1].score - player.score : null;
                              
                              const isTopThree = index < 3;
                              const rankClass = 
                                index === 0 ? "bg-yellow-400/10 hover:bg-yellow-400/20" :
                                index === 1 ? "bg-slate-400/10 hover:bg-slate-400/20" :
                                index === 2 ? "bg-orange-500/10 hover:bg-orange-500/20" :
                                "";

                              return (
                                  <TableRow 
                                      key={player.id}
                                      className={cn("transition-colors", rankClass)}
                                  >
                                    <TableCell className="text-center p-1 sm:p-2 font-bold text-lg">
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
                                  </TableRow>
                              );
                          })
                      )}
                        {!isLoading && (!sortedPlayers || sortedPlayers.length === 0) && (
                          <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
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


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
      let completedRounds = 0;
      if (players.length > 0 && history.length > 0) {
        const playerGameCounts = players.reduce((acc, player) => {
            acc[player.name] = history.filter(h => h.playerName === player.name).length;
            return acc;
        }, {} as Record<string, number>);

        if (Object.keys(playerGameCounts).length === players.length) {
            completedRounds = Math.min(...Object.values(playerGameCounts));
        }
      }

      const nextGameNumber = completedRounds + 1;
      let sorted;

      if (nextGameNumber % 2 !== 0) { // Ganjil (Odd) -> A-Z
        sorted = [...players].sort((a, b) => a.name.localeCompare(b.name));
      } else { // Genap (Even) -> Z-A
        sorted = [...players].sort((a, b) => b.name.localeCompare(a.name));
      }
      
      // Final sort by score
      sorted.sort((a, b) => b.score - a.score);

      setSortedPlayers(sorted);
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
            </TableRow>
        ))}
    </>
  );

  return (
      <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-17.5rem)] sm:h-[calc(100vh-16rem)]">
              <Table>
                  <TableHeader>
                      <TableRow>
                      <TableHead className="w-[50px] text-center font-bold">Rank</TableHead>
                      <TableHead className="font-bold">Player</TableHead>
                      <TableHead className="w-[80px] text-right font-bold">Score</TableHead>
                      <TableHead className="w-[50px] text-right font-bold">Gap</TableHead>
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
                                    <TableCell className={cn("text-center font-medium text-base", 
                                      index === 0 ? "text-yellow-400" :
                                      index === 1 ? "text-slate-400" :
                                      index === 2 ? "text-orange-400" :
                                      "text-muted-foreground"
                                    )}>
                                      {index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm sm:text-base">{player.name}</TableCell>
                                    <TableCell className="text-right font-bold text-base sm:text-lg text-primary tabular-nums">
                                      {player.score > 0 ? `+${player.score}` : player.score}
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                                      {gap !== null ? `-${gap}` : '–'}
                                    </TableCell>
                                  </TableRow>
                              );
                          })
                      )}
                        {!isLoading && (!sortedPlayers || sortedPlayers.length === 0) && (
                          <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                  No players yet. Go to Player Management to add one.
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </ScrollArea>
      </CardContent>
  );
}

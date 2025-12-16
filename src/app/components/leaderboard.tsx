
'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import type { Player } from '@/lib/types';
import { useData } from '@/app/context/data-context';

import { CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type ScoreChange = 'increase' | 'decrease' | 'none';

export default function Leaderboard() {
  const { players, isDataLoading } = useData();
  const [sortedPlayers, setSortedPlayers] = useState<Player[]>([]);
  const [scoreChanges, setScoreChanges] = useState<Record<string, ScoreChange>>({});
  const prevPlayersRef = useRef<Player[]>();

  useEffect(() => {
    if (players) {
      const playerScores = [...players];
      playerScores.sort((a, b) => b.totalPoints - a.totalPoints); // Higher score is better

      if (prevPlayersRef.current) {
          const changes: Record<string, ScoreChange> = {};
          playerScores.forEach(currentPlayer => {
              const prevPlayer = prevPlayersRef.current?.find(p => p.id === currentPlayer.id);
              if (prevPlayer) {
                  if (currentPlayer.totalPoints > prevPlayer.totalPoints) {
                      changes[currentPlayer.id] = 'increase'; // Score got better
                  } else if (currentPlayer.totalPoints < prevPlayer.totalPoints) {
                      changes[currentPlayer.id] = 'decrease'; // Score got worse
                  }
              }
          });
          setScoreChanges(changes);

          const timer = setTimeout(() => {
              setScoreChanges({});
          }, 1500); // Animation duration

          return () => clearTimeout(timer);
      }

      setSortedPlayers(playerScores);
      prevPlayersRef.current = playerScores;
    }
  }, [players]);

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

  const getRankContent = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return index + 1;
  }

  return (
      <CardContent className="p-0 h-full">
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
                  {isDataLoading ? <PlayerListSkeleton /> : sortedPlayers && sortedPlayers.length > 0 ? (
                      sortedPlayers.map((player, index) => {
                          const gap = index > 0 && sortedPlayers ? player.totalPoints - sortedPlayers[index - 1].totalPoints : null;
                          const change = scoreChanges[player.id];
                          
                          const rankClass = 
                            index === 0 ? "bg-yellow-400/10 hover:bg-yellow-400/20" :
                            index === 1 ? "bg-slate-400/10 hover:bg-slate-400/20" :
                            index === 2 ? "bg-orange-500/10 hover:bg-orange-500/20" :
                            "";

                          return (
                              <TableRow 
                                  key={player.id}
                                  className={cn(
                                    "transition-colors", 
                                    rankClass,
                                    change === 'increase' && 'animate-flash-success', // Better score is green
                                    change === 'decrease' && 'animate-flash-destructive'      // Worse score is red
                                    )}
                              >
                                <TableCell className="text-center p-1 sm:p-2 font-bold text-xl">
                                  {getRankContent(index)}
                                </TableCell>
                                <TableCell className="font-medium text-sm sm:text-base p-1 sm:p-2">{player.name}</TableCell>
                                <TableCell className={cn("text-right font-bold text-base sm:text-lg tabular-nums p-1 sm:p-2",
                                    player.totalPoints > 0 ? 'text-success' : player.totalPoints < 0 ? 'text-destructive' : 'text-foreground'
                                )}>
                                  {player.totalPoints > 0 ? `+${player.totalPoints}` : player.totalPoints}
                                </TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground tabular-nums p-1 sm:p-2">
                                  {gap !== null && gap != 0 ? `${gap}` : '–'}
                                </TableCell>
                              </TableRow>
                          );
                      })
                  ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            Belum ada pemain. Tambahkan di menu Kelola.
                        </TableCell>
                    </TableRow>
                  )}
              </TableBody>
          </Table>
      </CardContent>
  );
}

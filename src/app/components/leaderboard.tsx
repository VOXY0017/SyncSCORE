
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

interface PlayerWithRank extends Player {
    rank: number;
}

export default function Leaderboard() {
  const { players, isDataLoading } = useData();
  const [rankedPlayers, setRankedPlayers] = useState<PlayerWithRank[]>([]);
  const [scoreChanges, setScoreChanges] = useState<Record<string, ScoreChange>>({});
  const prevPlayersRef = useRef<Player[]>();

  useEffect(() => {
    if (players) {
        // 1. Sort players by score, then by the order they were added for tie-breaking
        const sortedPlayers = [...players].sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) {
                return b.totalPoints - a.totalPoints;
            }
            return (a.order ?? Infinity) - (b.order ?? Infinity);
        });


        // 2. Calculate ranks, handling ties
        const playersWithRanks: PlayerWithRank[] = [];
        let rank = 1;
        for (let i = 0; i < sortedPlayers.length; i++) {
            if (i > 0 && sortedPlayers[i].totalPoints < sortedPlayers[i - 1].totalPoints) {
                rank = i + 1;
            }
            playersWithRanks.push({ ...sortedPlayers[i], rank });
        }
        
        // 3. Handle score change animations
        if (prevPlayersRef.current) {
            const changes: Record<string, ScoreChange> = {};
            playersWithRanks.forEach(currentPlayer => {
                const prevPlayer = prevPlayersRef.current?.find(p => p.id === currentPlayer.id);
                if (prevPlayer) {
                    if (currentPlayer.totalPoints > prevPlayer.totalPoints) {
                        changes[currentPlayer.id] = 'increase';
                    } else if (currentPlayer.totalPoints < prevPlayer.totalPoints) {
                        changes[currentPlayer.id] = 'decrease';
                    }
                }
            });
            setScoreChanges(changes);

            const timer = setTimeout(() => {
                setScoreChanges({});
            }, 1500);
            
            setRankedPlayers(playersWithRanks);
            prevPlayersRef.current = playersWithRanks;

            return () => clearTimeout(timer);
        } else {
            setRankedPlayers(playersWithRanks);
            prevPlayersRef.current = playersWithRanks;
        }

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
                <TableCell><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
            </TableRow>
        ))}
    </>
  );

  return (
      <CardContent className="p-0 h-full">
          <Table>
              <TableHeader>
                  <TableRow>
                  <TableHead className="w-[50px] text-center font-bold p-1 sm:p-2">Rank</TableHead>
                  <TableHead className="font-bold p-1 sm:p-2">Pemain</TableHead>
                  <TableHead className="w-[80px] text-right font-bold p-1 sm:p-2">Skor</TableHead>
                  <TableHead className="w-[60px] text-right font-bold p-1 sm:p-2">Selisih</TableHead>
                  <TableHead className="w-[70px] text-right font-bold p-1 sm:p-2">Hukuman</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {isDataLoading ? <PlayerListSkeleton /> : rankedPlayers && rankedPlayers.length > 0 ? (
                      rankedPlayers.map((player, index) => {
                          const gap = index > 0 && rankedPlayers ? player.totalPoints - rankedPlayers[index - 1].totalPoints : null;
                          const change = scoreChanges[player.id];
                          
                          let punishment = 0;
                          if (player.rank === 3) punishment = 1;
                          else if (player.rank === 4) punishment = 2;
                          else if (player.rank === 5) punishment = 3;

                          const rankClass = 
                            player.rank === 1 ? "bg-yellow-400/10 hover:bg-yellow-400/20" :
                            player.rank === 2 ? "bg-slate-400/10 hover:bg-slate-400/20" :
                            player.rank === 3 ? "bg-orange-500/10 hover:bg-orange-500/20" :
                            "";

                          return (
                              <TableRow 
                                  key={player.id}
                                  className={cn(
                                    "transition-colors", 
                                    rankClass,
                                    change === 'increase' && 'animate-flash-success',
                                    change === 'decrease' && 'animate-flash-destructive'
                                    )}
                              >
                                <TableCell className="text-center p-1 sm:p-2 font-bold text-xl">
                                  {player.rank}
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
                                <TableCell className="text-right text-xs text-muted-foreground tabular-nums p-1 sm:p-2 font-bold">
                                  {punishment > 0 ? punishment : '–'}
                                </TableCell>
                              </TableRow>
                          );
                      })
                  ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            Belum ada pemain. Tambahkan di menu Kelola.
                        </TableCell>
                    </TableRow>
                  )}
              </TableBody>
          </Table>
      </CardContent>
  );
}

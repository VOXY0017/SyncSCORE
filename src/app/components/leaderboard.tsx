'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import type { Player } from '@/lib/types';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Static data
const staticPlayers: Player[] = [
  { id: '1', name: 'Pemain Satu', score: 150 },
  { id: '2', name: 'Pemain Dua', score: 120 },
  { id: '3', name: 'Pemain Tiga', score: 95 },
  { id: '4', name: 'Pemain Empat', score: 80 },
  { id: '5', name: 'Pemain Lima', score: 50 },
];

export default function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      const sortedPlayers = [...staticPlayers].sort((a, b) => b.score - a.score);
      setPlayers(sortedPlayers);
      setIsLoading(false);
    }, 1000);
  }, []);

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
    <Card className="shadow-md h-full">
        <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-xl sm:text-2xl">
                <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    Score Markas B7
                </div>
                <Button variant="ghost" size="icon" asChild aria-label="Go to Player Management">
                    <Link href="/management">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Link>
                </Button>
            </CardTitle>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[calc(100vh-14rem)] sm:h-[calc(100vh-15rem)]">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[50px] sm:w-[80px] text-center font-bold">Rank</TableHead>
                        <TableHead className="font-bold">Player</TableHead>
                        <TableHead className="w-[80px] sm:w-[120px] text-right font-bold">Score</TableHead>
                        <TableHead className="w-[50px] sm:w-[120px] text-right font-bold">Gap</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? <PlayerListSkeleton /> : (
                            players && players.map((player, index) => {
                                const gap = index > 0 && players ? players[index - 1].score - player.score : null;
                                return (
                                    <TableRow 
                                        key={player.id}
                                    >
                                      <TableCell className={cn("text-center font-medium text-base sm:text-lg", 
                                        index === 0 ? "text-yellow-400" :
                                        index === 1 ? "text-slate-400" :
                                        index === 2 ? "text-orange-400" :
                                        "text-muted-foreground"
                                      )}>
                                        {index + 1}
                                      </TableCell>
                                      <TableCell className="font-medium text-base sm:text-lg">{player.name}</TableCell>
                                      <TableCell className="text-right font-bold text-lg sm:text-xl text-primary tabular-nums">
                                        {player.score > 0 ? `+${player.score}` : player.score}
                                      </TableCell>
                                      <TableCell className="text-right text-xs sm:text-sm text-muted-foreground tabular-nums">
                                        {gap !== null ? `-${gap}` : '–'}
                                      </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                         {!isLoading && players?.length === 0 && (
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
    </Card>
  );
}

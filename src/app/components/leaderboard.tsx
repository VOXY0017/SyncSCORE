'use client';

import * as React from 'react';
import { useLayoutEffect, useRef, useMemo, useEffect } from 'react';
import type { Player } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { initiateAnonymousSignIn, useAuth } from '@/firebase';

export default function Leaderboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const playersCollectionRef = useMemoFirebase(() => collection(firestore, 'players'), [firestore]);
  const playersQuery = useMemoFirebase(() => query(playersCollectionRef, orderBy('score', 'desc')), [playersCollectionRef]);
  
  const { data: players, isLoading: isPlayersLoading } = useCollection<Player>(playersQuery);
  const isLoading = isUserLoading || isPlayersLoading;

  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const prevPlayerPositions = useRef<Map<string, { top: number; index: number }>>(new Map());

  useEffect(() => {
    if (!user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  useLayoutEffect(() => {
    if (!players) return;
    const newPlayerPositions = new Map<string, { top: number; index: number }>();
    
    players.forEach((player, index) => {
        const row = rowRefs.current[player.id];
        if (row) {
            newPlayerPositions.set(player.id, { top: row.offsetTop, index });
        }
    });

    newPlayerPositions.forEach((newPos, playerId) => {
        const prevPos = prevPlayerPositions.current.get(playerId);
        const row = rowRefs.current[playerId];
        
        if (prevPos && row) {
            const deltaY = prevPos.top - newPos.top;
            if (deltaY !== 0) {
                requestAnimationFrame(() => {
                    row.style.setProperty('--delta-y', `${deltaY}px`);
                    row.classList.add('ranking-change-active');
                    
                    row.addEventListener('animationend', () => {
                        row.classList.remove('ranking-change-active');
                        row.style.removeProperty('--delta-y');
                    }, { once: true });
                });
            }
        }
    });
    
    prevPlayerPositions.current = newPlayerPositions;

  }, [players]);

  const PlayerListSkeleton = () => (
    <>
        {[...Array(8)].map((_, i) => (
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
                                        ref={(el) => (rowRefs.current[player.id] = el)}
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

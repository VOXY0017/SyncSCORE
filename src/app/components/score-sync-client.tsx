'use client';

import * as React from 'react';
import { useState, useTransition, useLayoutEffect, useRef } from 'react';
import type { Player } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, X, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const initialPlayers: Player[] = [];

export default function ScoreSyncClient() {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [isLoading, setIsLoading] = React.useState(false);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  
  const [pointInputs, setPointInputs] = useState<Record<string, string>>({});

  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const prevPlayerPositions = useRef<Map<string, { top: number; index: number }>>(new Map());

  useLayoutEffect(() => {
    const newPlayerPositions = new Map<string, { top: number; index: number }>();
    
    // 1. Get new positions
    players.forEach((player, index) => {
        const row = rowRefs.current[player.id];
        if (row) {
            newPlayerPositions.set(player.id, { top: row.offsetTop, index });
        }
    });

    // 2. Animate if position changed
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
    
    // 3. Update previous positions for next render
    prevPlayerPositions.current = newPlayerPositions;

  }, [players]);


  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;

    startTransition(() => {
      const newPlayer: Player = {
        id: new Date().getTime().toString(),
        name: trimmedName,
        score: 0,
      };
      setPlayers(prev => [...prev, newPlayer].sort((a, b) => b.score - a.score));
      setNewPlayerName('');
      toast({ title: "Player Added", description: `${trimmedName} has joined the game!`});
    });
  };

  const handleScoreChange = (playerId: string, change: number) => {
    if (isNaN(change) || change === 0) return;
    
    startTransition(() => {
        setPlayers(prev => prev.map(p => p.id === playerId ? {...p, score: p.score + change} : p).sort((a,b) => b.score - a.score));
        setPointInputs(prev => ({...prev, [playerId]: ''}));
    });
  };
  
  const handlePointInputChange = (playerId: string, value: string) => {
    setPointInputs(prev => ({...prev, [playerId]: value}));
  }

  const confirmDeletePlayer = () => {
    if (!playerToDelete) return;

    startTransition(() => {
      setPlayers(prev => prev.filter(p => p.id !== playerToDelete.id));
      toast({ title: "Player Removed", description: `${playerToDelete.name} has been removed.`});
      setDeleteAlertOpen(false);
      setPlayerToDelete(null);
    });
  };

  const handleAlertOpenChange = (open: boolean) => {
    setDeleteAlertOpen(open);
    if (!open) {
      setPlayerToDelete(null);
    }
  }

  const PlayerListSkeleton = () => (
    <>
        {[...Array(4)].map((_, i) => (
            <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-5 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                <TableCell><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
            </TableRow>
        ))}
    </>
  );

  const ManagementSkeleton = () => (
    <>
    {[...Array(4)].map((_, i) => (
        <TableRow key={i}>
            <TableCell className="p-2 w-[40px]"><Skeleton className="h-8 w-8" /></TableCell>
            <TableCell><Skeleton className="h-4 w-2/4" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-9 w-20 ml-auto" /></TableCell>
            <TableCell className="flex justify-end gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
            </TableCell>
        </TableRow>
    ))}
    </>
  );

  return (
    <div className="min-h-screen w-full bg-custom-background bg-cover bg-center relative flex flex-col">
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="container flex-grow max-w-screen-2xl mx-auto py-6 sm:py-10 grid md:grid-cols-[1fr_380px] gap-4 relative z-10">
        <main>
            <Card className="shadow-md h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <Trophy className="h-7 w-7 text-primary" />
                        Score Markas B7
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[calc(100vh-12rem)]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[80px] text-center font-bold">Rank</TableHead>
                                <TableHead className="font-bold">Player</TableHead>
                                <TableHead className="w-[120px] text-right font-bold">Score</TableHead>
                                <TableHead className="w-[120px] text-right font-bold">Gap</TableHead>
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
                                              <TableCell className={cn("text-center font-medium text-lg", 
                                                index === 0 ? "text-yellow-400" :
                                                index === 1 ? "text-slate-400" :
                                                index === 2 ? "text-orange-400" :
                                                "text-muted-foreground"
                                              )}>
                                                {index + 1}
                                              </TableCell>
                                              <TableCell className="font-medium text-lg">{player.name}</TableCell>
                                              <TableCell className="text-right font-bold text-xl text-primary tabular-nums">
                                                {player.score > 0 ? `+${player.score}` : player.score}
                                              </TableCell>
                                              <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                                                {gap !== null ? `-${gap}` : '–'}
                                              </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </main>
        
        <aside>
            <Card className="w-full sticky top-10 h-full shadow-md">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users />
                        Player Management
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddPlayer} className="flex w-full items-center gap-2 mb-4">
                        <Input
                            placeholder="Add new player and press Enter..."
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            disabled={isPending}
                            className="h-8 text-sm"
                            aria-label="New player name"
                        />
                    </form>
                    <ScrollArea>
                        <Table>
                        <TableBody>
                            {isLoading ? (
                            <ManagementSkeleton />
                            ) : players && players.length > 0 ? (
                            players.map((player) => (
                                <TableRow key={player.id}>
                                    <TableCell className="p-2 w-[40px]">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { setPlayerToDelete(player); setDeleteAlertOpen(true); }} disabled={isPending} aria-label={`Delete player ${player.name}`}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                    <TableCell className="font-medium p-2 text-sm w-full">{player.name}</TableCell>
                                    <TableCell className='text-right p-2'>
                                        <Input
                                        type="number"
                                        placeholder="Pts"
                                        className="h-8 text-center ml-auto text-sm w-20"
                                        value={pointInputs[player.id] || ''}
                                        onChange={(e) => handlePointInputChange(player.id, e.target.value)}
                                        disabled={isPending}
                                        aria-label={`Points for ${player.name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right w-[80px] space-x-1 p-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleScoreChange(player.id, parseInt(pointInputs[player.id] || '0'))} disabled={isPending || !pointInputs[player.id]} aria-label={`Increase score for ${player.name}`}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleScoreChange(player.id, -parseInt(pointInputs[player.id] || '0'))} disabled={isPending || !pointInputs[player.id]} aria-label={`Decrease score for ${player.name}`}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                Add a player to begin.
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </aside>
      </div>

    <AlertDialog open={isDeleteAlertOpen} onOpenChange={handleAlertOpenChange}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete <strong>{playerToDelete?.name}</strong> and their score data.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePlayer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </div>
  );
}

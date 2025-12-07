'use client';

import * as React from 'react';
import { useState, useTransition, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
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
import { Plus, Minus, Trash2, Trophy, Gamepad2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type RankChange = {
  id: string;
  oldRank: number;
  newRank: number;
};

export default function ScoreSyncClient() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState<string | null>(null);
  const [pointInputs, setPointInputs] = useState<Record<string, string>>({});
  
  const [rankChanges, setRankChanges] = useState<RankChange[]>([]);
  
  const previousPlayerRanks = useRef(new Map<string, number>());

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      // Let's add some mock data for a better default look
      const mockPlayers: Player[] = [
        { id: '1', name: 'Rizky', score: 150 },
        { id: '2', name: 'Andi', score: 125 },
        { id: '3', name: 'Budi', score: 110 },
        { id: '4', name: 'Citra', score: 95 },
        { id: '5', name: 'Dewi', score: 80 },
        { id: '6', name: 'Eka', score: 70 },
      ].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
      
      setPlayers(mockPlayers);
      previousPlayerRanks.current = new Map(mockPlayers.map((p, i) => [p.id, i]));
      setIsLoading(false);
    }, 1500);
  }, []);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;

    startTransition(() => {
      if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ variant: "destructive", title: "Error", description: "A player with this name already exists." });
        return;
      }
      
      const newPlayer: Player = {
        id: new Date().getTime().toString(), // Simple unique ID
        name: trimmedName,
        score: 0,
      };
      
      const newPlayers = [...players, newPlayer].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
      
      previousPlayerRanks.current = new Map(newPlayers.map((p, i) => [p.id, i]));
      setPlayers(newPlayers);
      setNewPlayerName('');
      toast({ title: "Player Added", description: `${trimmedName} has joined the game!`});
    });
  };
  
  const triggerUpdateAnimation = useCallback((playerId: string) => {
    setRecentlyUpdated(playerId);
    setTimeout(() => setRecentlyUpdated(null), 1500);
  }, []);

  const handleScoreChange = (playerId: string, change: number) => {
    if (isNaN(change) || change === 0) return;
    
    triggerUpdateAnimation(playerId);

    startTransition(() => {
       setPlayers(prevPlayers => {
          const updatedPlayers = prevPlayers.map(p => 
            p.id === playerId ? { ...p, score: p.score + change } : p
          );
          
          const sortedPlayers = [...updatedPlayers].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

          const newChanges = sortedPlayers.reduce((acc, player, newRank) => {
            const oldRank = previousPlayerRanks.current.get(player.id);
            if (oldRank !== undefined && oldRank !== newRank) {
              acc.push({ id: player.id, oldRank, newRank });
            }
            return acc;
          }, [] as RankChange[]);
          
          if (newChanges.length > 0) {
            setRankChanges(newChanges);
          }
          previousPlayerRanks.current = new Map(sortedPlayers.map((p, i) => [p.id, i]));

          return sortedPlayers;
       });
       setPointInputs(prev => ({...prev, [playerId]: ''}));
    });
  };
  
  const handlePointInputChange = (playerId: string, value: string) => {
    setPointInputs(prev => ({...prev, [playerId]: value}));
  }

  const confirmDeletePlayer = () => {
    if (!playerToDelete) return;

    startTransition(() => {
      setPlayers(prevPlayers => {
        const remainingPlayers = prevPlayers.filter(p => p.id !== playerToDelete.id);
        const sortedPlayers = remainingPlayers.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
        previousPlayerRanks.current = new Map(sortedPlayers.map((p, i) => [p.id, i]));
        return sortedPlayers;
      });
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
    <div className="space-y-2 mt-4">
        {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
        ))}
    </div>
  );

  const ManagementSkeleton = () => (
    <>
    {[...Array(8)].map((_, i) => (
        <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-2/4" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-9 w-20 ml-auto" /></TableCell>
            <TableCell className="flex justify-end gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
            </TableCell>
        </TableRow>
    ))}
    </>
  );
  
  return (
    <div className="min-h-screen w-full bg-background dark:bg-black dark:bg-dot-white/[0.2] bg-dot-black/[0.2] relative flex flex-col">
       {/* Pointer gradient */}
       <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      
       <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <div className="flex items-center gap-3">
              <Trophy className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">Score Markas B7</h1>
          </div>
        </div>
      </header>

      <div className="container flex-grow max-w-screen-2xl mx-auto py-6 sm:py-10 grid md:grid-cols-[1fr_400px] gap-8">
        <main>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Users />
                        Leaderboard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <PlayerListSkeleton />
                    ) : (
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
                                {players.map((player, index) => {
                                const rankChange = rankChanges.find(c => c.id === player.id);
                                const gap = index > 0 ? players[index - 1].score - player.score : null;

                                return (
                                    <PlayerRow
                                    key={player.id}
                                    player={player}
                                    rank={index + 1}
                                    gap={gap}
                                    recentlyUpdated={recentlyUpdated}
                                    rankChange={rankChange}
                                    onAnimationEnd={() => setRankChanges(rc => rc.filter(c => c.id !== player.id))}
                                    />
                                );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </main>
        
        <aside>
            <Card className="w-full sticky top-24">
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <Gamepad2 />
                        Manage Points
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddPlayer} className="flex w-full max-w-sm items-center gap-2 mb-4">
                        <Input
                            placeholder="Add new player and press Enter"
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            disabled={isPending}
                            className="w-full"
                            aria-label="New player name"
                        />
                    </form>
                    <ScrollArea className="h-[calc(100vh-22rem)]">
                        <Table>
                        <TableBody>
                            {isLoading ? (
                            <ManagementSkeleton />
                            ) : players && players.length > 0 ? (
                            players.map((player) => (
                                <TableRow key={player.id} className="transition-colors duration-300">
                                    <TableCell className="font-medium">{player.name}</TableCell>
                                    <TableCell className='text-right w-[100px]'>
                                        <Input
                                        type="number"
                                        placeholder="0"
                                        className="h-9 text-center ml-auto"
                                        value={pointInputs[player.id] || ''}
                                        onChange={(e) => handlePointInputChange(player.id, e.target.value)}
                                        disabled={isPending}
                                        aria-label={`Points for ${player.name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right w-[140px] space-x-1">
                                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleScoreChange(player.id, parseInt(pointInputs[player.id] || '0'))} disabled={isPending || !pointInputs[player.id]} aria-label={`Increase score for ${player.name}`}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleScoreChange(player.id, -parseInt(pointInputs[player.id] || '0'))} disabled={isPending || !pointInputs[player.id]} aria-label={`Decrease score for ${player.name}`}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => { setPlayerToDelete(player); setDeleteAlertOpen(true); }} disabled={isPending} aria-label={`Delete player ${player.name}`}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
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

interface PlayerRowProps {
  player: Player;
  rank: number;
  gap: number | null;
  recentlyUpdated: string | null;
  rankChange: RankChange | undefined;
  onAnimationEnd: () => void;
}

function PlayerRow({ player, rank, gap, recentlyUpdated, rankChange, onAnimationEnd }: PlayerRowProps) {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const initialRect = useRef<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (rowRef.current) {
        initialRect.current = rowRef.current.getBoundingClientRect();
    }
  }, [player.id, rank]);

  useLayoutEffect(() => {
    if (!rankChange || !rowRef.current || !initialRect.current) {
      return;
    }
    const newRect = rowRef.current.getBoundingClientRect();
    const oldRect = initialRect.current;
    
    const deltaY = oldRect.top - newRect.top;

    if (deltaY !== 0) {
      rowRef.current.style.setProperty('--delta-y', `${deltaY}px`);
      const animationName = rankChange.newRank > rankChange.oldRank ? 'slide-down' : 'slide-up';
      rowRef.current.style.setProperty('--animation-name', animationName);

      requestAnimationFrame(() => {
        if (!rowRef.current) return;
        rowRef.current.classList.add('ranking-change');
      });
    }

  }, [rankChange, player.score]);


  const handleAnimationEnd = () => {
    if(rowRef.current) {
      rowRef.current.classList.remove('ranking-change');
      rowRef.current.style.removeProperty('--delta-y');
      rowRef.current.style.removeProperty('--animation-name');
    }
    onAnimationEnd();
  };

  const getRankClasses = (rank: number) => {
    switch (rank) {
      case 1: return "text-yellow-400 font-bold";
      case 2: return "text-slate-400 font-semibold";
      case 3: return "text-orange-400 font-medium";
      default: return "text-muted-foreground";
    }
  };

  return (
    <TableRow
      ref={rowRef}
      onAnimationEnd={handleAnimationEnd}
      className={cn(
        'will-change-transform',
        recentlyUpdated === player.id && 'bg-primary/10',
      )}
    >
      <TableCell className={cn("text-center font-medium text-lg", getRankClasses(rank))}>
        {rank}
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
}

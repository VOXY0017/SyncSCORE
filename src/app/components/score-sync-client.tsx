'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import type { Player } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Plus, Minus, Trash2, Trophy, Crown, UserPlus, Gamepad2, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function ScoreSyncClient() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState<string | null>(null);
  const [rankChanged, setRankChanged] = useState<string[]>([]);
  const [pointInputs, setPointInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setPlayers([]); // Start with an empty array
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    startTransition(() => {
      const trimmedName = newPlayerName.trim();
      
      if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ variant: "destructive", title: "Error", description: "A player with this name already exists." });
        return;
      }
      
      const newPlayer: Player = {
        id: new Date().getTime().toString(), // Simple unique ID
        name: trimmedName,
        score: 0,
      };
      
      setPlayers(prevPlayers => 
        [...prevPlayers, newPlayer].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      );
      setNewPlayerName('');
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
          const oldRanks = new Map(prevPlayers.map((p, i) => [p.id, i]));

          const updatedPlayers = prevPlayers.map(p => 
            p.id === playerId ? { ...p, score: p.score + change } : p
          );
          
          const sortedPlayers = [...updatedPlayers].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
          
          const newRanks = new Map(sortedPlayers.map((p, i) => [p.id, i]));
          
          const changedRanks: string[] = [];
          newRanks.forEach((newRank, id) => {
            if (oldRanks.get(id) !== newRank) {
              changedRanks.push(id);
            }
          });

          if (changedRanks.length > 0) {
            setRankChanged(changedRanks);
            setTimeout(() => setRankChanged([]), 1500);
          }

          return sortedPlayers;
       });
    });
  };
  
  const handlePointInputChange = (playerId: string, value: string) => {
    setPointInputs(prev => ({...prev, [playerId]: value}));
  }

  const confirmDeletePlayer = () => {
    if (!playerToDelete) return;

    startTransition(() => {
      setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== playerToDelete.id));
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
    {[...Array(3)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
        <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
      </TableRow>
    ))}
    </>
  );

  const ManagementSkeleton = () => (
    <>
    {[...Array(3)].map((_, i) => (
        <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-2/4" /></TableCell>
            <TableCell><Skeleton className="h-9 w-20" /></TableCell>
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
    <>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
            <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
            <Trophy className="h-8 w-8" />
            ScoreSync
            </CardTitle>
            <CardDescription className="mt-1">A simple client-side scoreboard</CardDescription>
        </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard Column */}
        <div className="lg:col-span-2">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Medal />
                        Leaderboard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[calc(100vh-250px)] rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px] text-center font-bold">Rank</TableHead>
                                    <TableHead className="font-bold">Player</TableHead>
                                    <TableHead className="w-[100px] text-center font-bold">Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {isLoading ? (
                                <PlayerListSkeleton />
                            ) : players && players.length > 0 ? (
                                players.map((player, index) => (
                                <TableRow key={player.id} className={cn(
                                    'transition-all duration-500 ease-in-out',
                                    recentlyUpdated === player.id && 'bg-accent/20',
                                    rankChanged.includes(player.id) && 'bg-blue-200 dark:bg-blue-800/30'
                                )}
                                style={{ transform: `translateY(0px)` }}
                                >
                                    <TableCell className="text-center font-medium text-lg">
                                    {index === 0 ? <Crown className="w-6 h-6 mx-auto text-yellow-500" /> : index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium text-lg">{player.name}</TableCell>
                                    <TableCell className="text-center font-bold text-xl text-primary">
                                    {player.score > 0 ? `+${player.score}` : player.score}
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    No players yet. Add one to get started!
                                    </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>

        {/* Management Column */}
        <div className="lg:col-span-1">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Gamepad2 />
                        Manage Points
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddPlayer} className="flex w-full gap-2 mb-4">
                        <Input
                        placeholder="New player name..."
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        disabled={isPending}
                        className="w-full"
                        aria-label="New player name"
                        />
                        <Button type="submit" disabled={isPending || !newPlayerName.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add
                        </Button>
                    </form>

                    <ScrollArea className="h-[calc(100vh-328px)] rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Player</TableHead>
                                    <TableHead className="w-[120px]">Points</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <ManagementSkeleton />
                                ) : players && players.length > 0 ? (
                                    players.map((player) => (
                                        <TableRow key={player.id} className={cn(
                                            'transition-colors duration-300',
                                            recentlyUpdated === player.id && 'bg-accent/20'
                                        )}>
                                            <TableCell className="font-medium">{player.name}</TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number"
                                                    placeholder="0"
                                                    className="w-20 h-9 text-center"
                                                    value={pointInputs[player.id] || ''}
                                                    onChange={(e) => handlePointInputChange(player.id, e.target.value)}
                                                    disabled={isPending}
                                                    aria-label={`Points for ${player.name}`}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <Button variant="outline" size="icon" onClick={() => handleScoreChange(player.id, parseInt(pointInputs[player.id] || '0'))} disabled={isPending || !pointInputs[player.id]} aria-label={`Increase score for ${player.name}`}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="icon" onClick={() => handleScoreChange(player.id, -parseInt(pointInputs[player.id] || '0'))} disabled={isPending || !pointInputs[player.id]} aria-label={`Decrease score for ${player.name}`}>
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="destructive" size="icon" onClick={() => { setPlayerToDelete(player); setDeleteAlertOpen(true); }} disabled={isPending} aria-label={`Delete player ${player.name}`}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
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
        </div>
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
    </>
  );
}


'use client';

import * as React from 'react';
import { useState, useTransition, useEffect } from 'react';
import type { Player, ScoreEntry } from '@/lib/types';
import Link from 'next/link';
import { useData } from '@/app/context/data-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
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
import { Plus, Minus, X, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


export default function PlayerManagement() {
  const { players, setPlayers, history, setHistory } = useData();
  const [sortedPlayers, setSortedPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const [isResetAlertOpen, setResetAlertOpen] = useState(false);
  
  const [pointInputs, setPointInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (players !== undefined) {
        setSortedPlayers([...players].sort((a, b) => a.name.localeCompare(b.name)));
        setIsLoading(false);
    }
  }, [players]);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPlayerName.trim();
    if (!trimmedName || players === undefined) return;
    
    // check for duplicate name
    if (players.find(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ title: "Player Exists", description: "A player with that name already exists.", variant: "destructive" });
        return;
    }

    startTransition(() => {
      const newPlayer: Player = {
        id: crypto.randomUUID(),
        name: trimmedName,
        score: 0,
      };
      setPlayers(prev => [...(prev || []), newPlayer]);
      setNewPlayerName('');
      toast({ title: "Player Added", description: `${trimmedName} has joined the game!`});
    });
  };

  const handleScoreChange = (playerId: string, change: number) => {
    if (isNaN(change) || change === 0 || players === undefined || history === undefined) return;
    
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    startTransition(() => {
        setPlayers(prev => 
            (prev || []).map(p => p.id === playerId ? {...p, score: p.score + change} : p)
        );
        
        const newHistoryEntry: ScoreEntry = {
            id: crypto.randomUUID(),
            points: change,
            timestamp: new Date(),
            playerName: player.name,
        }
        setHistory(prev => [...(prev || []), newHistoryEntry]);

        setPointInputs(prev => ({...prev, [playerId]: ''}));
        toast({ title: "Score Updated", description: `Score for ${player.name} has been updated by ${change}.`});
    });
  };
  
  const handlePointInputChange = (playerId: string, value: string) => {
    setPointInputs(prev => ({...prev, [playerId]: value}));
  }

  const confirmDeletePlayer = () => {
    if (!playerToDelete) return;

    startTransition(() => {
      setPlayers(prev => (prev || []).filter(p => p.id !== playerToDelete.id));
      setHistory(prev => (prev || []).filter(h => h.playerName !== playerToDelete.name));
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

  const confirmResetScores = () => {
    startTransition(() => {
        setPlayers(prev => (prev || []).map(p => ({...p, score: 0})));
        setHistory([]);
        toast({ title: "Scores Reset", description: "All player scores have been set to 0 and history cleared."});
        setResetAlertOpen(false);
    });
  };

  const ManagementSkeleton = () => (
    <>
    {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
            <TableCell className="p-2 w-[40px]"><Skeleton className="h-8 w-8" /></TableCell>
            <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
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
    <>
        <Card id="player-management" className="w-full shadow-none border-0 rounded-t-none">
            <CardContent className="p-2 sm:p-6 space-y-4">
                <div className="flex w-full flex-col sm:flex-row items-center gap-2">
                    <form onSubmit={handleAddPlayer} className="flex-grow w-full">
                        <Input
                            placeholder="Add new player and press Enter..."
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            disabled={isPending || isLoading}
                            className="h-9 text-sm"
                            aria-label="New player name"
                        />
                    </form>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setResetAlertOpen(true)} disabled={isPending || isLoading || !players || players.length === 0} aria-label="Reset all scores">
                        <RotateCcw className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Reset All</span>
                    </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-22rem)] sm:h-[calc(100vh-23rem)]">
                    <Table>
                    <TableBody>
                        {isLoading ? (
                        <ManagementSkeleton />
                        ) : sortedPlayers && sortedPlayers.length > 0 ? (
                        sortedPlayers.map((player) => (
                            <TableRow key={player.id}>
                                <TableCell className="p-2 w-[40px]">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { setPlayerToDelete(player); setDeleteAlertOpen(true); }} disabled={isPending} aria-label={`Delete player ${player.name}`}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                                <TableCell className="font-medium p-2 text-sm w-full">
                                    <Link href={`/history/${player.id}`} className="hover:underline">
                                        {player.name}
                                    </Link>
                                </TableCell>
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
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            {isLoading ? 'Loading players...' : 'Add a player to begin.'}
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={handleAlertOpenChange}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete <strong>{playerToDelete?.name}</strong> and all of their score history.
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
        
        <AlertDialog open={isResetAlertOpen} onOpenChange={setResetAlertOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Reset all scores?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will reset the score of every player to 0 and clear all score histories.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmResetScores} disabled={isPending}>
                {isPending ? "Resetting..." : "Reset Scores"}
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

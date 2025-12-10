'use client';

import * as React from 'react';
import { useState, useTransition, useMemo, useEffect } from 'react';
import type { Player } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  incrementScore,
} from '@/firebase/non-blocking-updates';
import { collection, doc, query, orderBy, writeBatch, serverTimestamp, getDocs } from 'firebase/firestore';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Minus, X, Trophy, Users, RotateCcw, History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { initiateAnonymousSignIn, useAuth } from '@/firebase';

export default function PlayerManagement() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const playersCollectionRef = useMemoFirebase(() => collection(firestore, 'players'), [firestore]);
  const playersQuery = useMemoFirebase(() => query(playersCollectionRef, orderBy('name', 'asc')), [playersCollectionRef]);
  
  const { data: players, isLoading: isPlayersLoading } = useCollection<Player>(playersQuery);
  const isLoading = isUserLoading || isPlayersLoading;

  const [newPlayerName, setNewPlayerName] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const [isResetAlertOpen, setResetAlertOpen] = useState(false);
  
  const [pointInputs, setPointInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPlayerName.trim();
    if (!trimmedName || !user) return;

    startTransition(() => {
      const newPlayer: Omit<Player, 'id'> = {
        name: trimmedName,
        score: 0,
        ownerId: user.uid,
      };
      addDocumentNonBlocking(playersCollectionRef, newPlayer);
      setNewPlayerName('');
      toast({ title: "Player Added", description: `${trimmedName} has joined the game!`});
    });
  };

  const handleScoreChange = (playerId: string, change: number) => {
    if (isNaN(change) || change === 0 || !firestore) return;
    
    const player = players?.find(p => p.id === playerId);
    if (!player) return;

    startTransition(() => {
      const playerDocRef = doc(firestore, 'players', playerId);
      const scoreHistoryRef = collection(playerDocRef, 'scoreHistory');
      
      const batch = writeBatch(firestore);

      // 1. Update total score
      batch.update(playerDocRef, { score: incrementScore(change) });

      // 2. Add to score history
      batch.set(doc(scoreHistoryRef), {
        points: change,
        timestamp: serverTimestamp(),
        playerName: player.name, // Add player name to history
      });
      
      batch.commit().then(() => {
        setPointInputs(prev => ({...prev, [playerId]: ''}));
      }).catch(err => {
        console.error(err);
        toast({ variant: 'destructive', title: "Error", description: "Could not update score."});
      });
    });
  };
  
  const handlePointInputChange = (playerId: string, value: string) => {
    setPointInputs(prev => ({...prev, [playerId]: value}));
  }

  const confirmDeletePlayer = () => {
    if (!playerToDelete || !firestore) return;

    startTransition(async () => {
      // First, delete subcollection documents
      const scoreHistoryRef = collection(firestore, 'players', playerToDelete.id, 'scoreHistory');
      const scoreHistorySnapshot = await getDocs(scoreHistoryRef);
      const deleteSubDocsBatch = writeBatch(firestore);
      scoreHistorySnapshot.forEach(doc => {
        deleteSubDocsBatch.delete(doc.ref);
      });
      await deleteSubDocsBatch.commit();
      
      // Then, delete the player document
      const playerDocRef = doc(firestore, 'players', playerToDelete.id);
      deleteDocumentNonBlocking(playerDocRef);
      
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
    if (!players || !firestore) return;
    
    startTransition(async () => {
        const batch = writeBatch(firestore);
        
        for (const player of players) {
          const playerRef = doc(firestore, 'players', player.id);
          batch.update(playerRef, { score: 0 });

          const scoreHistoryRef = collection(playerRef, 'scoreHistory');
          const scoreHistorySnapshot = await getDocs(scoreHistoryRef);
          scoreHistorySnapshot.forEach(doc => {
              batch.delete(doc.ref);
          });
        }

        batch.commit().then(() => {
            toast({ title: "Scores Reset", description: "All player scores have been set to 0 and histories cleared."});
        }).catch(err => {
            console.error(err);
            toast({ variant: 'destructive', title: "Error", description: "Could not reset scores."});
        });
        setResetAlertOpen(false);
    });
  };

  const ManagementSkeleton = () => (
    <>
    {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
            <TableCell className="p-2 w-[40px]"><Skeleton className="h-8 w-8" /></TableCell>
            <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
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
      <div className="container flex-grow max-w-screen-lg mx-auto py-4 sm:py-8 relative z-10">
        <Card id="player-management" className="w-full shadow-md">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between gap-3 text-xl sm:text-2xl">
                    <div className="flex items-center gap-3">
                        <Users className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                        Player Management
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setResetAlertOpen(true)} disabled={isPending || isLoading || !players || players.length === 0} aria-label="Reset all scores">
                            <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild aria-label="Go to Leaderboard">
                            <Link href="/">
                                <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
                            </Link>
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddPlayer} className="flex w-full items-center gap-2 mb-4">
                    <Input
                        placeholder="Add new player and press Enter..."
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        disabled={isPending || isLoading}
                        className="h-8 text-sm"
                        aria-label="New player name"
                    />
                </form>
                <ScrollArea className="h-[calc(100vh-13rem)] sm:h-[calc(100vh-14rem)]">
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
                                <TableCell className="font-medium p-2 text-sm w-full">
                                    <Link href={`/history/${player.id}`} className="hover:underline">
                                        {player.name}
                                    </Link>
                                </TableCell>
                                <TableCell className="p-2 w-[40px]">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" asChild>
                                      <Link href={`/history/${player.id}`}>
                                          <History className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                </TableCell>
                                <TableCell className='text-right p-2'>
                                    <Input
                                    type="number"
                                    placeholder="Pts"
                                    className="h-8 text-center ml-auto text-sm w-16"
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
                            {isPlayersLoading ? 'Loading players...' : 'Add a player to begin.'}
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
      </div>

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

    </div>
  );
}

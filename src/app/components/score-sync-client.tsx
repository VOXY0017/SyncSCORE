'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Player } from '@/lib/types';
import { ThemeToggle } from './theme-toggle';

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
import { Plus, Minus, Trash2, Trophy, Gamepad2, Users, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { addPlayer, removePlayer, updatePlayerScore } from '../actions';
import { collection, query, orderBy } from 'firebase/firestore';

export default function ScoreSyncClient() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const playersQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      const q = query(
        collection(firestore, 'players'),
        orderBy('score', 'desc'),
        orderBy('name', 'asc')
      );
      return q;
    },
    [firestore]
  );
  
  const { data: players, isLoading: isPlayersLoading, error: playersError } = useCollection<Player>(playersQuery);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  
  const [pointInputs, setPointInputs] = useState<Record<string, string>>({});
  
  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPlayerName.trim();
    if (!trimmedName || !firestore) return;

    startTransition(async () => {
      const result = await addPlayer(firestore, trimmedName);
      if (result.success) {
        setNewPlayerName('');
        toast({ title: "Player Added", description: `${trimmedName} has joined the game!`});
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  };

  const handleScoreChange = (playerId: string, change: number) => {
    if (isNaN(change) || change === 0 || !firestore) return;
    const scoreChange = Math.abs(change) * (change > 0 ? 1 : -1) as 1 | -1;
    
    startTransition(async () => {
       await updatePlayerScore(firestore, playerId, scoreChange);
       setPointInputs(prev => ({...prev, [playerId]: ''}));
    });
  };
  
  const handlePointInputChange = (playerId: string, value: string) => {
    setPointInputs(prev => ({...prev, [playerId]: value}));
  }

  const confirmDeletePlayer = () => {
    if (!playerToDelete || !firestore) return;

    startTransition(async () => {
      const result = await removePlayer(firestore, playerToDelete.id);
      if(result.success) {
        toast({ title: "Player Removed", description: `${playerToDelete.name} has been removed.`});
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
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

  const handleSignOut = () => {
    if (auth) {
      signOut(auth);
      router.push('/login');
    }
  };

  const isLoading = isUserLoading || isPlayersLoading;

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

  if (isUserLoading || !user) {
    return (
        <div className="flex items-center justify-center min-h-screen w-full bg-background dark:bg-black">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="h-6 w-6 animate-spin" />
                <span>Loading Scoreboard...</span>
            </div>
        </div>
    )
  }
  
  return (
    <div className="min-h-screen w-full bg-background dark:bg-black dark:bg-dot-white/[0.2] bg-dot-black/[0.2] relative flex flex-col">
       <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      
       <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <div className="flex items-center gap-3">
              <Trophy className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">ScoreSync</h1>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4"/>
                Logout
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container flex-grow max-w-screen-2xl mx-auto py-6 sm:py-10 grid md:grid-cols-[1fr_400px] gap-8">
        <main>
            <Card className="shadow-lg h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Users />
                        Leaderboard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[calc(100vh-14rem)]">
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
                                            <TableRow key={player.id}>
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
            <Card className="w-full sticky top-24 h-fit">
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

    
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Player } from '@/lib/types';
import { useAuth, useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy } from 'firebase/firestore';
import { addPlayer, updatePlayerScore, removePlayer } from '@/app/actions';

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
import { Plus, Minus, Trash2, Trophy, Crown, UserPlus, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function ScoreSyncClient() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);
  
  const playersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null; // Wait for user and firestore to be ready
    return query(collection(firestore, 'players'), orderBy('score', 'desc'), orderBy('name', 'asc'));
  }, [firestore, user]);

  const { data: players, isLoading, error } = useCollection<Player>(playersQuery);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Firebase Error",
        description: error.message || "Failed to load player data. Check console and Firebase setup.",
      });
    }
  }, [error, toast]);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim() || !firestore) return;

    startTransition(async () => {
      const result = await addPlayer(firestore, newPlayerName);
      if (result.success) {
        setNewPlayerName('');
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  };
  
  const triggerUpdateAnimation = useCallback((playerId: string) => {
    setRecentlyUpdated(playerId);
    setTimeout(() => setRecentlyUpdated(null), 1500);
  }, []);

  const handleScoreChange = (playerId: string, change: 1 | -1) => {
    if (!firestore) return;
    triggerUpdateAnimation(playerId);
    startTransition(async () => {
      const result = await updatePlayerScore(firestore, playerId, change);
      if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  };

  const confirmDeletePlayer = () => {
    if (!playerToDelete || !firestore) return;

    startTransition(async () => {
      const result = await removePlayer(firestore, playerToDelete.id);
      if (!result.success) {
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

  const handleLogout = () => {
    signOut(auth); // Direct call to signOut
  };

  const PlayerListSkeleton = () => (
    [...Array(5)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
        <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
        <TableCell className="flex justify-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
        </TableCell>
      </TableRow>
    ))
  );
  
  // While checking auth state or waiting for user, show a full-card skeleton.
  if (isUserLoading || !user) {
    return (
        <Card className="w-full max-w-4xl shadow-2xl shadow-primary/10">
            <CardHeader>
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <PlayerListSkeleton />
                </TableBody>
              </Table>
            </CardContent>
        </Card>
    );
  }

  return (
    <>
    <Card className="w-full shadow-2xl shadow-primary/10">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-grow">
            <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
              <Trophy className="h-8 w-8" />
              ScoreSync
            </CardTitle>
            <CardDescription className="mt-1">Real-time multiplayer scoreboard powered by Firebase</CardDescription>
          </div>
           <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
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
              Add Player
            </Button>
          </form>
        <ScrollArea className="h-[55vh] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-center font-bold">Rank</TableHead>
                <TableHead className="font-bold">Player</TableHead>
                <TableHead className="w-[100px] text-center font-bold">Score</TableHead>
                <TableHead className="w-[160px] text-center font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <PlayerListSkeleton />
              ) : players && players.length > 0 ? (
                players.map((player, index) => (
                  <TableRow key={player.id} className={cn(recentlyUpdated === player.id && 'bg-accent/20', 'transition-colors duration-1000 ease-out')}>
                    <TableCell className="text-center font-medium text-lg">
                      {index === 0 ? <Crown className="w-6 h-6 mx-auto text-yellow-500" /> : index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-lg">{player.name}</TableCell>
                    <TableCell className="text-center font-bold text-xl text-primary">{player.score}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center gap-2">
                         <Button variant="outline" size="icon" onClick={() => handleScoreChange(player.id, 1)} disabled={isPending} aria-label={`Increase score for ${player.name}`}>
                           <Plus className="h-4 w-4" />
                         </Button>
                         <Button variant="outline" size="icon" onClick={() => handleScoreChange(player.id, -1)} disabled={isPending} aria-label={`Decrease score for ${player.name}`}>
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
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No players yet. Add one to get started!
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

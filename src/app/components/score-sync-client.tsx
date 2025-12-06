'use client';

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import type { Player } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
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
import { Plus, Minus, Trash2, Trophy, Crown, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';


export default function ScoreSyncClient() {
  const firestore = useFirestore();
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState<string | null>(null);
  
  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('score', 'desc'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: players, isLoading, error } = useCollection<Player>(playersQuery);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Firebase Error",
        description: "Failed to load player data. Check console and Firebase setup.",
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
    });
  };

  const handleAlertOpenChange = (open: boolean) => {
    setDeleteAlertOpen(open);
    if (!open) {
      setPlayerToDelete(null);
    }
  }

  const PlayerListSkeleton = () => (
    [...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2 flex-grow">
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
    ))
  );

  return (
    <>
    <Card className="w-full shadow-2xl shadow-primary/10">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
              <Trophy className="h-8 w-8" />
              ScoreSync
            </CardTitle>
            <CardDescription className="mt-1">Real-time multiplayer scoreboard powered by Firebase</CardDescription>
          </div>
          <form onSubmit={handleAddPlayer} className="flex w-full sm:w-auto gap-2">
            <Input
              placeholder="New player name..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              disabled={isPending}
              className="w-full sm:w-48"
              aria-label="New player name"
            />
            <Button type="submit" disabled={isPending || !newPlayerName.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <UserPlus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </form>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh] rounded-md border">
          {isLoading ? (
            <div className="p-4"><PlayerListSkeleton /></div>
          ) : (
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
                {players && players.length > 0 ? (
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
                           <Button variant="destructive" size="icon" onClick={() => { setPlayerToDelete(player); setDeleteAlertOpen(true); }} aria-label={`Delete player ${player.name}`}>
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
          )}
        </ScrollArea>
      </CardContent>
    </Card>

    <AlertDialog open={isDeleteAlertOpen} onOpenChange={handleAlertOpenChange}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
            This action cannot be undone. This will permanently delete <strong>{playerToDelete?.name}</strong> and all their score data.
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

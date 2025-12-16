'use client';

import * as React from 'react';
import { useState, useTransition, useEffect } from 'react';
import type { Player, ScoreEntry } from '@/lib/types';
import Link from 'next/link';
import { useData } from '@/app/context/data-context';
import { useFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent } from '@/components/ui/card';
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
import { Plus, Minus, X, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


export default function PlayerManagement() {
  const { players, history } = useData();
  const { firestore } = useFirebase();

  const [sortedPlayers, setSortedPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [isPending, startTransition] = useTransition();
  
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const [isResetAlertOpen, setResetAlertOpen] = useState(false);
  
  const [pointInputs, setPointInputs] = useState<Record<string, string>>({});
  
  const isPlayerLimitReached = players ? players.length >= 5 : false;

  useEffect(() => {
    if (players !== undefined) {
        setSortedPlayers([...players].sort((a, b) => a.name.localeCompare(b.name)));
        setIsLoading(false);
    }
  }, [players]);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPlayerName.trim();
    if (!trimmedName || !firestore || players === undefined || isPlayerLimitReached) return;
    
    if (players.find(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        return;
    }

    startTransition(() => {
      const newPlayer: Omit<Player, 'id'> = {
        name: trimmedName,
        score: 0,
      };
      const playersCollection = collection(firestore, 'players');
      addDocumentNonBlocking(playersCollection, newPlayer);
      setNewPlayerName('');
    });
  };

  const handleScoreChange = (playerId: string, change: number) => {
    if (isNaN(change) || change === 0 || !firestore || players === undefined || history === undefined) return;
    
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    startTransition(() => {
        const playerDocRef = doc(firestore, 'players', playerId);
        updateDocumentNonBlocking(playerDocRef, { score: player.score + change });
        
        const newHistoryEntry: Omit<ScoreEntry, 'id'> = {
            points: change,
            timestamp: new Date(),
            playerName: player.name,
        }
        const historyCollection = collection(firestore, 'history');
        addDocumentNonBlocking(historyCollection, newHistoryEntry);

        setPointInputs(prev => ({...prev, [playerId]: ''}));
    });
  };
  
  const handlePointInputChange = (playerId: string, value: string) => {
    setPointInputs(prev => ({...prev, [playerId]: value}));
  }

  const confirmDeletePlayer = () => {
    if (!playerToDelete || !firestore) return;

    startTransition(() => {
        const playerDocRef = doc(firestore, 'players', playerToDelete.id);
        deleteDocumentNonBlocking(playerDocRef);
        // Deleting history is more complex and might require a cloud function for atomicity.
        // For now, we'll leave the history.
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
      if (!firestore || !players) return;
    startTransition(() => {
        players.forEach(player => {
            const playerDocRef = doc(firestore, 'players', player.id);
            updateDocumentNonBlocking(playerDocRef, { score: 0 });
        });
        // This is a complex operation. A better approach would be a Cloud Function
        // to delete all documents in the history collection.
        setResetAlertOpen(false);
    });
  };

  const ManagementSkeleton = () => (
    <>
    {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
            <TableCell className="p-2 w-[40px]"><Skeleton className="h-8 w-8" /></TableCell>
            <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-8 w-40 ml-auto" /></TableCell>
        </TableRow>
    ))}
    </>
  );

  return (
    <>
      <CardContent className="p-0">
          <div className="p-2 sm:p-4">
              <div className="flex flex-row items-center gap-2">
                  <form onSubmit={handleAddPlayer} className="flex-grow">
                      <Input
                          placeholder={isPlayerLimitReached ? "Maksimal 5 pemain tercapai" : "Tambah pemain baru dan tekan Enter..."}
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          disabled={isPending || isLoading || isPlayerLimitReached}
                          className="h-8 text-sm"
                          aria-label="Nama pemain baru"
                      />
                  </form>
                  <Button variant="outline" size="sm" className="h-8" onClick={() => setResetAlertOpen(true)} disabled={isPending || isLoading || !players || players.length === 0} aria-label="Atur ulang semua skor">
                      <RotateCcw className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Atur Ulang</span>
                  </Button>
              </div>
          </div>
          <ScrollArea className="h-[calc(100vh-22.5rem)] sm:h-[calc(100vh-20.5rem)]">
              <Table>
              <TableBody>
                  {isLoading ? (
                  <ManagementSkeleton />
                  ) : sortedPlayers && sortedPlayers.length > 0 ? (
                  sortedPlayers.slice(0, 5).map((player) => (
                      <TableRow key={player.id}>
                          <TableCell className="p-1 sm:p-2 w-[40px]">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => { setPlayerToDelete(player); setDeleteAlertOpen(true); }} disabled={isPending} aria-label={`Hapus pemain ${player.name}`}>
                                  <X className="h-4 w-4" />
                              </Button>
                          </TableCell>
                          <TableCell className="font-medium p-1 sm:p-2 text-sm w-full">
                              <Link href={`/history/${player.id}`} className="hover:underline">
                                  {player.name}
                              </Link>
                          </TableCell>
                          <TableCell className="text-right p-1 sm:p-2">
                              <div className="flex items-center justify-end gap-1">
                                <Input
                                type="number"
                                placeholder="Poin"
                                className="h-8 text-center text-sm w-[70px]"
                                value={pointInputs[player.id] || ''}
                                onChange={(e) => handlePointInputChange(player.id, e.target.value)}
                                disabled={isPending}
                                aria-label={`Poin untuk ${player.name}`}
                                />
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleScoreChange(player.id, parseInt(pointInputs[player.id] || '0'))} disabled={isPending || !pointInputs[player.id]} aria-label={`Tambah skor untuk ${player.name}`}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleScoreChange(player.id, -parseInt(pointInputs[player.id] || '0'))} disabled={isPending || !pointInputs[player.id]} aria-label={`Kurangi skor untuk ${player.name}`}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                              </div>
                          </TableCell>
                      </TableRow>
                  ))
                  ) : (
                  <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      {isLoading ? 'Memuat pemain...' : 'Tambahkan pemain untuk memulai.'}
                      </TableCell>
                  </TableRow>
                  )}
              </TableBody>
              </Table>
          </ScrollArea>
      </CardContent>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={handleAlertOpenChange}>
          <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
              <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Ini akan menghapus <strong>{playerToDelete?.name}</strong> secara permanen. Riwayat skornya tidak akan dihapus.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeletePlayer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isPending}>
              {isPending ? "Menghapus..." : "Hapus"}
              </AlertDialogAction>
          </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isResetAlertOpen} onOpenChange={setResetAlertOpen}>
          <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Atur ulang semua skor?</AlertDialogTitle>
              <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Ini akan mengatur ulang skor setiap pemain menjadi 0. Riwayat skor tidak akan dihapus.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={confirmResetScores} disabled={isPending}>
              {isPending ? "Mengatur ulang..." : "Atur Ulang Skor"}
              </AlertDialogAction>
          </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

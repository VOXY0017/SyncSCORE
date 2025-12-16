'use client';

import * as React from 'react';
import { useState, useTransition, useEffect } from 'react';
import type { Player, ScoreEntry } from '@/lib/types';
import Link from 'next/link';
import { useData } from '@/app/context/data-context';
import { useFirebase } from '@/firebase';
import { collection, doc, writeBatch, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
import { Plus, Minus, X, RotateCcw, Undo2 } from 'lucide-react';
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
  const [isUndoAlertOpen, setUndoAlertOpen] = useState(false);
  
  const [pointInputs, setPointInputs] = useState<Record<string, string>>({});
  
  const isPlayerLimitReached = players ? players.length >= 5 : false;

  const canUndo = React.useMemo(() => {
    if (!players || players.length < 2 || !history) return false;
    const playerGameCounts = players.reduce((acc, player) => {
        acc[player.id] = history.filter(h => h.playerId === player.id).length;
        return acc;
    }, {} as Record<string, number>);
    if (Object.keys(playerGameCounts).length < players.length) return false;
    const completedRounds = Math.min(...Object.values(playerGameCounts));
    return completedRounds > 0;
  }, [players, history]);

  useEffect(() => {
    if (players !== undefined) {
        setSortedPlayers([...players].sort((a, b) => a.name.localeCompare(b.name)));
        setIsLoading(false);
    }
  }, [players]);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPlayerName.trim();
    if (!trimmedName || !firestore || players === undefined || isPlayerLimitReached || isPending) return;
    
    if (players.find(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        // Optionally, add user feedback here (e.g., a toast)
        return;
    }

    startTransition(() => {
      const newPlayer: Omit<Player, 'id'> = {
        name: trimmedName,
      };
      const playersCollection = collection(firestore, 'players');
      addDocumentNonBlocking(playersCollection, newPlayer);
      setNewPlayerName('');
    });
  };

  const handleScoreChange = (playerId: string, change: number) => {
    if (isNaN(change) || change === 0 || !firestore || history === undefined || isPending) return;

    // Validation for manual input
    if (Math.abs(change) > 500) {
        // Here you could show a toast or some other feedback
        console.warn("Input score is out of the accepted range (-500 to 500).");
        return;
    }

    startTransition(() => {
        const newHistoryEntry: Omit<ScoreEntry, 'id'> = {
            points: change,
            timestamp: new Date(),
            playerId: playerId,
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
    if (!playerToDelete || !firestore || isPending) return;

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
    if (isPending) return;
    setDeleteAlertOpen(open);
    if (!open) {
      setPlayerToDelete(null);
    }
  }

  const confirmResetScores = async () => {
      if (!firestore || !history || isPending) return;
      startTransition(async () => {
        const batch = writeBatch(firestore);
        history.forEach(entry => {
            const docRef = doc(firestore, 'history', entry.id);
            batch.delete(docRef);
        });
        await batch.commit();
        setResetAlertOpen(false);
      });
  };

  const confirmUndoLastRound = async () => {
    if (!firestore || !players || !history || !canUndo || isPending) return;

    startTransition(async () => {
        const batch = writeBatch(firestore);

        const playerHistories: Promise<void>[] = players.map(async (player) => {
            const q = query(
                collection(firestore, 'history'),
                where('playerId', '==', player.id),
                orderBy('timestamp', 'desc'),
                limit(1)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const lastEntry = snapshot.docs[0];
                batch.delete(lastEntry.ref);
            }
        });

        await Promise.all(playerHistories);
        await batch.commit();
        setUndoAlertOpen(false);
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
      <CardContent className="p-0 h-full flex flex-col">
          <div className="p-2 sm:p-4">
              <div className="flex flex-row items-center gap-2">
                  <form onSubmit={handleAddPlayer} className="flex-grow">
                      <Input
                          placeholder={isPlayerLimitReached ? "Maksimal 5 pemain tercapai" : "Tambah pemain baru dan tekan Enter..."}
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          disabled={isPending || isLoading || isPlayerLimitReached}
                          className="h-9 text-sm"
                          aria-label="Nama pemain baru"
                      />
                  </form>
                   <Button variant="outline" size="sm" className="h-9" onClick={() => setUndoAlertOpen(true)} disabled={isPending || isLoading || !canUndo} aria-label="Batalkan ronde terakhir">
                      <Undo2 className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Undo</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-9" onClick={() => setResetAlertOpen(true)} disabled={isPending || isLoading || !players || players.length === 0} aria-label="Atur ulang semua skor">
                      <RotateCcw className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Atur Ulang</span>
                  </Button>
              </div>
          </div>
          <div className="flex-grow">
              <Table>
              <TableBody>
                  {isLoading ? (
                  <ManagementSkeleton />
                  ) : sortedPlayers && sortedPlayers.length > 0 ? (
                  sortedPlayers.map((player) => (
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
                              <div className="flex items-center justify-end gap-1 flex-wrap">
                                <Button variant="outline" size="sm" className="h-9" onClick={() => handleScoreChange(player.id, 50)} disabled={isPending}>+50</Button>
                                <Button variant="outline" size="sm" className="h-9" onClick={() => handleScoreChange(player.id, 100)} disabled={isPending}>+100</Button>
                                <Button variant="outline" size="sm" className="h-9" onClick={() => handleScoreChange(player.id, 150)} disabled={isPending}>+150</Button>
                                <Button variant="destructive" size="sm" className="h-9" onClick={() => handleScoreChange(player.id, -150)} disabled={isPending}>-150</Button>
                                <Input
                                type="number"
                                placeholder="Poin"
                                className="h-9 text-center text-sm w-[70px]"
                                value={pointInputs[player.id] || ''}
                                onChange={(e) => handlePointInputChange(player.id, e.target.value)}
                                disabled={isPending}
                                aria-label={`Poin untuk ${player.name}`}
                                />
                                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleScoreChange(player.id, parseInt(pointInputs[player.id] || '0'))} disabled={isPending || !pointInputs[player.id]} aria-label={`Tambah skor untuk ${player.name}`}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleScoreChange(player.id, -parseInt(pointInputs[player.id] || '0'))} disabled={isPending || !pointInputs[player.id]} aria-label={`Kurangi skor untuk ${player.name}`}>
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
          </div>
      </CardContent>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={handleAlertOpenChange}>
          <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
              <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Ini akan menghapus <strong>{playerToDelete?.name}</strong> secara permanen. Riwayat skornya akan tetap ada.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeletePlayer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isPending}>
              {isPending ? "Menghapus..." : "Hapus"}
              </AlertDialogAction>
          </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isResetAlertOpen} onOpenChange={isPending ? () => {} : setResetAlertOpen}>
          <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Atur ulang semua skor?</AlertDialogTitle>
              <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Ini akan menghapus seluruh riwayat skor dan mengembalikan skor semua pemain ke 0.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={confirmResetScores} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isPending}>
              {isPending ? "Mengatur ulang..." : "Ya, Atur Ulang Skor"}
              </AlertDialogAction>
          </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isUndoAlertOpen} onOpenChange={isPending ? () => {} : setUndoAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Batalkan ronde terakhir?</AlertDialogTitle>
                <AlertDialogDescription>
                    Tindakan ini akan menghapus entri skor terakhir untuk setiap pemain di ronde yang sudah selesai. Ini tidak dapat dibatalkan.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={confirmUndoLastRound} disabled={isPending}>
                    {isPending ? "Membatalkan..." : "Ya, Batalkan"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


'use client';

import * as React from 'react';
import { useState, useTransition, useEffect } from 'react';
import type { Player, ScoreEntry } from '@/lib/types';
import Link from 'next/link';
import { useData } from '@/app/context/data-context';
import { useFirebase } from '@/firebase';
import { collection, doc, writeBatch, deleteDoc } from 'firebase/firestore';
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
import { Plus, Minus, X, RotateCcw, Undo2, Undo } from 'lucide-react';
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
  const [isUndoRoundAlertOpen, setUndoRoundAlertOpen] = useState(false);
  const [isUndoEntryAlertOpen, setUndoEntryAlertOpen] = useState(false);
  
  const [pointInputs, setPointInputs] = useState<Record<string, string>>({});
  
  const isPlayerLimitReached = players ? players.length >= 5 : false;

  const canUndoRound = React.useMemo(() => {
    if (!players || players.length < 2 || !history) return false;
    const playerGameCounts = players.reduce((acc, player) => {
        acc[player.id] = history.filter(h => h.playerId === player.id).length;
        return acc;
    }, {} as Record<string, number>);

    if (Object.keys(playerGameCounts).length < players.length) return false;
    const gameCounts = Object.values(playerGameCounts);
    if (gameCounts.length === 0 || !gameCounts.every(count => count > 0)) return false;
    
    // Check if all players have the same number of games played
    const firstCount = gameCounts[0];
    const allHaveSameCount = gameCounts.every(count => count === firstCount);
    
    return allHaveSameCount && firstCount > 0;
}, [players, history]);

  const canUndoEntry = history && history.length > 0;

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

    if (Math.abs(change) > 500) {
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
    if (!firestore || !players || !history || !canUndoRound || isPending) return;

    startTransition(async () => {
        const batch = writeBatch(firestore);
        
        // Find the last entry for each player
        for (const player of players) {
            const playerHistory = history.filter(h => h.playerId === player.id);
            // The history is already sorted by timestamp desc, so the first element is the latest
            if (playerHistory.length > 0) {
                const lastEntryForPlayer = playerHistory[0];
                const docRef = doc(firestore, 'history', lastEntryForPlayer.id);
                batch.delete(docRef);
            }
        }

        await batch.commit();
        setUndoRoundAlertOpen(false);
    });
};
  
  const confirmUndoLastEntry = async () => {
    if (!firestore || !history || history.length === 0 || isPending) return;
    startTransition(async () => {
        const lastEntryId = history[0].id;
        const docRef = doc(firestore, 'history', lastEntryId);
        await deleteDoc(docRef);
        setUndoEntryAlertOpen(false);
    });
  };

  const ManagementSkeleton = () => (
    <>
    {[...Array(3)].map((_, i) => (
        <TableRow key={i}>
            <TableCell className="p-1 sm:p-2 w-[40px]"><Skeleton className="h-8 w-8" /></TableCell>
            <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-8 w-40 ml-auto" /></TableCell>
        </TableRow>
    ))}
    </>
  );

  return (
    <>
      <CardContent className="p-0 h-full flex flex-col">
          <div className="p-2 space-y-2">
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
              <div className="flex flex-row items-center gap-2">
                  <div className="flex-grow flex gap-2">
                    <Button variant="outline" size="sm" className="h-9" onClick={() => setUndoEntryAlertOpen(true)} disabled={isPending || isLoading || !canUndoEntry} aria-label="Batalkan input terakhir">
                        <Undo className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Undo Input</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-9" onClick={() => setUndoRoundAlertOpen(true)} disabled={isPending || isLoading || !canUndoRound} aria-label="Batalkan ronde terakhir">
                        <Undo2 className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Undo Ronde</span>
                    </Button>
                  </div>
                  <Button variant="destructive" size="sm" className="h-9" onClick={() => setResetAlertOpen(true)} disabled={isPending || isLoading || !players || players.length === 0} aria-label="Atur ulang semua skor">
                      <RotateCcw className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Atur Ulang</span>
                  </Button>
              </div>
          </div>
          <div className="flex-grow overflow-auto">
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
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center justify-end gap-1">
                                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => handleScoreChange(player.id, 50)} disabled={isPending}>
                                        <Plus className="h-4 w-4 mr-1" />50
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => handleScoreChange(player.id, 100)} disabled={isPending}>
                                        <Plus className="h-4 w-4 mr-1" />100
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => handleScoreChange(player.id, 150)} disabled={isPending}>
                                        <Plus className="h-4 w-4 mr-1" />150
                                    </Button>
                                </div>
                                <div className="flex items-center justify-end gap-1">
                                    <Button variant="destructive" size="sm" className="h-8 px-2" onClick={() => handleScoreChange(player.id, -150)} disabled={isPending}>
                                        <Minus className="h-4 w-4 mr-1" />150
                                    </Button>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9-]*"
                                        placeholder="Poin"
                                        className="h-8 text-center text-sm w-[70px] px-1"
                                        value={pointInputs[player.id] || ''}
                                        onChange={(e) => handlePointInputChange(player.id, e.target.value.replace(/[^0-9-]/g, ''))}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleScoreChange(player.id, parseInt(pointInputs[player.id] || '0'));
                                            }
                                        }}
                                        disabled={isPending}
                                        aria-label={`Poin untuk ${player.name}`}
                                    />
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleScoreChange(player.id, parseInt(pointInputs[player.id] || '0'))} disabled={isPending || !pointInputs[player.id]} aria-label={`Tambah skor untuk ${player.name}`}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
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

      <AlertDialog open={isUndoRoundAlertOpen} onOpenChange={isPending ? () => {} : setUndoRoundAlertOpen}>
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
                    {isPending ? "Membatalkan..." : "Ya, Batalkan Ronde"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isUndoEntryAlertOpen} onOpenChange={isPending ? () => {} : setUndoEntryAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Batalkan input terakhir?</AlertDialogTitle>
                <AlertDialogDescription>
                    Tindakan ini akan menghapus entri skor terakhir yang dimasukkan. Ini tidak dapat dibatalkan.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={confirmUndoLastEntry} disabled={isPending}>
                    {isPending ? "Membatalkan..." : "Ya, Batalkan Input"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

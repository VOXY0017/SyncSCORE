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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
    if (gameCounts.length === 0) return false;
    
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
    const sanitizedValue = value.replace(/[^0-9]/g, '');
    setPointInputs(prev => ({...prev, [playerId]: sanitizedValue}));
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
        
        const playerGameCounts = players.reduce((acc, player) => {
            acc[player.id] = history.filter(h => h.playerId === player.id).length;
            return acc;
        }, {} as Record<string, number>);

        const minGameCount = Math.min(...Object.values(playerGameCounts));
        if (minGameCount === 0) return;

        const lastRoundIndex = minGameCount - 1;

        for (const player of players) {
            const playerHistory = history
                .filter(h => h.playerId === player.id)
                .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            if (playerHistory.length >= minGameCount) {
                const entryToDelete = playerHistory[lastRoundIndex];
                 if (entryToDelete) {
                    const docRef = doc(firestore, 'history', entryToDelete.id);
                    batch.delete(docRef);
                }
            }
        }

        await batch.commit();
        setUndoRoundAlertOpen(false);
    });
};
  
  const confirmUndoLastEntry = async () => {
    if (!firestore || !history || history.length === 0 || isPending) return;
    startTransition(async () => {
        // history is already sorted by timestamp desc
        const lastEntryId = history[0].id;
        const docRef = doc(firestore, 'history', lastEntryId);
        await deleteDoc(docRef);
        setUndoEntryAlertOpen(false);
    });
  };

  const ManagementSkeleton = () => (
    <div className="space-y-4 px-2 sm:px-0">
    {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-7 w-7" />
          </div>
          <Separator />
          <div className="flex justify-around gap-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Separator />
           <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-9 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-16" />
              </div>
          </div>
        </Card>
    ))}
    </div>
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
                      className="h-9"
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
          <div className="flex-grow overflow-auto p-2 sm:p-0">
              <div className="space-y-4">
                  {isLoading ? (
                    <ManagementSkeleton />
                  ) : sortedPlayers && sortedPlayers.length > 0 ? (
                    sortedPlayers.map((player) => (
                      <Card key={player.id} className="p-3 sm:p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <Link href={`/history/${player.id}`} className="hover:underline font-bold text-lg">
                                {player.name}
                            </Link>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => { setPlayerToDelete(player); setDeleteAlertOpen(true); }} disabled={isPending} aria-label={`Hapus pemain ${player.name}`}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <Separator />
                        
                        <div className="grid grid-cols-4 gap-1 sm:gap-2">
                            <Button variant="outline" size="sm" className="h-9" onClick={() => handleScoreChange(player.id, 50)} disabled={isPending}>+50</Button>
                            <Button variant="outline" size="sm" className="h-9" onClick={() => handleScoreChange(player.id, 100)} disabled={isPending}>+100</Button>
                            <Button variant="outline" size="sm" className="h-9" onClick={() => handleScoreChange(player.id, 150)} disabled={isPending}>+150</Button>
                            <Button variant="destructive" size="sm" className="h-9" onClick={() => handleScoreChange(player.id, -150)} disabled={isPending}>-150</Button>
                        </div>
                        
                        <Separator />

                        <div className="flex flex-col items-center gap-2 pt-1">
                             <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Input Poin"
                                className="h-9 text-center w-40"
                                value={pointInputs[player.id] || ''}
                                onChange={(e) => handlePointInputChange(player.id, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleScoreChange(player.id, Math.abs(parseInt(pointInputs[player.id] || '0')));
                                    }
                                }}
                                disabled={isPending}
                                aria-label={`Poin untuk ${player.name}`}
                            />
                            <div className="flex items-center justify-center gap-2">
                                <Button variant="destructive" className="w-20" onClick={() => handleScoreChange(player.id, -Math.abs(parseInt(pointInputs[player.id] || '0')))} disabled={isPending || !pointInputs[player.id]} aria-label={`Tambah skor negatif untuk ${player.name}`}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Button variant="default" className="w-20 bg-success hover:bg-success/90" onClick={() => handleScoreChange(player.id, Math.abs(parseInt(pointInputs[player.id] || '0')))} disabled={isPending || !pointInputs[player.id]} aria-label={`Tambah skor positif untuk ${player.name}`}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="h-24 flex items-center justify-center text-muted-foreground text-center px-4">
                      {isLoading ? 'Memuat pemain...' : 'Tambahkan pemain untuk memulai permainan.'}
                    </div>
                  )}
              </div>
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

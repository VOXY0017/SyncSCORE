
'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import type { Player, ScoreEntry, Round } from '@/lib/types';
import Link from 'next/link';
import { useData } from '@/app/context/data-context';
import { useFirebase } from '@/firebase';
import { collection, doc, writeBatch, deleteDoc, serverTimestamp, runTransaction, DocumentReference, getDocs, query, addDoc } from 'firebase/firestore';
import { useLocalStorage } from '@/hooks/use-local-storage';

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Minus, X, RotateCcw, Undo2, Undo, Award, Crown, Zap, ShieldX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_SESSION_ID = 'main';

export default function PlayerManagement() {
  const { session, players, rounds, scores, isDataLoading } = useData();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [sessionId] = useLocalStorage('sessionId', DEFAULT_SESSION_ID);

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
    if (!players || players.length < 2 || !scores) return false;
    
    const playerGameCounts = players.reduce((acc, player) => {
        acc[player.id] = scores.filter(s => s.playerId === player.id).length;
        return acc;
    }, {} as Record<string, number>);

    if (Object.keys(playerGameCounts).length < players.length) return false;
    const gameCounts = Object.values(playerGameCounts);
    if (gameCounts.length === 0) return false;
    
    const firstCount = gameCounts[0];
    const allHaveSameCount = gameCounts.every(count => count === firstCount);
    
    return allHaveSameCount && firstCount > 0;
}, [players, scores]);

  const canUndoEntry = scores && scores.length > 0;

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPlayerName.trim();
    if (!trimmedName || !firestore || players === undefined || isPlayerLimitReached || isPending || !sessionId) return;
    
    if (players.find(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ title: "Nama pemain sudah ada", variant: "destructive" });
        return;
    }

    startTransition(async () => {
      const sessionRef = doc(firestore, 'sessions', sessionId);
      const playersCollection = collection(sessionRef, 'players');
      await addDoc(playersCollection, {
          name: trimmedName,
          totalPoints: 0,
          addedAt: serverTimestamp(),
          order: players.length
      });
      setNewPlayerName('');
    });
  };

  const handleScoreChange = (playerId: string, points: number, actionLabel: string, inputType: 'shortcut' | 'manual') => {
    if (isNaN(points) || points === 0 && inputType === 'manual' || !firestore || isPending || !sessionId || !players || !rounds) return;

    if (Math.abs(points) > 500 && inputType === 'manual') {
        toast({title: "Input skor diluar rentang (-500 to 500).", variant: "destructive"});
        return;
    }

    startTransition(async () => {
        const sessionRef = doc(firestore, 'sessions', sessionId);
        const playerRef = doc(sessionRef, 'players', playerId);

        await runTransaction(firestore, async (transaction) => {
            const playerDoc = await transaction.get(playerRef);
            if (!playerDoc.exists()) {
                throw "Player does not exist!";
            }
            
            let currentRoundRef: DocumentReference;
            const scoresSoFar = scores ?? [];
            const playerGameCounts = players.reduce((acc, player) => {
                acc[player.id] = scoresSoFar.filter(s => s.playerId === player.id).length;
                return acc;
            }, {} as Record<string, number>);

            const gameCounts = Object.values(playerGameCounts);
            const isFirstEntryEver = scoresSoFar.length === 0;

            const allHaveSameCount = gameCounts.length > 0 && gameCounts.every(count => count === gameCounts[0]);
            const currentPlayerEntryCount = playerGameCounts[playerId] ?? 0;
            const lastRoundNumber = session?.lastRoundNumber ?? 0;
            
            let isNewRound = false;
            if (isFirstEntryEver) {
              isNewRound = true;
            } else if (allHaveSameCount && currentPlayerEntryCount === lastRoundNumber && players.length > 1) {
              isNewRound = true;
            } else if (players.length === 1 && lastRoundNumber > 0) {
              isNewRound = true;
            }


            if (isNewRound) {
                const newRoundNumber = lastRoundNumber + 1;
                currentRoundRef = doc(collection(sessionRef, 'rounds'));
                transaction.set(currentRoundRef, { roundNumber: newRoundNumber, createdAt: serverTimestamp() });
                transaction.update(sessionRef, { lastRoundNumber: newRoundNumber });
            } else if (rounds.length > 0) {
                currentRoundRef = doc(sessionRef, 'rounds', rounds[0].id);
            } else {
                 const newRoundNumber = 1;
                 currentRoundRef = doc(collection(sessionRef, 'rounds'));
                 transaction.set(currentRoundRef, { roundNumber: newRoundNumber, createdAt: serverTimestamp() });
                 transaction.update(sessionRef, { lastRoundNumber: newRoundNumber });
            }
            
            const scoreRef = doc(collection(currentRoundRef, 'scores'));
            transaction.set(scoreRef, {
                playerId: playerId,
                points: points,
                actionLabel: actionLabel,
                inputType: inputType,
                timestamp: serverTimestamp()
            });

            const newTotalPoints = playerDoc.data().totalPoints + points;
            transaction.update(playerRef, { totalPoints: newTotalPoints });
        });
        
        if (inputType === 'manual') {
            setPointInputs(prev => ({...prev, [playerId]: ''}));
        }
    });
  };
  
  const handlePointInputChange = (playerId: string, value: string) => {
    const sanitizedValue = value.replace(/[^-0-9]/g, '');
    if (sanitizedValue.slice(1).includes('-')) {
        return;
    }
    setPointInputs(prev => ({...prev, [playerId]: sanitizedValue}));
  }

  const confirmDeletePlayer = () => {
    if (!playerToDelete || !firestore || isPending || !sessionId) return;

    startTransition(async () => {
        const playerDocRef = doc(firestore, 'sessions', sessionId, 'players', playerToDelete.id);
        await deleteDoc(playerDocRef);
        toast({ title: `${playerToDelete.name} telah dihapus.`});
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
      if (!firestore || !rounds || isPending || !sessionId || !players) return;
      startTransition(async () => {
        const sessionRef = doc(firestore, 'sessions', sessionId);
        const batch = writeBatch(firestore);

        for (const round of rounds) {
            const scoresSnapshot = await getDocs(collection(sessionRef, 'rounds', round.id, 'scores'));
            scoresSnapshot.forEach(scoreDoc => batch.delete(scoreDoc.ref));
            batch.delete(doc(sessionRef, 'rounds', round.id));
        }

        players.forEach(player => {
            const playerRef = doc(sessionRef, 'players', player.id);
            batch.update(playerRef, { totalPoints: 0 });
        });
        
        batch.update(sessionRef, { lastRoundNumber: 0 });

        await batch.commit();
        toast({ title: "Semua skor telah diatur ulang."});
        setResetAlertOpen(false);
      });
  };

  const confirmUndoLastRound = async () => {
    if (!firestore || !players || !scores || !canUndoRound || isPending || !sessionId) return;

    startTransition(async () => {
        await runTransaction(firestore, async (transaction) => {
            const sessionRef = doc(firestore, 'sessions', sessionId);
            const entriesToDelete: {score: ScoreEntry, ref: DocumentReference}[] = [];

            for (const player of players) {
                const playerHistory = scores
                    .filter(s => s.playerId === player.id)
                    .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

                if (playerHistory.length > 0) {
                    const lastEntry = playerHistory[0];

                    if (rounds && rounds[0]) {
                         const scoreRef = doc(sessionRef, 'rounds', rounds[0].id, 'scores', lastEntry.id);
                         entriesToDelete.push({score: lastEntry, ref: scoreRef });
                    }
                }
            }
            
            for (const { score, ref } of entriesToDelete) {
                transaction.delete(ref);
                const playerRef = doc(sessionRef, 'players', score.playerId);
                const playerDoc = await transaction.get(playerRef);
                if(playerDoc.exists()){
                    const currentPoints = playerDoc.data().totalPoints;
                    transaction.update(playerRef, { totalPoints: currentPoints - score.points });
                }
            }
        });

        toast({ title: "Ronde terakhir dibatalkan."});
        setUndoRoundAlertOpen(false);
    });
};
  
  const confirmUndoLastEntry = async () => {
    if (!firestore || !scores || scores.length === 0 || isPending || !sessionId || !rounds) return;
    startTransition(async () => {
        const lastEntry = scores[0]; 
        
        if (rounds.length === 0) return;
        const lastRoundId = rounds[0].id;

        await runTransaction(firestore, async (transaction) => {
            const sessionRef = doc(firestore, 'sessions', sessionId);
            const scoreRef = doc(sessionRef, 'rounds', lastRoundId, 'scores', lastEntry.id);
            const playerRef = doc(sessionRef, 'players', lastEntry.playerId);

            const playerDoc = await transaction.get(playerRef);
            if (!playerDoc.exists()) {
                throw "Player for score to undo does not exist.";
            }

            const newTotalPoints = playerDoc.data().totalPoints - lastEntry.points;
            transaction.update(playerRef, { totalPoints: newTotalPoints });

            transaction.delete(scoreRef);
        });

        toast({ title: "Input terakhir dibatalkan."});
        setUndoEntryAlertOpen(false);
    });
  };

  const ManagementSkeleton = () => (
    <div className="space-y-4 px-4">
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
        <TooltipProvider>
          <div className="p-4 space-y-2">
              <form onSubmit={handleAddPlayer} className="flex-grow">
                  <Input
                      placeholder={isPlayerLimitReached ? "Maksimal 5 pemain tercapai" : "Tambah pemain baru dan tekan Enter..."}
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      disabled={isPending || isDataLoading || isPlayerLimitReached}
                      className="h-9"
                      aria-label="Nama pemain baru"
                  />
              </form>
              <div className="flex flex-row items-center gap-2">
                  <div className="flex-grow flex gap-2">
                    <Button variant="outline" size="sm" className="h-9" onClick={() => setUndoEntryAlertOpen(true)} disabled={isPending || isDataLoading || !canUndoEntry} aria-label="Batalkan input terakhir">
                        <Undo className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Undo Input</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-9" onClick={() => setUndoRoundAlertOpen(true)} disabled={isPending || isDataLoading || !canUndoRound} aria-label="Batalkan ronde terakhir">
                        <Undo2 className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Undo Ronde</span>
                    </Button>
                  </div>
                  <Button variant="destructive" size="sm" className="h-9" onClick={() => setResetAlertOpen(true)} disabled={isPending || isDataLoading || !players || players.length === 0} aria-label="Atur ulang semua skor">
                      <RotateCcw className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Atur Ulang</span>
                  </Button>
              </div>
          </div>
          <div className="flex-grow space-y-4 p-4 pt-0">
              {isDataLoading ? (
                <ManagementSkeleton />
              ) : players && players.length > 0 ? (
                players.map((player) => (
                  <Card key={player.id} className="p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <Link href={`/history/${player.id}?name=${encodeURIComponent(player.name)}`} className="hover:underline font-bold text-lg">
                            {player.name}
                        </Link>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => { setPlayerToDelete(player); setDeleteAlertOpen(true); }} disabled={isPending} aria-label={`Hapus pemain ${player.name}`}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        {/* Left Column: Shortcut Buttons */}
                        <div className="grid grid-cols-2 gap-1 sm:gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9" onClick={() => handleScoreChange(player.id, 50, 'Masuk Biasa', 'shortcut')} disabled={isPending}><Award /></Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Masuk Biasa (+50)</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9" onClick={() => handleScoreChange(player.id, 100, 'Joker', 'shortcut')} disabled={isPending}><Crown /></Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Menang dgn Joker (+100)</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9" onClick={() => handleScoreChange(player.id, 150, 'Menang', 'shortcut')} disabled={isPending}><Zap /></Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Menang Tanpa Main (+150)</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="destructive" size="sm" className="h-9" onClick={() => handleScoreChange(player.id, -150, 'Mati Kartu', 'shortcut')} disabled={isPending}><ShieldX /></Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Kalah Tanpa Main (-150)</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        {/* Right Column: Manual Input */}
                        <div className="flex flex-col items-center justify-center gap-2">
                            <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Input Poin"
                                className="h-9 text-center w-full text-sm"
                                value={pointInputs[player.id] || ''}
                                onChange={(e) => handlePointInputChange(player.id, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const value = parseInt(pointInputs[player.id] || '0');
                                        if (value !== 0) {
                                            handleScoreChange(player.id, value, 'Manual', 'manual');
                                        }
                                    }
                                }}
                                disabled={isPending}
                                aria-label={`Poin untuk ${player.name}`}
                            />
                            <div className="flex items-center justify-center gap-2 w-full">
                                <Button variant="destructive" className="w-full" onClick={() => handleScoreChange(player.id, -Math.abs(parseInt(pointInputs[player.id] || '0')), 'Manual', 'manual')} disabled={isPending || !pointInputs[player.id]}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Button variant="default" className="w-full bg-success hover:bg-success/90" onClick={() => handleScoreChange(player.id, Math.abs(parseInt(pointInputs[player.id] || '0')), 'Manual', 'manual')} disabled={isPending || !pointInputs[player.id]}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="h-24 flex items-center justify-center text-muted-foreground text-center px-4">
                  {isDataLoading ? 'Memuat pemain...' : 'Tambahkan pemain untuk memulai permainan.'}
                </div>
              )}
          </div>
        </TooltipProvider>
      </CardContent>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={handleAlertOpenChange}>
          <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
              <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Ini akan menghapus <strong>{playerToDelete?.name}</strong> dari sesi ini. Riwayat skor mereka akan tetap tercatat tetapi tidak akan terhubung lagi.
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
              <AlertDialogTitle>Atur ulang sesi permainan?</AlertDialogTitle>
              <AlertDialogDescription>
                  Tindakan ini akan menghapus semua riwayat skor dan ronde, lalu mengatur ulang total skor semua pemain ke 0.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={confirmResetScores} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isPending}>
              {isPending ? "Mengatur ulang..." : "Ya, Atur Ulang Sesi"}
              </AlertDialogAction>
          </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isUndoRoundAlertOpen} onOpenChange={isPending ? () => {} : setUndoRoundAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Batalkan ronde terakhir?</AlertDialogTitle>
                <AlertDialogDescription>
                    Tindakan ini akan menghapus entri skor terakhir untuk setiap pemain di ronde yang sudah selesai.
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
                    Tindakan ini akan menghapus entri skor terakhir yang dimasukkan dari riwayat.
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

    

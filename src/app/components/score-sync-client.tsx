'use client';

import { useState, useTransition, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import type { Player } from '@/lib/types';

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
import { Plus, Minus, Trash2, Trophy, Crown, Gamepad2, Medal, UserPlus, ArrowUp, ArrowDown, Menu, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

type RankChange = {
  id: string;
  oldRank: number;
  newRank: number;
};

export default function ScoreSyncClient() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState<string | null>(null);
  const [pointInputs, setPointInputs] = useState<Record<string, string>>({});
  
  const [rankChanges, setRankChanges] = useState<RankChange[]>([]);
  
  const previousPlayerRanks = useRef(new Map<string, number>());
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      // Let's add some mock data for a better default look
      const mockPlayers: Player[] = [
        { id: '1', name: 'Rizky', score: 150 },
        { id: '2', name: 'Andi', score: 125 },
        { id: '3', name: 'Budi', score: 110 },
        { id: '4', name: 'Citra', score: 95 },
        { id: '5', name: 'Dewi', score: 80 },
        { id: '6', name: 'Eka', score: 70 },
      ].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
      
      setPlayers(mockPlayers);
      previousPlayerRanks.current = new Map(mockPlayers.map((p, i) => [p.id, i]));
      setIsLoading(false);
    }, 1500);
  }, []);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    startTransition(() => {
      const trimmedName = newPlayerName.trim();
      
      if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ variant: "destructive", title: "Error", description: "A player with this name already exists." });
        return;
      }
      
      const newPlayer: Player = {
        id: new Date().getTime().toString(), // Simple unique ID
        name: trimmedName,
        score: 0,
      };
      
      const newPlayers = [...players, newPlayer].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
      
      previousPlayerRanks.current = new Map(newPlayers.map((p, i) => [p.id, i]));
      setPlayers(newPlayers);
      setNewPlayerName('');
      toast({ title: "Player Added", description: `${trimmedName} has joined the game!`});
      setIsSheetOpen(false);
    });
  };
  
  const triggerUpdateAnimation = useCallback((playerId: string) => {
    setRecentlyUpdated(playerId);
    setTimeout(() => setRecentlyUpdated(null), 1500);
  }, []);

  const handleScoreChange = (playerId: string, change: number) => {
    if (isNaN(change) || change === 0) return;
    
    triggerUpdateAnimation(playerId);

    startTransition(() => {
       setPlayers(prevPlayers => {
          const updatedPlayers = prevPlayers.map(p => 
            p.id === playerId ? { ...p, score: p.score + change } : p
          );
          
          const sortedPlayers = [...updatedPlayers].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

          const newChanges = sortedPlayers.reduce((acc, player, newRank) => {
            const oldRank = previousPlayerRanks.current.get(player.id);
            if (oldRank !== undefined && oldRank !== newRank) {
              acc.push({ id: player.id, oldRank, newRank });
            }
            return acc;
          }, [] as RankChange[]);
          
          if (newChanges.length > 0) {
            setRankChanges(newChanges);
          }
          previousPlayerRanks.current = new Map(sortedPlayers.map((p, i) => [p.id, i]));

          return sortedPlayers;
       });
       setPointInputs(prev => ({...prev, [playerId]: ''}));
    });
  };
  
  const handlePointInputChange = (playerId: string, value: string) => {
    setPointInputs(prev => ({...prev, [playerId]: value}));
  }

  const confirmDeletePlayer = () => {
    if (!playerToDelete) return;

    startTransition(() => {
      setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== playerToDelete.id));
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

  const topPlayers = players.slice(0, 3);
  const otherPlayers = players.slice(3);

  const PlayerListSkeleton = () => (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    </div>
  );

  const ManagementSkeleton = () => (
    <>
    {[...Array(8)].map((_, i) => (
        <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-2/4" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-9 w-20 ml-auto" /></TableCell>
            <TableCell className="flex justify-end gap-2">
                <Skeleton className="h-9 w-9" />
            </TableCell>
        </TableRow>
    ))}
    </>
  );
  
  return (
    <div className="min-h-screen w-full bg-background dark:bg-black dark:bg-dot-white/[0.2] bg-dot-black/[0.2] relative">
       {/* Pointer gradient */}
       <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      
       <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <div className="flex items-center gap-3">
              <Trophy className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">Score Markas B7</h1>
          </div>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Manage Players</span>
                </Button>
            </SheetTrigger>
            {/* Desktop trigger */}
            <Button onClick={() => setIsSheetOpen(true)} className="hidden md:flex items-center gap-2">
                <Gamepad2 />
                Manage Points
            </Button>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3 text-2xl">
                  <Gamepad2 />
                  Manage Points
                </SheetTitle>
              </SheetHeader>
              <div className="flex-grow flex flex-col min-h-0 py-4">
                <form onSubmit={handleAddPlayer} className="flex w-full max-w-xs items-center gap-2 mb-4">
                  <Input
                    placeholder="Add new player and press Enter"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    disabled={isPending}
                    className="w-full"
                    aria-label="New player name"
                  />
                </form>
                 <ScrollArea className="flex-grow h-0">
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
                                <TableCell className="text-right w-[100px] space-x-1">
                                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleScoreChange(player.id, parseInt(pointInputs[player.id] || '0'))} disabled={isPending || !pointInputs[player.id]} aria-label={`Increase score for ${player.name}`}>
                                        <Plus className="h-4 w-4" />
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
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="container max-w-screen-lg mx-auto py-6 sm:py-10">
        {isLoading ? (
            <PlayerListSkeleton />
        ) : (
            <>
            {/* Top 3 Players */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8">
                {topPlayers[1] && <PodiumCard player={topPlayers[1]} rank={2} />}
                {topPlayers[0] && <PodiumCard player={topPlayers[0]} rank={1} />}
                {topPlayers[2] && <PodiumCard player={topPlayers[2]} rank={3} />}
            </div>

            {/* Other Players */}
            {otherPlayers.length > 0 && (
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Users />
                            All Players
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[80px] text-center font-bold">Rank</TableHead>
                                <TableHead className="font-bold">Player</TableHead>
                                <TableHead className="w-[120px] text-right font-bold">Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {otherPlayers.map((player, index) => {
                                const rankChange = rankChanges.find(c => c.id === player.id);
                                const overallRank = index + 4;
                                return (
                                    <PlayerRow
                                    key={player.id}
                                    player={player}
                                    index={overallRank - 1}
                                    rank={overallRank}
                                    recentlyUpdated={recentlyUpdated}
                                    rankChange={rankChange}
                                    onAnimationEnd={() => setRankChanges(rc => rc.filter(c => c.id !== player.id))}
                                    />
                                );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
            </>
        )}
      </main>

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

interface PlayerRowProps {
  player: Player;
  index: number;
  rank: number;
  recentlyUpdated: string | null;
  rankChange: RankChange | undefined;
  onAnimationEnd: () => void;
}

function PlayerRow({ player, index, rank, recentlyUpdated, rankChange, onAnimationEnd }: PlayerRowProps) {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const initialRect = useRef<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (rowRef.current) {
        initialRect.current = rowRef.current.getBoundingClientRect();
    }
  }, [player.id]);

  useLayoutEffect(() => {
    if (!rankChange || !rowRef.current || !initialRect.current) {
      return;
    }

    const newRect = rowRef.current.getBoundingClientRect();
    const oldRect = initialRect.current;
    const deltaY = oldRect.top - newRect.top;

    if (deltaY !== 0) {
      requestAnimationFrame(() => {
        if (!rowRef.current) return;
        rowRef.current.style.transform = `translateY(${deltaY}px)`;
        rowRef.current.style.transition = 'transform 0s';
        
        requestAnimationFrame(() => {
          if (!rowRef.current) return;
          rowRef.current.style.animation = `slide-down 0.7s ease-in-out forwards`;
          rowRef.current.style.transform = '';
        });
      });
    }
    initialRect.current = newRect;

  }, [rankChange, player.score]);


  const handleTransitionEnd = () => {
    if(rowRef.current) {
      rowRef.current.style.animation = '';
    }
    onAnimationEnd();
  };

  return (
    <TableRow
      ref={rowRef}
      onAnimationEnd={handleTransitionEnd}
      className={cn(
        'will-change-transform',
        recentlyUpdated === player.id && 'bg-primary/10',
      )}
    >
      <TableCell className="text-center font-medium text-lg text-muted-foreground">{rank}</TableCell>
      <TableCell className="font-medium text-lg">{player.name}</TableCell>
      <TableCell className="text-right font-bold text-xl text-primary tabular-nums">
        {player.score > 0 ? `+${player.score}` : player.score}
      </TableCell>
    </TableRow>
  );
}


interface PodiumCardProps {
    player: Player;
    rank: number;
}

function PodiumCard({ player, rank }: PodiumCardProps) {
    const rankColors = {
        1: 'border-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20',
        2: 'border-slate-400 bg-slate-400/10 hover:bg-slate-400/20',
        3: 'border-orange-400 bg-orange-400/10 hover:bg-orange-400/20'
    };
    const rankIcon = {
        1: <Crown className="h-8 w-8 text-yellow-400" />,
        2: <Medal className="h-8 w-8 text-slate-400" />,
        3: <Trophy className="h-8 w-8 text-orange-400" />
    };

    return (
        <Card className={cn(
            'transition-all duration-300 border-2',
            rank === 1 && 'md:scale-110 md:z-10',
            rankColors[rank as keyof typeof rankColors],
        )}>
            <CardHeader className="flex flex-col items-center justify-center p-4">
                {rankIcon[rank as keyof typeof rankIcon]}
                <CardTitle className="text-2xl mt-2">{player.name}</CardTitle>
                <CardDescription className="text-base">Rank #{rank}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-center">
                 <p className="text-4xl font-bold text-primary tabular-nums">
                    {player.score > 0 ? `+${player.score}` : player.score}
                </p>
            </CardContent>
        </Card>
    )
}

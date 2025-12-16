'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import type { Player, ScoreEntry } from '@/lib/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { useData } from '@/app/context/data-context';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Users, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ScoreHistoryProps {
  playerId: string;
}

export default function ScoreHistory({ playerId }: ScoreHistoryProps) {
  const { players, history } = useData();

  const [player, setPlayer] = useState<Player | null>(null);
  const [playerHistory, setPlayerHistory] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (players !== undefined && history !== undefined) {
      const foundPlayer = players.find(p => p.id === playerId) || null;
      setPlayer(foundPlayer);
      if (foundPlayer) {
        const foundHistory = history.filter(h => h.playerId === foundPlayer.id);
        setPlayerHistory(foundHistory.sort((a,b) => {
            const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
            const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
            return timeB - timeA;
        }));
      }
      setIsLoading(false);
    }
  }, [playerId, players, history]);

  const HistorySkeleton = () => (
    <>
      {[...Array(10)].map((_, i) => (
        <TableRow key={i}>
          <TableCell className="p-1 sm:p-2"><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell className="p-1 sm:p-2"><Skeleton className="h-5 w-48" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="container flex-grow max-w-screen-lg mx-auto py-2 sm:py-4 relative z-10">
        <main>
          <Card className="shadow-md h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3 text-lg sm:text-xl">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Riwayat Skor: {isLoading ? <Skeleton className="h-6 w-28" /> : player?.name || 'Pemain Tidak Dikenal'}
                </div>
                 <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild aria-label="Buka Manajemen Pemain">
                        <Link href="/#management">
                            <Users className="h-5 w-5" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild aria-label="Kembali">
                        <Link href="/">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-11rem)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] sm:w-[120px] font-bold p-1 sm:p-2">Poin</TableHead>
                      <TableHead className="font-bold p-1 sm:p-2">Waktu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? <HistorySkeleton /> : (
                      playerHistory && playerHistory.length > 0 ? playerHistory.map((entry, index) => (
                        <TableRow key={entry.id}>
                          <TableCell className={cn("font-bold text-base p-1 sm:p-2", entry.points > 0 ? "text-success" : "text-destructive")}>
                            {entry.points > 0 ? `+${entry.points}` : entry.points}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs sm:text-sm p-1 sm:p-2">
                            {entry.timestamp ? format(new Date(entry.timestamp), 'Pp') : '...'}
                          </TableCell>
                        </TableRow>
                      )) : null
                    )}
                    {!isLoading && (!playerHistory || playerHistory.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={2} className="h-20 text-center text-muted-foreground">
                          {player ? 'Belum ada entri skor untuk pemain ini.' : 'Pemain tidak ditemukan.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

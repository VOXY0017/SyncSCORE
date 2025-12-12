'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import type { ScoreEntry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Static data
const staticHistory: ScoreEntry[] = [
  { id: 'h1', points: 10, timestamp: new Date(Date.now() - 60000 * 2), playerName: 'Pemain Satu' },
  { id: 'h2', points: -5, timestamp: new Date(Date.now() - 60000 * 5), playerName: 'Pemain Dua' },
  { id: 'h3', points: 20, timestamp: new Date(Date.now() - 60000 * 10), playerName: 'Pemain Tiga' },
  { id: 'h4', points: 5, timestamp: new Date(Date.now() - 60000 * 12), playerName: 'Pemain Satu' },
  { id: 'h5', points: -10, timestamp: new Date(Date.now() - 60000 * 15), playerName: 'Pemain Empat' },
];

export default function GlobalScoreHistory() {
  const [history, setHistory] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      const sortedHistory = [...staticHistory].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setHistory(sortedHistory);
      setIsLoading(false);
    }, 1000);
  }, []);

  const HistorySkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <Card className="shadow-md h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
          <History className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          Skor per Game
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-14rem)] sm:h-[calc(100vh-15rem)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Game</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Poin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <HistorySkeleton />
              ) : history && history.length > 0 ? (
                history.map((entry, index) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      Game {history.length - index}
                    </TableCell>
                    <TableCell>{entry.playerName}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-bold text-base",
                        entry.points > 0 ? "text-green-400" : "text-red-400"
                      )}
                    >
                      {entry.points > 0 ? `+${entry.points}` : entry.points}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    Belum ada riwayat skor.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

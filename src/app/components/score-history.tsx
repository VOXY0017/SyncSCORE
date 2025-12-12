'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import type { Player, ScoreEntry } from '@/lib/types';
import Link from 'next/link';
import { format } from 'date-fns';

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

// Static data
const staticPlayers: { [key: string]: Player } = {
  '1': { id: '1', name: 'Pemain Satu', score: 15 },
  '2': { id: '2', name: 'Pemain Dua', score: -5 },
  '3': { id: '3', name: 'Pemain Tiga', score: 20 },
  '4': { id: '4', name: 'Pemain Empat', score: -10 },
  '5': { id: '5', name: 'Pemain Lima', score: 0 },
};

const staticHistory: { [key: string]: ScoreEntry[] } = {
    '1': [
        { id: 'h1', points: 10, timestamp: new Date(Date.now() - 60000 * 2), playerName: 'Pemain Satu' },
        { id: 'h4', points: 5, timestamp: new Date(Date.now() - 60000 * 12), playerName: 'Pemain Satu' },
    ],
    '2': [
        { id: 'h2', points: -5, timestamp: new Date(Date.now() - 60000 * 5), playerName: 'Pemain Dua' },
    ],
    '3': [
        { id: 'h3', points: 20, timestamp: new Date(Date.now() - 60000 * 10), playerName: 'Pemain Tiga' },
    ],
    '4': [
        { id: 'h5', points: -10, timestamp: new Date(Date.now() - 60000 * 15), playerName: 'Pemain Empat' },
    ]
};

export default function ScoreHistory({ playerId }: ScoreHistoryProps) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      const foundPlayer = staticPlayers[playerId] || null;
      const foundHistory = staticHistory[playerId] || [];
      setPlayer(foundPlayer);
      setScoreHistory(foundHistory.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime())); // Sort oldest to newest for game order
      setIsLoading(false);
    }, 1000);
  }, [playerId]);

  const HistorySkeleton = () => (
    <>
      {[...Array(10)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-48" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="min-h-screen w-full bg-custom-background bg-cover bg-center relative flex flex-col">
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="container flex-grow max-w-screen-lg mx-auto py-4 sm:py-8 relative z-10">
        <main>
          <Card className="shadow-md h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3 text-xl sm:text-2xl">
                <div className="flex items-center gap-3">
                  <History className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                  Score History: {isLoading ? <Skeleton className="h-7 w-32" /> : player?.name || 'Unknown Player'}
                </div>
                 <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild aria-label="Go to Player Management">
                        <Link href="/management">
                            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild aria-label="Go Back">
                        <Link href="/management">
                            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Link>
                    </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-11rem)] sm:h-[calc(100vh-12rem)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] sm:w-[120px] font-bold">Game</TableHead>
                      <TableHead className="w-[120px] sm:w-[150px] font-bold">Points</TableHead>
                      <TableHead className="font-bold">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? <HistorySkeleton /> : (
                      scoreHistory && scoreHistory.map((entry, index) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium text-muted-foreground">
                            Game {index + 1}
                          </TableCell>
                          <TableCell className={cn("font-bold text-lg", entry.points > 0 ? "text-green-400" : "text-red-400")}>
                            {entry.points > 0 ? `+${entry.points}` : entry.points}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {entry.timestamp ? format(entry.timestamp, 'Pp') : '...'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {!isLoading && scoreHistory?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          {player ? 'No score entries yet for this player.' : 'Player not found.'}
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

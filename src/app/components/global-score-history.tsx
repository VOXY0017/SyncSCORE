'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { ScoreEntry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-8 w-12 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="shadow-md h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
          <History className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          Riwayat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-14rem)] sm:h-[calc(100vh-15rem)]">
          {isLoading ? (
            <HistorySkeleton />
          ) : history && history.length > 0 ? (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center space-x-3">
                  <Badge
                    className={cn(
                      "w-14 justify-center text-base",
                      entry.points > 0 ? "bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30" : "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                    )}
                  >
                    {entry.points > 0 ? `+${entry.points}` : entry.points}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{entry.playerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.timestamp
                        ? formatDistanceToNow(entry.timestamp, { addSuffix: true })
                        : '...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center text-muted-foreground">
              No score history yet.
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

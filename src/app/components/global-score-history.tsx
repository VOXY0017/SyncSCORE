'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy, limit } from 'firebase/firestore';
import type { ScoreEntry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function GlobalScoreHistory() {
  const firestore = useFirestore();

  const historyQuery = useMemoFirebase(() =>
    query(
      collectionGroup(firestore, 'scoreHistory'),
      orderBy('timestamp', 'desc'),
      limit(5)
    ), [firestore]);

  const { data: history, isLoading } = useCollection<ScoreEntry>(historyQuery);

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
                        ? formatDistanceToNow(entry.timestamp.toDate(), { addSuffix: true })
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

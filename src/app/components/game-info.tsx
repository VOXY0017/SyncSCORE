
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useData } from '@/app/context/data-context';
import type { Player } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export function LowestScorePlayerInfo() {
    const { players, lastRoundHighestScorers, isDataLoading } = useData();
    const [highestScorers, setHighestScorers] = useState<Player[]>([]);

    useEffect(() => {
        if (players && lastRoundHighestScorers) {
             if (lastRoundHighestScorers.length > 0) {
                const foundPlayers = players.filter(p => lastRoundHighestScorers.includes(p.id));
                setHighestScorers(foundPlayers);
            } else {
                setHighestScorers([]);
            }
        }
    }, [players, lastRoundHighestScorers]);

    const getDisplayText = () => {
        if (highestScorers.length === 0) {
            return "Belum ada data.";
        }
        if (highestScorers.length === 1) {
            return highestScorers[0].name;
        }
        return `Seri: ${highestScorers.map(p => p.name).join(' & ')}`;
    };

    return (
        <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center p-3 text-center h-full">
                {isDataLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24 mx-auto" />
                        <Skeleton className="h-4 w-32 mx-auto" />
                    </div>
                ) : (
                    <div className='flex flex-col items-center leading-none'>
                        <p className="text-xs text-muted-foreground font-medium">Poin Terbesar Lalu</p>
                        <div className="flex items-center gap-1 mt-1">
                            <p className="font-bold text-base line-clamp-1 text-destructive">
                                {getDisplayText()}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

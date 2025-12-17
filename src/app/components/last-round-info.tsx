
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useData } from '@/app/context/data-context';
import type { Player } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export function LastRoundHighestScorerInfo() {
    const { players, lastRoundHighestScorers, isDataLoading, session } = useData();
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

    if (isDataLoading) {
        return <Skeleton className="h-5 w-28" />;
    }
    
    if (!session || session.lastRoundNumber < 1) {
        return null; // Don't show this component before round 1 is finished
    }

    return (
        <div className='flex flex-col items-start leading-none'>
            <p className="text-xs text-muted-foreground font-medium">MVP</p>
            <div className="flex items-center gap-1">
                <p className="font-bold text-sm line-clamp-1 text-destructive">
                    {getDisplayText()}
                </p>
            </div>
        </div>
    );
}

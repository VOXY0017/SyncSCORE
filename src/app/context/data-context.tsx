'use client';

import * as React from 'react';
import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { Player, ScoreEntry } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

interface DataContextType {
    players: Player[] | undefined;
    history: ScoreEntry[] | undefined;
    lastRoundLowestScorers: string[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { firestore } = useFirebase();

    const playersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'players'), orderBy('name', 'asc'));
    }, [firestore]);

    const historyQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'history'), orderBy('timestamp', 'desc'));
    }, [firestore]);

    const { data: playersData } = useCollection<Player>(playersQuery);
    const { data: historyData } = useCollection<ScoreEntry>(historyQuery);

    const [lastRoundLowestScorers, setLastRoundLowestScorers] = useState<string[]>([]);

    useEffect(() => {
        const players = playersData || [];
        const history = historyData || [];

        if (players.length > 0 && history.length > 0) {
            const playerGameCounts = players.reduce((acc, player) => {
                acc[player.id] = history.filter(h => h.playerId === player.id).length;
                return acc;
            }, {} as Record<string, number>);

            if (Object.keys(playerGameCounts).length === players.length) {
                const completedRounds = Math.min(...Object.values(playerGameCounts));
                
                if (completedRounds > 0) {
                    const previousRoundIndex = completedRounds - 1;
                    const scoresFromPreviousRound: { playerId: string, name: string, score: number }[] = [];
                    const playerHistories = players.map(player => ({
                        player,
                        history: history.filter(h => h.playerId === player.id).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    }));

                    playerHistories.forEach(({ player, history }) => {
                        if (history.length > previousRoundIndex) {
                            scoresFromPreviousRound.push({ playerId: player.id, name: player.name, score: history[previousRoundIndex].points });
                        }
                    });

                    if (scoresFromPreviousRound.length > 0) {
                        const minScore = Math.min(...scoresFromPreviousRound.map(s => s.score));
                        const lowestScorers = scoresFromPreviousRound.filter(s => s.score === minScore);
                        setLastRoundLowestScorers(lowestScorers.map(s => s.playerId));
                    } else {
                        setLastRoundLowestScorers([]);
                    }
                } else {
                    setLastRoundLowestScorers([]);
                }
            } else {
                setLastRoundLowestScorers([]);
            }
        } else {
            setLastRoundLowestScorers([]);
        }

    }, [playersData, historyData]);

    const value = useMemo(() => ({
        players: playersData || [],
        history: historyData || [],
        lastRoundLowestScorers,
    }), [playersData, historyData, lastRoundLowestScorers]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

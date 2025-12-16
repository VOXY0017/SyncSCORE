
'use client';

import * as React from 'react';
import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { Player, ScoreEntry, Session, Round } from '@/lib/types';
import { useCollection, useDoc } from '@/firebase';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, onSnapshot, getDocs } from 'firebase/firestore';
import { useLocalStorage } from '@/hooks/use-local-storage';

// --- Default session setup ---
const DEFAULT_SESSION_ID = 'main';

interface DataContextType {
    session: Session | null | undefined;
    players: Player[] | undefined;
    rounds: (Round & { scores?: ScoreEntry[] })[] | undefined;
    scores: ScoreEntry[] | undefined;
    lastRoundHighestScorers: string[];
    isDataLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { firestore } = useFirebase();
    const [sessionId] = useLocalStorage('sessionId', DEFAULT_SESSION_ID);

    // --- Firestore Queries ---
    const sessionRef = useMemoFirebase(() => {
        if (!firestore || !sessionId) return null;
        return doc(firestore, 'sessions', sessionId);
    }, [firestore, sessionId]);

    const playersQuery = useMemoFirebase(() => {
        if (!sessionRef) return null;
        return query(collection(sessionRef, 'players'), orderBy('order', 'asc'));
    }, [sessionRef]);

    const roundsQuery = useMemoFirebase(() => {
        if (!sessionRef) return null;
        return query(collection(sessionRef, 'rounds'), orderBy('roundNumber', 'desc'));
    }, [sessionRef]);
    
    // --- Data Hooks ---
    const { data: sessionData, isLoading: isSessionLoading } = useDoc<Session>(sessionRef);
    const { data: playersData, isLoading: arePlayersLoading } = useCollection<Player>(playersQuery);
    const { data: rawRoundsData, isLoading: areRoundsLoading } = useCollection<Round>(roundsQuery);

    const [scores, setScores] = useState<ScoreEntry[] | undefined>(undefined);
    const [roundsData, setRoundsData] = useState<(Round & { scores?: ScoreEntry[] })[] | undefined>(undefined);
    const [areScoresLoading, setAreScoresLoading] = useState(true);

    // This effect fetches all scores from all rounds and attaches them.
    useEffect(() => {
        if (!firestore || !sessionId || !rawRoundsData) {
            if (!areRoundsLoading) {
                setScores([]);
                setRoundsData([]);
                setAreScoresLoading(false);
            }
            return;
        }

        if (rawRoundsData.length === 0) {
            setAreScoresLoading(false);
            setScores([]);
            setRoundsData([]);
            return;
        }

        const fetchScoresForAllRounds = async () => {
            setAreScoresLoading(true);
            const roundsWithScores = await Promise.all(
                rawRoundsData.map(async (round) => {
                    const scoresQuery = query(collection(firestore, 'sessions', sessionId, 'rounds', round.id, 'scores'), orderBy('timestamp', 'desc'));
                    const scoresSnapshot = await getDocs(scoresQuery);
                    const scoresFromThisRound = scoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScoreEntry));
                    return { ...round, scores: scoresFromThisRound };
                })
            );
            
            const allScores = roundsWithScores.flatMap(r => r.scores || []);
            allScores.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

            setRoundsData(roundsWithScores);
            setScores(allScores);
            setAreScoresLoading(false);
        };
        
        fetchScoresForAllRounds();

        // Set up listeners for real-time updates
        const unsubscribers = rawRoundsData.map(round => {
            const scoresQuery = query(collection(firestore, 'sessions', sessionId, 'rounds', round.id, 'scores'), orderBy('timestamp', 'desc'));
            return onSnapshot(scoresQuery, () => {
                // When any score changes, refetch everything to ensure consistency
                fetchScoresForAllRounds();
            });
        });

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [firestore, sessionId, rawRoundsData, areRoundsLoading]);


    const isDataLoading = isSessionLoading || arePlayersLoading || areRoundsLoading || areScoresLoading;

    // --- Memoized Derived State ---
    const lastRoundHighestScorers = useMemo(() => {
        const players = playersData || [];
        const rounds = roundsData || [];

        if (players.length < 2 || rounds.length < 2) {
            return [];
        }

        // The rounds are sorted descending, so rounds[0] is the latest, rounds[1] is the one before.
        const lastCompletedRound = rounds[1];
        if (!lastCompletedRound || !lastCompletedRound.scores) {
            return [];
        }

        const scoresFromPreviousRound = lastCompletedRound.scores;
        
        if (scoresFromPreviousRound.length > 0) {
            const maxScoreInRound = Math.max(...scoresFromPreviousRound.map(s => s.points));
            if (maxScoreInRound <= 0) return []; // Don't highlight if no penalty
            const worstScorers = scoresFromPreviousRound.filter(s => s.points === maxScoreInRound);
            return worstScorers.map(s => s.playerId);
        }

        return [];

    }, [playersData, roundsData]);


    const value = useMemo(() => ({
        session: sessionData,
        players: playersData,
        rounds: roundsData,
        scores: scores,
        lastRoundHighestScorers,
        isDataLoading,
    }), [sessionData, playersData, roundsData, scores, lastRoundHighestScorers, isDataLoading]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

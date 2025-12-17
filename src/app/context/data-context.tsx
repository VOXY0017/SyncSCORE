
'use client';

import * as React from 'react';
import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { Player, ScoreEntry, Session, Round } from '@/lib/types';
import { useCollection, useDoc } from '@/firebase';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, onSnapshot, getDocs, Query } from 'firebase/firestore';
import { useLocalStorage } from '@/hooks/use-local-storage';

// --- Default session setup ---
const DEFAULT_SESSION_ID = 'main';

interface DataContextType {
    session: Session | null | undefined;
    players: Player[] | undefined;
    rounds: Round[] | undefined; // Raw rounds without scores attached
    scores: ScoreEntry[] | undefined; // All scores from all rounds, flattened
    roundsWithScores: (Round & { scores?: ScoreEntry[] })[] | undefined; // Rounds with scores nested
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
    
    const [rawRoundsData, setRawRoundsData] = useState<Round[] | undefined>(undefined);
    const [areRoundsLoading, setAreRoundsLoading] = useState(true);

    const [scores, setScores] = useState<ScoreEntry[] | undefined>(undefined);
    const [roundsWithScores, setRoundsWithScores] = useState<(Round & { scores?: ScoreEntry[] })[] | undefined>(undefined);
    const [areScoresLoading, setAreScoresLoading] = useState(true);

     // This is the master effect that listens to rounds and fetches scores accordingly.
    useEffect(() => {
        if (!firestore || !sessionId) return;
        
        const roundsQuery = query(collection(firestore, 'sessions', sessionId, 'rounds'), orderBy('roundNumber', 'desc'));

        const unsubscribeRounds = onSnapshot(roundsQuery, async (roundsSnapshot) => {
            setAreRoundsLoading(true);
            setAreScoresLoading(true);

            const newRawRounds = roundsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Round));

            const newRoundsWithScores = await Promise.all(
                newRawRounds.map(async (round) => {
                    const scoresQuery = query(collection(firestore, 'sessions', sessionId, 'rounds', round.id, 'scores'), orderBy('timestamp', 'desc'));
                    const scoresSnapshot = await getDocs(scoresQuery);
                    const scoresForThisRound = scoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScoreEntry));
                    return { ...round, scores: scoresForThisRound };
                })
            );

            const allScoresFlattened = newRoundsWithScores.flatMap(r => r.scores || []);
            allScoresFlattened.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
            
            setRawRoundsData(newRawRounds);
            setRoundsWithScores(newRoundsWithScores);
            setScores(allScoresFlattened);
            
            setAreRoundsLoading(false);
            setAreScoresLoading(false);
        });

        return () => {
            unsubscribeRounds();
        };
    }, [firestore, sessionId]);


    const isDataLoading = isSessionLoading || arePlayersLoading || areRoundsLoading || areScoresLoading;

    // --- Memoized Derived State ---
    const lastRoundHighestScorers = useMemo(() => {
        const players = playersData || [];
        const rounds = roundsWithScores || [];
        const session = sessionData;

        if (!session || players.length < 1 || rounds.length === 0 || session.lastRoundNumber < 1) {
            return [];
        }

        // Find the most recently completed round
        const lastFinishedRound = rounds.find(r => r.roundNumber === session.lastRoundNumber);
        
        if (!lastFinishedRound || !lastFinishedRound.scores || lastFinishedRound.scores.length === 0) {
            return [];
        }
        
        const scoresFromLastRound = lastFinishedRound.scores;
        const maxScoreInRound = Math.max(...scoresFromLastRound.map(s => s.points));

        if (maxScoreInRound <= 0) return [];

        const highestScorers = scoresFromLastRound.filter(s => s.points === maxScoreInRound);
        return highestScorers.map(s => s.playerId);

    }, [playersData, roundsWithScores, sessionData]);


    const value = useMemo(() => ({
        session: sessionData,
        players: playersData,
        rounds: rawRoundsData, // Provide raw rounds data
        scores: scores,
        roundsWithScores: roundsWithScores,
        lastRoundHighestScorers,
        isDataLoading,
    }), [sessionData, playersData, rawRoundsData, scores, roundsWithScores, lastRoundHighestScorers, isDataLoading]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

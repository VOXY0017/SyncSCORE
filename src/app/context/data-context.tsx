
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
    const { data: rawRoundsData, isLoading: areRoundsLoading } = useCollection<Round>(roundsQuery);

    const [scores, setScores] = useState<ScoreEntry[] | undefined>(undefined);
    const [roundsWithScores, setRoundsWithScores] = useState<(Round & { scores?: ScoreEntry[] })[] | undefined>(undefined);
    const [areScoresLoading, setAreScoresLoading] = useState(true);

    // This effect fetches all scores from all rounds and organizes them
    useEffect(() => {
        if (!firestore || !sessionId || !rawRoundsData) {
            if (!areRoundsLoading) {
                setScores([]);
                setRoundsWithScores([]);
                setAreScoresLoading(false);
            }
            return;
        }

        if (rawRoundsData.length === 0) {
            setAreScoresLoading(false);
            setScores([]);
            setRoundsWithScores([]);
            return;
        }

        const fetchAndProcessScores = async () => {
            setAreScoresLoading(true);
            const processedRoundsWithScores = await Promise.all(
                rawRoundsData.map(async (round) => {
                    const scoresQuery = query(collection(firestore, 'sessions', sessionId, 'rounds', round.id, 'scores'), orderBy('timestamp', 'desc'));
                    const scoresSnapshot = await getDocs(scoresQuery);
                    const scoresFromThisRound = scoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScoreEntry));
                    return { ...round, scores: scoresFromThisRound };
                })
            );
            
            const allScoresFlattened = processedRoundsWithScores.flatMap(r => r.scores || []);
            allScoresFlattened.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

            setRoundsWithScores(processedRoundsWithScores);
            setScores(allScoresFlattened);
            setAreScoresLoading(false);
        };
        
        fetchAndProcessScores();

        // Set up listeners for real-time updates. When any score collection changes, refetch all scores.
        const unsubscribers = rawRoundsData.map(round => {
            const scoresQuery = query(collection(firestore, 'sessions', sessionId, 'rounds', round.id, 'scores'));
            return onSnapshot(scoresQuery, () => {
                fetchAndProcessScores();
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
        const rounds = roundsWithScores || [];
        const session = sessionData;

        if (!session || players.length < 1 || rounds.length === 0 || session.lastRoundNumber < 1) {
            return [];
        }

        // Find the most recently completed round
        const lastFinishedRound = rounds.find(r => r.roundNumber === session.lastRoundNumber);
        
        if (!lastFinishedRound || !lastFinishedRound.scores || lastFinishedRound.scores.length < players.length) {
            // The round number in the session doc might be ahead of the actual data.
            // Let's try the round before that one if it exists.
            const previousRoundNumber = session.lastRoundNumber - 1;
            if (previousRoundNumber > 0) {
                 const previousRound = rounds.find(r => r.roundNumber === previousRoundNumber);
                 if (previousRound && previousRound.scores && previousRound.scores.length >= players.length) {
                    const maxScore = Math.max(...previousRound.scores.map(s => s.points));
                    if (maxScore <= 0) return [];
                    return previousRound.scores.filter(s => s.points === maxScore).map(s => s.playerId);
                 }
            }
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

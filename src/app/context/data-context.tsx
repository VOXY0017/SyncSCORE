
'use client';

import * as React from 'react';
import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { Player, ScoreEntry, Session, Round } from '@/lib/types';
import { useCollection, useDoc } from '@/firebase';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, onSnapshot } from 'firebase/firestore';
import { useLocalStorage } from '@/hooks/use-local-storage';

// --- Default session setup ---
const DEFAULT_SESSION_ID = 'main';

interface DataContextType {
    session: Session | null | undefined;
    players: Player[] | undefined;
    rounds: Round[] | undefined;
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
    const { data: roundsData, isLoading: areRoundsLoading } = useCollection<Round>(roundsQuery);

    const [scores, setScores] = useState<ScoreEntry[] | undefined>(undefined);
    const [areScoresLoading, setAreScoresLoading] = useState(true);

    // This is a complex effect to fetch all scores from all rounds.
    // It's not the most performant for very large datasets, but it's effective for this app's scale.
    useEffect(() => {
        if (!firestore || !sessionId || !roundsData) {
            if (!areRoundsLoading) { // Only set loading to false if rounds are confirmed loaded/empty
                setScores([]);
                setAreScoresLoading(false);
            }
            return;
        }

        setAreScoresLoading(true);

        if (roundsData.length === 0) {
            setScores([]);
            setAreScoresLoading(false);
            return;
        }

        const unsubscribers = roundsData.map(round => {
            const scoresQuery = query(collection(firestore, 'sessions', sessionId, 'rounds', round.id, 'scores'), orderBy('timestamp', 'desc'));
            return onSnapshot(scoresQuery, (snapshot) => {
                const scoresFromThisRound = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScoreEntry));
                
                setScores(prevScores => {
                    const otherScores = prevScores ? prevScores.filter(s => !scoresFromThisRound.some(n => n.id === s.id)) : [];
                    const updatedScores = [...otherScores, ...scoresFromThisRound];
                    // Also filter out scores from rounds that no longer exist
                    const roundIds = new Set(roundsData.map(r => r.id));
                    // This part is tricky because we don't store roundId on the score.
                    // We rely on the snapshot updates to clear scores for deleted rounds.
                    
                    // Re-sort everything every time.
                    return updatedScores.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
                });
            });
        });
        
        // Combine all scores and set loading to false after the initial fetch
        // This part is tricky with multiple listeners. We'll set loading false after a small delay
        // assuming initial data has arrived. A more robust solution might involve Promise.all
        // with getDocs first, then switching to listeners.
        const initialLoadTimer = setTimeout(() => {
            setAreScoresLoading(false);
        }, 1500); // Heuristic delay

        return () => {
            unsubscribers.forEach(unsub => unsub());
            clearTimeout(initialLoadTimer);
        };
    }, [firestore, sessionId, roundsData, areRoundsLoading]);


    const isDataLoading = isSessionLoading || arePlayersLoading || areRoundsLoading || areScoresLoading;

    // --- Memoized Derived State ---
    const lastRoundHighestScorers = useMemo(() => {
        const players = playersData || [];
        const rounds = roundsData || [];

        if (players.length < 2 || rounds.length === 0 || !scores) {
            return [];
        }

        const playerScoresInLastRound = players.map(player => {
            const playerHistory = scores
                .filter(s => s.playerId === player.id)
                .sort((a,b) => a.timestamp.toMillis() - b.timestamp.toMillis());
            return {
                player,
                history: playerHistory
            }
        });

        const gameCounts = playerScoresInLastRound.map(p => p.history.length);
        if (gameCounts.length < players.length || !gameCounts.every(c => c === gameCounts[0])) {
            return []; // Not all players have completed the same number of rounds
        }

        const completedRounds = gameCounts[0];
        if (completedRounds === 0) return [];

        const previousRoundIndex = completedRounds - 1;
        const scoresFromPreviousRound = playerScoresInLastRound.map(({ player, history }) => ({
            playerId: player.id,
            score: history[previousRoundIndex]?.points ?? 0
        }));
        
        if (scoresFromPreviousRound.length > 0) {
            const maxScoreInRound = Math.max(...scoresFromPreviousRound.map(s => s.score));
            const worstScorers = scoresFromPreviousRound.filter(s => s.score === maxScoreInRound);
            return worstScorers.map(s => s.playerId);
        }

        return [];

    }, [playersData, roundsData, scores]);


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

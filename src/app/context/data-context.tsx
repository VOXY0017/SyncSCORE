'use client';

import * as React from 'react';
import { createContext, useContext } from 'react';
import type { Player, ScoreEntry } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface DataContextType {
    players: Player[] | undefined;
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    history: ScoreEntry[] | undefined;
    setHistory: React.Dispatch<React.SetStateAction<ScoreEntry[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [players, setPlayers] = useLocalStorage<Player[]>('players', []);
    const [history, setHistory] = useLocalStorage<ScoreEntry[]>('scoreHistory', []);

    const value = {
        players,
        setPlayers,
        history,
        setHistory
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

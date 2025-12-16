'use client';

import * as React from 'react';
import { createContext, useContext, useMemo } from 'react';
import type { Player, ScoreEntry } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

interface DataContextType {
    players: Player[] | undefined;
    history: ScoreEntry[] | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { firestore } = useFirebase();

    const playersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'players'), orderBy('score', 'desc'));
    }, [firestore]);

    const historyQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'history'), orderBy('timestamp', 'desc'));
    }, [firestore]);

    const { data: playersData } = useCollection<Player>(playersQuery);
    const { data: historyData } = useCollection<ScoreEntry>(historyQuery);

    const value = useMemo(() => ({
        players: playersData || [],
        history: historyData || [],
    }), [playersData, historyData]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

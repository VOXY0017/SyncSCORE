
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTheme } from "next-themes"
import { useData } from '@/app/context/data-context';
import type { Player } from '@/lib/types';
import { useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useLocalStorage } from '@/hooks/use-local-storage';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowRight, ArrowLeft, Moon, Sun } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const DEFAULT_SESSION_ID = 'main';

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

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    if (!mounted) {
        return (
            <Card className="h-full">
                <CardContent className="flex items-center justify-center p-3 h-full">
                    <Skeleton className="h-7 w-7 rounded-md" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center p-3 h-full">
                <Button variant="outline" size="icon" onClick={toggleTheme} className="h-full w-full flex-shrink-0">
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Ganti tema</span>
                </Button>
            </CardContent>
        </Card>
    );
}

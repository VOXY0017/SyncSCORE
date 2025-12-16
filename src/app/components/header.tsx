
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useData } from '@/app/context/data-context';
import Link from 'next/link';
import { Poppins } from 'next/font/google';

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowRight, ArrowLeft, Moon, Sun, Settings, Trophy, Gamepad2, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ThemeToggleSwitch } from '@/app/components/theme-toggle-switch';

const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
});

function RotationInfo() {
    const { session, isDataLoading } = useData();
    
    if (isDataLoading || !session || session.lastRoundNumber === 0 && (session.lastRoundNumber || 0) < 1) {
        return null;
    }
    
    const rotationDirection = session.lastRoundNumber % 2 === 0 ? 'kiri' : 'kanan';
    const Icon = rotationDirection === 'kanan' ? ArrowRight : ArrowLeft;

    return (
        <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
            <Icon 
                className={cn(
                    'h-4 w-4',
                    rotationDirection === 'kanan' ? 'text-success' : 'text-destructive',
                )}
            />
            <span>{rotationDirection === 'kanan' ? 'Kanan' : 'Kiri'}</span>
        </div>
    );
}


function RoundInfo() {
    const { session, isDataLoading } = useData();

    if (isDataLoading || !session) {
        return <Skeleton className="h-5 w-20" />;
    }

    // If game hasn't started (round 0), show it as Round 1 to the user.
    const displayRound = session.lastRoundNumber === 0 ? 1 : session.lastRoundNumber;

    return (
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Gamepad2 className="h-4 w-4" />
            <span>Ronde {displayRound}</span>
        </div>
    );
}

function MVPInfo() {
    const { players, isDataLoading } = useData();

    if (isDataLoading || !players || players.length === 0) {
        return <Skeleton className="h-5 w-28" />;
    }

    const mvp = [...players].sort((a,b) => b.totalPoints - a.totalPoints)[0];

    if (!mvp || mvp.totalPoints <= 0) {
        return <div className="text-sm font-medium text-muted-foreground">Belum ada MVP</div>;
    }
    
    return (
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="font-bold text-foreground">{mvp.name}</span>
        </div>
    );
}

export default function AppHeader() {
    const { session } = useData();
    return (
        <header className="w-full max-w-screen-lg mx-auto space-y-2 px-2 sm:px-0 py-2 sm:py-4">
            {/* Main Header */}
            <div className="flex justify-between items-center">
                 <h1 className={cn(
                    "text-xl sm:text-2xl font-bold tracking-tight",
                    fontPoppins.className
                    )}>
                    Papan Skor Markas B7
                </h1>
                <div className="flex items-center gap-1">
                    <ThemeToggleSwitch />
                </div>
            </div>
            {/* Sub Header */}
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2">
                <RoundInfo />
                {session && (session.lastRoundNumber > 0) && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                <RotationInfo />
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <MVPInfo />
            </div>
        </header>
    );
}

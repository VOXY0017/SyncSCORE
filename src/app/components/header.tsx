
'use client';

import * as React from 'react';
import { useData } from '@/app/context/data-context';
import { Poppins } from 'next/font/google';

import { ArrowRight, ArrowLeft, Gamepad2, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ThemeToggleSwitch } from '@/app/components/theme-toggle-switch';
import { LastRoundHighestScorerInfo } from '@/app/components/last-round-info';


const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
});

function RotationInfo() {
    const { session, isDataLoading, players } = useData();
    
    if (isDataLoading || !session || (session.lastRoundNumber < 1 && players && players.length === 0)) {
        return null;
    }
    
    const currentRound = (session.lastRoundNumber || 0) + 1;
    const rotationDirection = currentRound % 2 !== 0 ? 'kanan' : 'kiri';
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
    
    const displayRound = (session.lastRoundNumber || 0) < 1 ? 1 : (session.lastRoundNumber + 1);

    return (
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Gamepad2 className="h-4 w-4" />
            <span>Ronde {displayRound}</span>
        </div>
    );
}

export default function AppHeader() {
    const { session } = useData();
    return (
        <header className="w-full max-w-screen-lg mx-auto space-y-2 px-4 pt-4 sm:px-6">
            {/* Main Header */}
            <div className="flex justify-between items-center">
                 <h1 className={cn(
                    "text-xl sm:text-2xl font-bold tracking-tight",
                    fontPoppins.className
                    )}>
                    Papan Skor
                </h1>
                <div className="flex items-center gap-1">
                    <ThemeToggleSwitch />
                </div>
            </div>
            {/* Sub Header */}
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2">
                <RoundInfo />
                {session && (session.lastRoundNumber >= 0) && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                <RotationInfo />
                {session && (session.lastRoundNumber > 0) && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                <LastRoundHighestScorerInfo />
            </div>
        </header>
    );
}

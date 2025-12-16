
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTheme } from "next-themes"
import { useData } from '@/app/context/data-context';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowRight, ArrowLeft, Moon, Sun } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TopPlayerData {
    name: string;
    score: number;
}

interface GameInfoData {
    direction: 'Kanan' | 'Kiri';
    Icon: React.FC<any>;
}

export function RotationInfo() {
    const { players, history } = useData();
    const [gameInfo, setGameInfo] = useState<GameInfoData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (players !== undefined && history !== undefined) {
            let completedRounds = 0;
            const playerGameCounts: Record<string, number> = {};

            if (players.length > 0) {
                players.forEach(player => {
                    playerGameCounts[player.id] = history.filter(h => h.playerId === player.id).length;
                });
                if (Object.keys(playerGameCounts).length === players.length && players.length > 0) {
                    completedRounds = Math.min(...Object.values(playerGameCounts));
                }
            }
            
            const nextGameNum = completedRounds + 1;
            setGameInfo(nextGameNum % 2 !== 0 ? { direction: 'Kanan', Icon: ArrowRight } : { direction: 'Kiri', Icon: ArrowLeft });
            setIsLoading(false);
        }
    }, [players, history]);

    return (
        <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center p-3 text-center h-full">
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20 mx-auto" />
                        <Skeleton className="h-8 w-8 mx-auto mt-1" />
                    </div>
                ) : gameInfo ? (
                    <TooltipProvider delayDuration={150}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex flex-col items-center leading-none cursor-help">
                                    <p className="text-xs text-muted-foreground font-medium">Putaran</p>
                                    <div className="flex items-center gap-2 mt-1">
                                         <gameInfo.Icon className={`h-6 w-6 ${gameInfo.direction === 'Kanan' ? 'text-success' : 'text-destructive'}`} />
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Putaran selanjutnya ke {gameInfo.direction}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : <p className="text-xs text-muted-foreground">...</p>}
            </CardContent>
        </Card>
    );
}

export function TopPlayerInfo() {
    const { players, history } = useData();
    const [topPlayer, setTopPlayer] = useState<TopPlayerData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (players !== undefined && history !== undefined) {
            let completedRounds = 0;
            if (players.length > 0) {
                const playerGameCounts = players.reduce((acc, player) => {
                    acc[player.id] = history.filter(h => h.playerId === player.id).length;
                    return acc;
                }, {} as Record<string, number>);
                if (Object.keys(playerGameCounts).length === players.length) {
                    completedRounds = Math.min(...Object.values(playerGameCounts));
                }
            }

            if (completedRounds > 0) {
                const previousRoundIndex = completedRounds - 1;
                const scoresFromPreviousRound: TopPlayerData[] = [];
                const playerHistories = players.map(player => ({
                    player,
                    history: history.filter(h => h.playerId === player.id).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                }));

                playerHistories.forEach(({ player, history }) => {
                    if (history.length > previousRoundIndex) {
                        scoresFromPreviousRound.push({ name: player.name, score: history[previousRoundIndex].points });
                    }
                });
                
                setTopPlayer(scoresFromPreviousRound.sort((a, b) => b.score - a.score)[0] || null);
            } else {
                setTopPlayer(null);
            }
            setIsLoading(false);
        }
    }, [players, history]);

    return (
        <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center p-3 text-center h-full">
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24 mx-auto" />
                        <Skeleton className="h-4 w-32 mx-auto" />
                    </div>
                ) : topPlayer ? (
                    <div className='flex flex-col items-center leading-none'>
                        <p className="text-xs text-muted-foreground font-medium">Pemenang Poin Lalu</p>
                        <div className="flex items-center gap-1 mt-1">
                            <p className="font-bold text-base line-clamp-1 text-warning">
                                {topPlayer.name}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground text-center">Belum ada pemenang.</p>
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

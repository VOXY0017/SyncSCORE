'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTheme } from "next-themes"
import { useData } from '@/app/context/data-context';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft, Crown, Moon, Sun, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TopPlayerData {
    name: string;
    score: number;
}

export default function GameInfo() {
    const { players, history } = useData();
    const { setTheme, theme } = useTheme()
    const [isLoading, setIsLoading] = useState(true);
    const [gameInfo, setGameInfo] = useState<{
        direction: 'Kanan' | 'Kiri';
        Icon: React.FC<any>;
    } | null>(null);
    const [topPlayer, setTopPlayer] = useState<TopPlayerData | null>(null);
    const [nextGameNumber, setNextGameNumber] = useState<number | null>(null);

    useEffect(() => {
        if (players !== undefined && history !== undefined) {
            let completedRounds = 0;
            const playerGameCounts: Record<string, number> = {};

            if (players.length > 0) {
                players.forEach(player => {
                    playerGameCounts[player.name] = history.filter(h => h.playerName === player.name).length;
                });
                if (Object.keys(playerGameCounts).length === players.length && players.length > 0) {
                    completedRounds = Math.min(...Object.values(playerGameCounts));
                }
            }

            const nextGameNum = completedRounds + 1;
            setNextGameNumber(nextGameNum);
            
            if (nextGameNum % 2 !== 0) { // Ganjil (Odd) -> Kanan
                setGameInfo({ direction: 'Kanan', Icon: ArrowRight });
            } else { // Genap (Even) -> Kiri
                setGameInfo({ direction: 'Kiri', Icon: ArrowLeft });
            }

            // Get Top 1 Player from the Previous Round
            if (completedRounds > 0) {
                const previousRoundIndex = completedRounds - 1;
                const scoresFromPreviousRound: TopPlayerData[] = [];

                const playerHistories = players.map(player => ({
                    player,
                    history: history.filter(h => h.playerName === player.name)
                                    .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                }));

                playerHistories.forEach(({ player, history }) => {
                    if (history.length > previousRoundIndex) {
                        const previousGameScore = history[previousRoundIndex].points;
                        scoresFromPreviousRound.push({ name: player.name, score: previousGameScore });
                    }
                });

                scoresFromPreviousRound.sort((a, b) => b.score - a.score);
                setTopPlayer(scoresFromPreviousRound[0] || null);
            } else {
                setTopPlayer(null);
            }

            setIsLoading(false);
        }
    }, [players, history]);

    const InfoSkeleton = () => (
        <div className="flex justify-between items-center p-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-8" />
        </div>
    );

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <Card className="shadow-lg">
            {/* Menggunakan grid 3 kolom untuk kontrol posisi yang lebih baik: Kiri | Tengah | Kanan */}
            <CardContent className="grid grid-cols-[1fr,auto,1fr] sm:grid-cols-[1fr,auto,auto] items-center p-3 sm:p-4 gap-2">
                {isLoading ? (
                    <div className="col-span-3">
                        <InfoSkeleton />
                    </div>
                ) : gameInfo ? (
                    <>
                        {/* KIRI: Informasi Rotasi Putaran Berikutnya */}
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col items-start leading-none">
                                <p className="text-xs text-muted-foreground font-medium">Putaran</p>
                                <div className="flex items-center gap-1">
                                    <gameInfo.Icon className={`h-5 w-5 ${gameInfo.direction === 'Kanan' ? 'text-green-500' : 'text-red-500'}`} />
                                    <p className={`font-bold text-base ${gameInfo.direction === 'Kanan' ? 'text-green-500' : 'text-red-500'}`}>
                                        ({gameInfo.direction})
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* TENGAH: Pemenang Poin Sebelumnya */}
                        <div className="flex justify-center flex-grow">
                            {topPlayer ? (
                                <div className='flex flex-col items-center leading-none'>
                                    <p className="text-xs text-muted-foreground font-medium">Pemenang Poin Lalu</p>
                                    <div className="flex items-center gap-1">
                                        <Crown className='h-4 w-4 text-yellow-500' />
                                        <p className="font-bold text-base line-clamp-1 text-yellow-500">
                                            {topPlayer.name}
                                        </p>
                                        <p className={`font-medium text-base ${topPlayer.score > 0 ? 'text-green-500' : 'text-destructive'}`}>
                                            ({topPlayer.score > 0 ? `+${topPlayer.score}` : topPlayer.score})
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground text-center">Belum ada pemenang.</p>
                            )}
                        </div>

                        {/* KANAN: Theme Toggle */}
                        <div className="flex justify-end">
                            <Button variant="outline" size="icon" onClick={toggleTheme} className="h-7 w-7 flex-shrink-0">
                                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-center text-muted-foreground col-span-3 p-2">Tidak dapat memuat data game.</p>
                )}
            </CardContent>
        </Card>
    );
}

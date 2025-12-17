
'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import type { Player, ScoreEntry, Round } from '@/lib/types';
import { useData } from '@/app/context/data-context';
import { CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PivotData {
  players: Player[];
  rounds: {
    roundNumber: number;
    scores: Record<string, number | null>;
    highestScore: number | null;
  }[];
}

export default function GlobalScoreHistory() {
  const { players, rounds, scores, isDataLoading } = useData();
  const [pivotData, setPivotData] = useState<PivotData | null>(null);

  useEffect(() => {
    if (isDataLoading || !players || !scores || !rounds) return;

    if (players.length > 0 && rounds.length > 0) {
      const sortedPlayers = [...players].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      
      const scoresByRoundId: Record<string, ScoreEntry[]> = {};
      for (const score of scores) {
          const roundForScore = rounds.find(r => r.scores?.some(s => s.id === score.id));
          if (roundForScore) {
            if (!scoresByRoundId[roundForScore.id]) {
                scoresByRoundId[roundForScore.id] = [];
            }
            scoresByRoundId[roundForScore.id].push(score);
          }
      }

      const roundData = rounds.map(round => {
        const roundScores: Record<string, number | null> = {};
        let highestScoreInRound: number | null = null;
        
        const scoresInThisRound = scoresByRoundId[round.id] || [];
        
        sortedPlayers.forEach(player => {
            const playerScore = scoresInThisRound.find(s => s.playerId === player.id);
            if(playerScore) {
                roundScores[player.id] = playerScore.points;
                if (highestScoreInRound === null || playerScore.points > highestScoreInRound) {
                    highestScoreInRound = playerScore.points;
                }
            } else {
                roundScores[player.id] = null;
            }
        });
        
        return {
            roundNumber: round.roundNumber,
            scores: roundScores,
            highestScore: highestScoreInRound,
        };
      });

      setPivotData({
        players: sortedPlayers,
        rounds: roundData,
      });

    } else {
      setPivotData({ players: players || [], rounds: [] });
    }

  }, [isDataLoading, players, rounds, scores]);


  const HistorySkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
            <TableCell className="text-center p-1 sm:p-2"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
            {[...Array(3)].map((_, j) => (
              <TableCell key={j} className="text-center p-1 sm:p-2"><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
            ))}
        </TableRow>
      ))}
    </>
  );

  return (
      <CardContent className="p-0 h-full">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[60px] text-center p-1 sm:p-2">Ronde</TableHead>
                {isDataLoading ? (
                  [...Array(3)].map((_, i) => <TableHead key={i} className="text-center p-1 sm:p-2"><Skeleton className="h-5 w-16 mx-auto" /></TableHead>)
                ) : pivotData && pivotData.players.length > 0 ? (
                  pivotData.players.map((player) => (
                    <TableHead key={player.id} className="text-center min-w-[70px] p-1 sm:p-2">{player.name}</TableHead>
                  ))
                ) : (
                    <TableHead className="text-center p-2 w-full">Riwayat Skor</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDataLoading ? (
                <HistorySkeleton />
              ) : pivotData && pivotData.rounds.length > 0 ? (
                pivotData.rounds.map((round) => (
                  <TableRow key={round.roundNumber}>
                    <TableCell className="text-center p-1 sm:p-2 font-medium text-muted-foreground">{round.roundNumber}</TableCell>
                    {pivotData.players.map((player) => {
                      const score = round.scores[player.id];
                      const isHighest = score !== null && score === round.highestScore && round.highestScore > 0;
                      return (
                        <TableCell 
                          key={`${round.roundNumber}-${player.id}`} 
                          className={cn(
                            "text-center p-0 sm:p-2 text-xs sm:text-sm transition-colors",
                            isHighest && "bg-yellow-400/10"
                          )}
                        >
                          {score !== null ? (
                            <span
                              className={cn(
                                "font-bold",
                                score > 0 ? "text-success" : "text-destructive",
                                isHighest && "text-yellow-500 dark:text-yellow-400"
                              )}
                            >
                              {score > 0 ? `+${score}` : score}
                            </span>
                          ) : (
                            <span className="text-muted-foreground"> – </span>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={pivotData ? pivotData.players.length + 1 : 2} className="h-24 text-center text-muted-foreground">
                    {players && players.length > 0 ? "Belum ada riwayat skor." : "Tambahkan pemain untuk melihat riwayat."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
      </CardContent>
  );
}

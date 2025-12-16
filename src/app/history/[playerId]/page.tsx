
'use client'

import ScoreHistory from '@/app/components/score-history';
import { useSearchParams } from 'next/navigation';

export default function PlayerHistoryPage({ params }: { params: { playerId: string } }) {
  const searchParams = useSearchParams();
  const playerName = searchParams.get('name') || 'Pemain';

  return (
      <ScoreHistory playerId={params.playerId} playerName={decodeURIComponent(playerName)} />
  );
}

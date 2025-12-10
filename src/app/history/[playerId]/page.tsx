import ScoreHistory from '@/app/components/score-history';

export default function HistoryPage({ params }: { params: { playerId: string } }) {
  return (
    <main>
      <ScoreHistory playerId={params.playerId} />
    </main>
  );
}

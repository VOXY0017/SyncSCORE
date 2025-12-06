import ScoreSyncClient from './components/score-sync-client';

export default function Home() {
  return (
    <main className="h-screen overflow-hidden p-4 sm:p-6 md:p-8">
      <ScoreSyncClient />
    </main>
  );
}

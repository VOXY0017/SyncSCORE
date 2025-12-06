import ScoreSyncClient from './components/score-sync-client';

export default function Home() {
  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="w-full">
        <ScoreSyncClient />
      </div>
    </main>
  );
}

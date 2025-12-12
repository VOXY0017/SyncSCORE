import Leaderboard from './components/leaderboard';
import GlobalScoreHistory from './components/global-score-history';
import GameInfo from './components/game-info';

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-custom-background bg-cover bg-center relative flex flex-col">
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="container flex-grow max-w-screen-xl mx-auto py-4 sm:py-8 relative z-10">
        <main className="grid grid-cols-1 lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-3 space-y-8">
            <GameInfo />
            <Leaderboard />
          </div>
          <div className="lg:col-span-2 mt-8 lg:mt-0">
            <GlobalScoreHistory />
          </div>
        </main>
      </div>
    </div>
  );
}

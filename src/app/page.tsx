import Leaderboard from './components/leaderboard';
import GlobalScoreHistory from './components/global-score-history';
import GameInfo from './components/game-info';
import PlayerManagement from './components/player-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-custom-background bg-cover bg-center relative flex flex-col">
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="container flex-grow max-w-screen-xl mx-auto py-4 sm:py-8 relative z-10">
        <main className="space-y-4">
          <GameInfo />
          <Tabs defaultValue="total" className="w-full" id="main-tabs">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="total">Leaderboard</TabsTrigger>
              <TabsTrigger value="history">Riwayat Game</TabsTrigger>
              <TabsTrigger value="management">Manajemen Pemain</TabsTrigger>
            </TabsList>
            <TabsContent value="total" className="mt-4">
              <Leaderboard />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <GlobalScoreHistory />
            </TabsContent>
            <TabsContent value="management" className="mt-4">
              <PlayerManagement />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

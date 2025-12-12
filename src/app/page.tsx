import Leaderboard from './components/leaderboard';
import GlobalScoreHistory from './components/global-score-history';
import GameInfo from './components/game-info';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-custom-background bg-cover bg-center relative flex flex-col">
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="container flex-grow max-w-screen-xl mx-auto py-4 sm:py-8 relative z-10">
        <main>
          <Tabs defaultValue="total" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="total">Skor Total</TabsTrigger>
              <TabsTrigger value="history">Skor per Game</TabsTrigger>
            </TabsList>
            <TabsContent value="total" className="mt-4">
              <div className="space-y-8">
                <GameInfo />
                <Leaderboard />
              </div>
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <GlobalScoreHistory />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

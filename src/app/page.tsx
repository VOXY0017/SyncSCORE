
import Leaderboard from './components/leaderboard';
import GlobalScoreHistory from './components/global-score-history';
import GameInfo from './components/game-info';
import PlayerManagement from './components/player-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Trophy, History, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-custom-background bg-cover bg-center relative flex flex-col">
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="container flex-grow max-w-screen-xl mx-auto py-4 sm:py-8 relative z-10">
        <main className="space-y-4">
          <GameInfo />
          <Tabs defaultValue="leaderboard" className="w-full" id="main-tabs">
            <Card>
              <CardHeader className="p-2 sm:p-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="leaderboard">
                    <Trophy className="h-4 w-4 mr-2" />
                    Leaderboard
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="h-4 w-4 mr-2" />
                    Riwayat Game
                  </TabsTrigger>
                  <TabsTrigger value="management">
                    <Users className="h-4 w-4 mr-2" />
                    Manajemen
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="p-0">
                <TabsContent value="leaderboard">
                  <Leaderboard />
                </TabsContent>
                <TabsContent value="history">
                  <GlobalScoreHistory />
                </TabsContent>
                <TabsContent value="management">
                  <PlayerManagement />
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

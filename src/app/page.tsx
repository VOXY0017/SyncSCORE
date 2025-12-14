
'use client';
import Leaderboard from './components/leaderboard';
import GlobalScoreHistory from './components/global-score-history';
import { RotationInfo, TopPlayerInfo, ThemeToggle } from './components/game-info';
import PlayerManagement from './components/player-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader } from '@/components/ui/card';
import { Trophy, History, Users } from 'lucide-react';


export default function Home() {

  return (
    <div className="min-h-screen w-full bg-custom-background bg-cover bg-center relative flex flex-col">
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="container flex-grow max-w-screen-lg mx-auto py-2 sm:py-4 relative z-10">
        <main className="space-y-4">
           <h1 className="text-center text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-primary font-poppins sm:text-4xl">
              Score Markas B7
            </h1>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              <RotationInfo />
              <TopPlayerInfo />
              <ThemeToggle />
          </div>
          <Tabs defaultValue="leaderboard" className="w-full">
            <Card>
              <CardHeader className="p-2">
                 <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="leaderboard">
                      <Trophy className="h-4 mr-2" />
                      Leaderboard
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      <History className="h-4 mr-2" />
                      History
                    </TabsTrigger>
                    <TabsTrigger value="management">
                      <Users className="h-4 mr-2" />
                      Manage
                    </TabsTrigger>
                  </TabsList>
              </CardHeader>
              <TabsContent value="leaderboard">
                <Leaderboard />
              </TabsContent>
              <TabsContent value="history">
                <GlobalScoreHistory />
              </TabsContent>
              <TabsContent value="management">
                <PlayerManagement />
              </TabsContent>
            </Card>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

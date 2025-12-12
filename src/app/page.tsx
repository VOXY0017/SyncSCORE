
'use client';
import Leaderboard from './components/leaderboard';
import GlobalScoreHistory from './components/global-score-history';
import GameInfo from './components/game-info';
import PlayerManagement from './components/player-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Trophy, History, Users, Sun, Moon } from 'lucide-react';
import { useTheme } from "next-themes"
import { Button } from '@/components/ui/button';

export default function Home() {
  const { setTheme, theme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen w-full bg-custom-background bg-cover bg-center relative flex flex-col">
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="container flex-grow max-w-screen-xl mx-auto py-4 sm:py-6 relative z-10">
        <main className="space-y-4">
          <div className="flex justify-between items-center sm:hidden mb-2 px-2">
             <h1 className="text-xl font-bold text-white">Scoreboard</h1>
             <Button variant="outline" size="icon" onClick={toggleTheme}>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
          </div>
          <GameInfo />
          <Tabs defaultValue="leaderboard" className="w-full md:grid md:grid-cols-4 md:gap-6" id="main-tabs">
            <Card className="md:col-span-1">
              <CardHeader className="p-0">
                 <TabsList className="grid w-full grid-cols-3 md:grid-cols-1 md:h-full">
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
            </Card>

            <div className="mt-4 md:mt-0 md:col-span-3">
                <TabsContent value="leaderboard">
                  <Leaderboard />
                </TabsContent>
                <TabsContent value="history">
                  <GlobalScoreHistory />
                </TabsContent>
                <TabsContent value="management">
                  <PlayerManagement />
                </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

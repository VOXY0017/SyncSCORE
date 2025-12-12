
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
      <div className="container flex-grow max-w-screen-lg mx-auto py-2 sm:py-4 relative z-10">
        <main className="space-y-4">
          <div className="flex justify-between items-center sm:hidden mb-2 px-1">
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-white">
                Fanci
             </h1>
             <Button variant="outline" size="icon" className="h-8 w-8" onClick={toggleTheme}>
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
          </div>
          <div className="hidden sm:block text-center mb-4">
              <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-primary">
                  Fanci
              </h1>
          </div>
          <GameInfo />
          <Tabs defaultValue="leaderboard" className="w-full">
            <Card>
              <CardHeader className="p-0">
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

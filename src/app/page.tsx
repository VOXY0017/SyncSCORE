'use client';
import Leaderboard from './components/leaderboard';
import GlobalScoreHistory from './components/global-score-history';
import { RotationInfo, TopPlayerInfo, ThemeToggle } from './components/game-info';
import PlayerManagement from './components/player-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Trophy, History, Users } from 'lucide-react';
import { Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';
import { useAuth, initiateAnonymousSignIn } from '@/firebase';
import { useEffect } from 'react';

const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
});

export default function Home() {
    const auth = useAuth();
    useEffect(() => {
        if (auth) {
            initiateAnonymousSignIn(auth);
        }
    }, [auth]);

  return (
    <div className="min-h-screen w-full bg-custom-background bg-cover bg-center relative flex flex-col">
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="container flex-grow max-w-screen-lg mx-auto py-2 sm:py-4 relative z-10">
        <main className="space-y-4">
           <h1 className={cn(
              "text-center text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-primary sm:text-4xl",
              fontPoppins.className
            )}>
              Papan Skor Markas B7
            </h1>
          <div className="grid grid-cols-3 gap-2 sm:gap-6">
              <RotationInfo />
              <TopPlayerInfo />
              <ThemeToggle />
          </div>
          <Tabs defaultValue="leaderboard" className="w-full" id="management">
            <Card>
              <div className="p-2">
                 <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="leaderboard">
                      <Trophy className="h-4" />
                      <span className="hidden sm:inline">Peringkat</span>
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      <History className="h-4" />
                      <span className="hidden sm:inline">Riwayat</span>
                    </TabsTrigger>
                    <TabsTrigger value="management">
                      <Users className="h-4" />
                      <span className="hidden sm:inline">Kelola</span>
                    </TabsTrigger>
                  </TabsList>
              </div>
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

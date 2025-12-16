'use client';
import Leaderboard from './components/leaderboard';
import GlobalScoreHistory from './components/global-score-history';
import { RotationInfo, LowestScorePlayerInfo, ThemeToggle } from './components/game-info';
import PlayerManagement from './components/player-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, History, Users } from 'lucide-react';
import { Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';
import { useAuth, initiateAnonymousSignIn } from '@/firebase';
import { useEffect } from 'react';

const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
});

export default function Home({ params }: { params: { playerId: string } }) {
    const auth = useAuth();
    useEffect(() => {
        if (auth) {
            initiateAnonymousSignIn(auth);
        }
    }, [auth]);

  if (params.playerId) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="container flex-grow flex flex-col max-w-screen-lg mx-auto py-2 sm:py-4 relative z-10">
        <main className="space-y-4 flex flex-col flex-grow">
           <h1 className={cn(
              "text-center text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-primary sm:text-4xl",
              fontPoppins.className
            )}>
              Papan Skor Markas B7
            </h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-6">
              <RotationInfo />
              <LowestScorePlayerInfo />
              <ThemeToggle />
          </div>
          <Tabs defaultValue="leaderboard" className="w-full flex flex-col flex-grow" id="management">
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
            <TabsContent value="leaderboard" className="flex-grow">
                <Leaderboard />
            </TabsContent>
            <TabsContent value="history" className="flex-grow">
                <GlobalScoreHistory />
            </TabsContent>
            <TabsContent value="management" className="flex-grow">
                <PlayerManagement />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

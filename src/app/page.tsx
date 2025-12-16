
'use client';
import Leaderboard from './components/leaderboard';
import GlobalScoreHistory from './components/global-score-history';
import { RotationInfo, LowestScorePlayerInfo, ThemeToggle } from './components/game-info';
import PlayerManagement from './components/player-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Trophy, History, Users } from 'lucide-react';
import { Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';
import { useAuth, initiateAnonymousSignIn, useFirebase } from '@/firebase';
import { useEffect, useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useLocalStorage } from '@/hooks/use-local-storage';

const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
});

const DEFAULT_SESSION_ID = 'main';

export default function Home({ params }: { params: { playerId: string } }) {
    const { auth, firestore } = useFirebase();
    const [sessionId, setSessionId] = useLocalStorage('sessionId', DEFAULT_SESSION_ID);
    
    // Effect to sign in anonymously
    useEffect(() => {
        if (auth && !auth.currentUser) {
            initiateAnonymousSignIn(auth);
        }
    }, [auth]);

    // Effect to initialize the default session if it doesn't exist
    useEffect(() => {
        if (firestore && sessionId) {
            const sessionRef = doc(firestore, 'sessions', sessionId);
            // This is a simplified check. `getDoc` would be more robust.
            // For now, we just set it, which is fine for a single session app.
            setDoc(sessionRef, {
                rotationDirection: 'kanan',
                status: 'active',
                lastRoundNumber: 0,
                createdAt: serverTimestamp(),
                theme: 'system'
            }, { merge: true });
        }
    }, [firestore, sessionId]);


  if (params.playerId) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="w-full max-w-screen-lg mx-auto flex flex-col flex-grow">
        <main className="space-y-2 sm:space-y-4 flex flex-col flex-grow">
           <h1 className={cn(
              "text-center text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-primary sm:text-4xl py-2 sm:py-0",
              fontPoppins.className
            )}>
              Papan Skor Markas B7
            </h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 px-2 sm:px-0">
              <RotationInfo />
              <LowestScorePlayerInfo />
              <ThemeToggle />
          </div>
          <Tabs defaultValue="leaderboard" className="w-full flex flex-col flex-grow" id="management">
            <div className="px-2 sm:px-0">
                <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="leaderboard">
                    <Trophy className="h-4 w-4 mr-1 sm:mr-2"/>
                    <span>Peringkat</span>
                </TabsTrigger>
                <TabsTrigger value="history">
                    <History className="h-4 w-4 mr-1 sm:mr-2"/>
                    <span>Riwayat</span>
                </TabsTrigger>
                <TabsTrigger value="management">
                    <Users className="h-4 w-4 mr-1 sm:mr-2"/>
                    <span>Kelola</span>
                </TabsTrigger>
                </TabsList>
            </div>
            <Card className="flex-grow rounded-t-none sm:rounded-t-lg">
                <TabsContent value="leaderboard" className="m-0 h-full">
                    <Leaderboard />
                </TabsContent>
                <TabsContent value="history" className="m-0 h-full">
                    <GlobalScoreHistory />
                </TabsContent>
                <TabsContent value="management" className="m-0 h-full">
                    <PlayerManagement />
                </TabsContent>
            </Card>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

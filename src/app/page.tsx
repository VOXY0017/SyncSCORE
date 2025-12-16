
'use client';
import Leaderboard from './components/leaderboard';
import GlobalScoreHistory from './components/global-score-history';
import AppHeader from './components/header';
import PlayerManagement from './components/player-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Trophy, History, Users } from 'lucide-react';
import { useAuth, initiateAnonymousSignIn, useFirebase } from '@/firebase';
import { useEffect } from 'react';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';

const DEFAULT_SESSION_ID = 'main';

export default function Home() {
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
            
            const initializeSession = async () => {
                const sessionSnap = await getDoc(sessionRef);
                if (!sessionSnap.exists()) {
                    await setDoc(sessionRef, {
                        rotationDirection: 'kanan',
                        status: 'active',
                        lastRoundNumber: 0,
                        createdAt: serverTimestamp(),
                        theme: 'system'
                    });
                }
            };

            initializeSession();
        }
    }, [firestore, sessionId]);

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <AppHeader />
      <main className="flex-grow flex flex-col overflow-hidden">
        <Tabs defaultValue="leaderboard" className="w-full flex-grow flex flex-col" id="management">
          
          {/* Konten Tab */}
          <div className="flex-grow overflow-y-auto px-4 sm:px-6">
              <TabsContent value="leaderboard" className="m-0 h-full">
                  <Leaderboard />
              </TabsContent>
              <TabsContent value="history" className="m-0 h-full">
                  <GlobalScoreHistory />
              </TabsContent>
              <TabsContent value="management" className="m-0 h-full">
                  <PlayerManagement />
              </TabsContent>
          </div>
          
          {/* Navigasi Tab di Bawah */}
          <TabsList className={cn(
              "grid w-full grid-cols-3 rounded-none h-16 sm:h-20",
              "border-t"
              )}>
            <TabsTrigger value="leaderboard" className="h-full flex-col gap-1 rounded-none text-xs sm:text-sm">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6"/>
                <span>Peringkat</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="h-full flex-col gap-1 rounded-none text-xs sm:text-sm">
                <History className="h-5 w-5 sm:h-6 sm:w-6"/>
                <span>Riwayat</span>
            </TabsTrigger>
            <TabsTrigger value="management" className="h-full flex-col gap-1 rounded-none text-xs sm:text-sm">
                <Users className="h-5 w-5 sm:h-6 sm:w-6"/>
                <span>Kelola</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </main>
    </div>
  );
}

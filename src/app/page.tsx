
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
    <div className="min-h-screen w-full flex flex-col">
      <AppHeader />
      <div className="w-full max-w-screen-lg mx-auto flex flex-col flex-grow px-2 sm:px-0 pb-2 sm:pb-4">
        <main className="flex flex-col flex-grow">
          <Tabs defaultValue="leaderboard" className="w-full flex flex-col flex-grow" id="management">
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

    
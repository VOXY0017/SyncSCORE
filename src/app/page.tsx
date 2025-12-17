
'use client';
import Leaderboard from './components/leaderboard';
import GlobalScoreHistory from './components/global-score-history';
import AppHeader from './components/header';
import PlayerManagement from './components/player-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow flex flex-col p-4 sm:p-6">
        <Tabs defaultValue="leaderboard" className="w-full flex-grow flex flex-col" id="management">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="leaderboard">Peringkat</TabsTrigger>
                <TabsTrigger value="history">Riwayat</TabsTrigger>
                <TabsTrigger value="management">Kelola</TabsTrigger>
            </TabsList>
            <div className="mt-4 flex-grow">
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
        </Tabs>
      </main>
    </div>
  );
}

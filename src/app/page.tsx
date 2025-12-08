import ScoreSyncClient from './components/score-sync-client';
import { FirebaseClientProvider } from '@/firebase';

export default function Home() {
  return (
    <main>
        <ScoreSyncClient />
    </main>
  );
}

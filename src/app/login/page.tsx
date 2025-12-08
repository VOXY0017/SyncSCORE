import AuthClient from '@/app/components/auth-client';
import { FirebaseClientProvider } from '@/firebase';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <FirebaseClientProvider>
        <AuthClient />
      </FirebaseClientProvider>
    </main>
  );
}

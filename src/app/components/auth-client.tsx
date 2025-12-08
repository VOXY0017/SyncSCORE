'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Trophy } from 'lucide-react';

export default function AuthClient() {
  console.log('AuthClient: Komponen dirender');
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  
  console.log('AuthClient: State Awal', { auth: !!auth, user, isUserLoading });

  useEffect(() => {
    console.log('AuthClient: useEffect untuk redirect berjalan', { isUserLoading, user: !!user });
    // Redirect only after loading is complete and user is confirmed
    if (!isUserLoading && user) {
      console.log('AuthClient: Pengguna terdeteksi, mengarahkan ke /');
      router.push('/');
    } else {
       console.log('AuthClient: Tidak ada pengguna atau masih loading, tetap di halaman login');
    }
  }, [user, isUserLoading, router]);

  // While loading, don't render the form to prevent flashes of content
  if (isUserLoading) {
    console.log('AuthClient: isUserLoading true, merender layar loading...');
    return <div>Loading...</div>;
  }
  
  // If user is already logged in, they will be redirected by the effect above.
  // Returning null prevents the form from flashing.
  if (user) {
    console.log('AuthClient: Pengguna sudah ada, tidak merender form, menunggu redirect dari useEffect.');
    return null;
  }

  const handleFirebaseAuthError = (error: any) => {
    console.error('AuthClient: Terjadi error Firebase Auth', error);
    let description = "An unexpected error occurred.";
    switch (error.code) {
      case 'auth/email-already-in-use':
        description = 'This email address is already in use by another account.';
        break;
      case 'auth/invalid-email':
        description = 'The email address is not valid.';
        break;
      case 'auth/weak-password':
        description = 'The password is too weak. It must be at least 6 characters long.';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        description = 'Invalid email or password.';
        break;
      default:
        description = error.message;
        break;
    }
    toast({ variant: 'destructive', title: 'Authentication Error', description });
  };
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AuthClient: Memulai proses login...');
    if (!loginEmail || !loginPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Email and password are required.' });
      return;
    }
    startTransition(async () => {
      try {
        console.log('AuthClient: Memanggil signInWithEmailAndPassword');
        await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        console.log('AuthClient: Login berhasil, menunggu redirect dari onAuthStateChanged.');
        // onAuthStateChanged in provider will handle the redirect via useEffect
      } catch (error) {
        handleFirebaseAuthError(error);
      }
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AuthClient: Memulai proses registrasi...');
    if (!registerEmail || !registerPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Email and password are required.' });
      return;
    }
    if (registerPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Registration Error', description: 'Password must be at least 6 characters long.' });
      return;
    }
    startTransition(async () => {
      try {
        console.log('AuthClient: Memanggil createUserWithEmailAndPassword');
        const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
        const newUser = userCredential.user;
        console.log('AuthClient: Registrasi Auth berhasil, pengguna dibuat:', newUser);

        if (newUser && firestore) {
          console.log('AuthClient: Menyimpan data pengguna ke Firestore...');
          const userDocRef = doc(firestore, 'users', newUser.uid);
          await setDoc(userDocRef, {
            uid: newUser.uid,
            email: newUser.email,
            createdAt: serverTimestamp(),
          });
           console.log('AuthClient: Data pengguna berhasil disimpan di Firestore.');
        }
        
        console.log('AuthClient: Registrasi selesai, menunggu redirect dari onAuthStateChanged.');
        // onAuthStateChanged in provider will handle the redirect via useEffect
      } catch (error) {
        handleFirebaseAuthError(error);
      }
    });
  };

  console.log('AuthClient: Merender form login/register.');
  return (
    <Card className="w-full max-w-md shadow-2xl shadow-primary/10">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
                <Trophy className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">ScoreSync</CardTitle>
            <CardDescription>Login or create an account to start tracking scores.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="m@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} disabled={isPending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} disabled={isPending} />
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? 'Logging in...' : 'Login'}
                </Button>
                </form>
            </TabsContent>
            <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" placeholder="m@example.com" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} disabled={isPending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input id="register-password" type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} disabled={isPending} />
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? 'Registering...' : 'Create Account'}
                </Button>
                </form>
            </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
  );
}

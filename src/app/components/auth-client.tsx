'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { initiateEmailSignUp, initiateEmailSignIn } from '@/firebase/non-blocking-login';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Trophy } from 'lucide-react';

export default function AuthClient() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  if (isUserLoading || user) {
    return <div>Loading...</div>;
  }
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Email and password are required.' });
      return;
    }
    startTransition(() => {
      initiateEmailSignIn(auth, loginEmail, loginPassword);
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail || !registerPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Email and password are required.' });
      return;
    }
    if (registerPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Registration Error', description: 'Password must be at least 6 characters long.' });
      return;
    }
    startTransition(() => {
      initiateEmailSignUp(auth, registerEmail, registerPassword);
    });
  };

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

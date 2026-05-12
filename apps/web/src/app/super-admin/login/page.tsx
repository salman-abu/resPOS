'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Lock, ShieldAlert, Mail, AlertCircle } from 'lucide-react';

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState('');
  const [passwordString, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiUrl}/super-admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, passwordString }),
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json();
      localStorage.setItem('super_admin_token', data.access_token);
      localStorage.setItem('super_admin_user', JSON.stringify(data.admin));

      router.push('/super-admin');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-100 rounded-full blur-[100px] pointer-events-none opacity-60" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-100 rounded-full blur-[100px] pointer-events-none opacity-50" />

      <Card className="w-full max-w-md border-neutral-200 bg-white/80 backdrop-blur-xl relative z-10 shadow-xl rounded-3xl p-2">
        <CardHeader className="space-y-2 text-center pb-6 pt-6">
          <div className="mx-auto w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <ShieldAlert className="w-7 h-7 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-neutral-900">
            God Mode
          </CardTitle>
          <CardDescription className="text-neutral-500 font-medium">
            Super Admin Access Only
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5 px-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-neutral-700 font-semibold text-sm"
              >
                Admin Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@respos.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 py-5 bg-white border-neutral-200 text-neutral-900 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-neutral-700 font-semibold text-sm"
              >
                Master Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={passwordString}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 py-5 bg-white border-neutral-200 text-neutral-900 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm font-mono tracking-widest text-lg"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-6 pb-8 pt-4">
            <Button
              type="submit"
              className="w-full py-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-base shadow-lg shadow-red-600/20 transition-all"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Authorize Access'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <p className="mt-8 text-neutral-400 text-sm font-medium z-10 flex items-center gap-2">
        <Lock className="w-4 h-4" /> Secure Gateway
      </p>
    </div>
  );
}

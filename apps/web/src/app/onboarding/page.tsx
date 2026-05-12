'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, Store, User } from 'lucide-react';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNext = () => setStep(2);

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between relative z-10 px-4">
        <div
          className={`flex flex-col items-center ${step >= 1 ? 'text-blue-500' : 'text-slate-500'}`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}
          >
            <User className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">Account</span>
        </div>
        <div
          className={`flex-1 h-1 mx-4 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-800'}`}
        />
        <div
          className={`flex flex-col items-center ${step >= 2 ? 'text-blue-500' : 'text-slate-500'}`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}
          >
            <Store className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">Restaurant</span>
        </div>
        <div
          className={`flex-1 h-1 mx-4 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-slate-800'}`}
        />
        <div
          className={`flex flex-col items-center ${step >= 3 ? 'text-blue-500' : 'text-slate-500'}`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}
          >
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">Complete</span>
        </div>
      </div>

      <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 shadow-2xl relative z-10">
        <CardHeader>
          <CardTitle className="text-2xl text-white">
            {step === 1 ? 'Create Owner Account' : 'Restaurant Details'}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {step === 1
              ? 'Set up your master credentials.'
              : 'Tell us about your business.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={
              step === 1
                ? (e) => {
                    e.preventDefault();
                    handleNext();
                  }
                : handleFinish
            }
            className="space-y-6"
          >
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-300">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      required
                      className="bg-slate-950 border-slate-800 text-white focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-300">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      required
                      className="bg-slate-950 border-slate-800 text-white focus-visible:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    className="bg-slate-950 border-slate-800 text-white focus-visible:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-300">
                    Mobile Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    className="bg-slate-950 border-slate-800 text-white focus-visible:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pin" className="text-slate-300">
                    Master PIN (4-6 digits)
                  </Label>
                  <Input
                    id="pin"
                    type="password"
                    maxLength={6}
                    required
                    className="bg-slate-950 border-slate-800 text-white focus-visible:ring-blue-500 font-mono tracking-widest"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName" className="text-slate-300">
                    Restaurant Name
                  </Label>
                  <Input
                    id="restaurantName"
                    required
                    className="bg-slate-950 border-slate-800 text-white focus-visible:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-slate-300">
                    Store URL Slug
                  </Label>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-800 bg-slate-800 px-3 text-slate-400 sm:text-sm">
                      respos.io/
                    </span>
                    <Input
                      id="slug"
                      required
                      className="rounded-l-none bg-slate-950 border-slate-800 text-white focus-visible:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-slate-300">
                    Address
                  </Label>
                  <Input
                    id="address"
                    className="bg-slate-950 border-slate-800 text-white focus-visible:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gstin" className="text-slate-300">
                      GSTIN (Optional)
                    </Label>
                    <Input
                      id="gstin"
                      className="bg-slate-950 border-slate-800 text-white focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan" className="text-slate-300">
                      Plan
                    </Label>
                    <select
                      id="plan"
                      className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="STARTER">Starter (Free)</option>
                      <option value="GROWTH">Growth</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  className="bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
              )}
              <div className={step === 1 ? 'w-full' : 'ml-auto'}>
                <Button
                  type="submit"
                  className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-medium ${step === 2 && 'px-8'}`}
                  disabled={loading}
                >
                  {loading ? (
                    'Creating...'
                  ) : step === 1 ? (
                    <>
                      Next Step <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

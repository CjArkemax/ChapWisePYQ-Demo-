'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTestStore } from '@/store/useTestStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';

export default function WelcomePage() {
  const [inputemail, setInputEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const setStoreEmail = useTestStore((state) => state.setEmail);
  const resetStore = useTestStore((state) => state.resetStore);

   const email = useTestStore((s) => s.email);
  const hasHydrated = useTestStore((s) => s._hasHydrated);

  // NEWAuto-redirect if inputemail exists in localStorage
  useEffect(() => {
    if (hasHydrated && email) {
      router.replace('/home');
    }
  }, [hasHydrated, email, router]);


   async function handleStart() {
    if (!inputemail.trim()) return;
    setIsLoading(true);

    try {
      // 1. Wipe any previous test state so we start fresh
      resetStore();

      // 2. Upsert user to Supabase
      const { error } = await supabase
        .from('pilot_users')
        .upsert({ email: inputemail.trim() }, { onConflict: 'email' });

      if (error) throw error;

      // 3. Save inputemail to Zustand & navigate
      setStoreEmail(inputemail.trim());
      router.push('/chapters');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Something went wrong. Check console.');
    } finally {
      setIsLoading(false);
    }
  
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-headline-lg font-bold tracking-tight text-primary">
            Chapter Wise PYQ (Demo)
          </h1>
          <p className="flex items-center justify-center gap-1.5 text-muted-foreground text-body-lg">
            <span>Class 12 Physics</span>
            <span className="text-muted-foreground/40">•</span>
            <span>30 Questions</span>
            <span className="text-muted-foreground/40">•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> 40 mins
            </span>
          </p>
        </div>


        <div className="space-y-4">
          <div className="space-y-2 ">
            <label htmlFor="inputemail" className="text-label text-foreground">
              Enter your email
            </label>
            <Input 
              id="inputemail"
              type="text" 
              placeholder="student@example.com"
              value={inputemail}
              onChange={(e) => setInputEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              disabled={isLoading}
            />
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={handleStart}
            disabled={!inputemail.trim() || isLoading}
          >
            {isLoading ? 'Starting...' : 'Start Test'}
          </Button>
        </div>

      </div>
    </main>
  );
}
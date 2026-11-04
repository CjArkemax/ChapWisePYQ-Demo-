'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTestStore } from '@/store/useTestStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';

export default function WelcomePage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const setStoreEmail = useTestStore((state) => state.setEmail);
  const resetStore = useTestStore((state) => state.resetStore);

   async function handleStart() {
    if (!email.trim()) return;
    setIsLoading(true);

    try {
      // 1. Wipe any previous test state so we start fresh
      resetStore();

      // 2. Upsert user to Supabase
      const { error } = await supabase
        .from('pilot_users')
        .upsert({ email: email.trim() }, { onConflict: 'email' });

      if (error) throw error;

      // 3. Save email to Zustand & navigate
      setStoreEmail(email.trim());
      router.push('/test');
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
            Ray Optics — Chapter Test
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
            <label htmlFor="email" className="text-label text-foreground">
              Enter your email
            </label>
            <Input 
              id="email"
              type="text" 
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              disabled={isLoading}
            />
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={handleStart}
            disabled={!email.trim() || isLoading}
          >
            {isLoading ? 'Starting...' : 'Start Test'}
          </Button>
        </div>

      </div>
    </main>
  );
}
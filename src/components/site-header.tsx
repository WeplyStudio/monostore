
"use client";

import { ShoppingBag, Loader2 } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function SiteHeader() {
  const { setView, setIsCartOpen, totalItems } = useApp();
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'settings', 'shop');
  }, [db]);

  const { data: settings, loading } = useDoc<any>(settingsRef);

  const goHome = () => setView('home');

  const shopName = settings?.shopName || 'MonoStore';
  const firstLetter = shopName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={goHome}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold font-headline">
            {loading ? <Loader2 size={12} className="animate-spin" /> : firstLetter}
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block">
            {shopName.toLowerCase()}<span className="text-muted-foreground">.</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCartOpen(true)}
            variant="ghost"
            size="icon"
            className="relative rounded-xl"
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-accent rounded-full ring-2 ring-background flex items-center justify-center text-white text-[8px] font-bold">
              </span>
            )}
            <span className="sr-only">Open cart</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

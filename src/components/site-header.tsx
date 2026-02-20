
"use client";

import { useState, useEffect } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function SiteHeader() {
  const [mounted, setMounted] = useState(false);
  const { setView, setIsCartOpen, totalItems } = useApp();
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'settings', 'shop');
  }, [db]);

  const { data: settings, loading } = useDoc<any>(settingsRef);

  const goHome = () => setView('home');

  const shopName = settings?.shopName || 'MonoStore';

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={goHome}>
          {!mounted || loading ? (
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          ) : (
            <span className="font-bold text-xl tracking-tight">
              {shopName.toLowerCase()}<span className="text-primary">.</span>
            </span>
          )}
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

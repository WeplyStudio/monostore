
"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import HomeView from '@/components/views/home-view';
import CheckoutView from '@/components/views/checkout-view';
import SuccessView from '@/components/views/success-view';
import PaymentPendingView from '@/components/views/payment-pending-view';
import CartSheet from '@/components/cart-sheet';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { view, isInitialLoading } = useApp();
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'settings', 'shop');
  }, [db]);

  const { data: settings } = useDoc<any>(settingsRef);
  const shopName = settings?.shopName || 'MonoStore';

  if (isInitialLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center animate-fadeIn">
        <div className="flex flex-col items-center gap-6">
          <div className="font-headline font-bold text-4xl tracking-tighter animate-pulse">
            {shopName.toLowerCase()}<span className="text-primary">.</span>
          </div>
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin text-primary" size={20} />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Memuat Template</span>
          </div>
        </div>
        
        <div className="absolute bottom-12 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">
          {shopName} Digital Inc.
        </div>
      </div>
    );
  }

  return (
    <>
      {view === 'home' && <HomeView />}
      {view === 'checkout' && <CheckoutView />}
      {view === 'payment-pending' && <PaymentPendingView />}
      {view === 'success' && <SuccessView />}

      <CartSheet />
    </>
  );
}

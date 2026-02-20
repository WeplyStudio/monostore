"use client";

import React from 'react';
import { useApp } from '@/context/app-context';
import HomeView from '@/components/views/home-view';
import CheckoutView from '@/components/views/checkout-view';
import SuccessView from '@/components/views/success-view';
import PaymentPendingView from '@/components/views/payment-pending-view';
import CartSheet from '@/components/cart-sheet';

export default function Home() {
  const { view, isInitialLoading, loadingProgress } = useApp();

  if (isInitialLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center animate-fadeIn">
        <div className="flex flex-col items-center gap-4">
          {/* Progress Indicator */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-7xl md:text-8xl font-black text-primary font-headline tracking-tighter">
              {loadingProgress}%
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] ml-1">
              SINKRONISASI DATA
            </div>
          </div>
          
          {/* Subtle Progress Bar Background */}
          <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden mt-4">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
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

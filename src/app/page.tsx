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
        <div className="flex flex-col items-center gap-8">
          {/* Custom Loading SVG from Uiverse.io */}
          <div className="relative">
            <svg className="pl" viewBox="0 0 128 128" width="128px" height="128px" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="pl-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(193,90%,55%)"></stop>
                        <stop offset="100%" stopColor="hsl(223,90%,55%)"></stop>
                    </linearGradient>
                </defs>
                <circle className="pl__ring" r="56" cx="64" cy="64" fill="none" stroke="hsla(0,10%,10%,0.1)" strokeWidth="16" strokeLinecap="round"></circle>
                <path className="pl__worm" d="M92,15.492S78.194,4.967,66.743,16.887c-17.231,17.938-28.26,96.974-28.26,96.974L119.85,59.892l-99-31.588,57.528,89.832L97.8,19.349,13.636,88.51l89.012,16.015S81.908,38.332,66.1,22.337C50.114,6.156,36,15.492,36,15.492a56,56,0,1,0,56,0Z" fill="none" stroke="url(#pl-grad)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="44 1111" strokeDashoffset="10"></path>
            </svg>
          </div>
          
          {/* Percentage Indicator */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl font-black text-primary font-headline tracking-tighter">
              {loadingProgress}%
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
              SINKRONISASI DATA
            </div>
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

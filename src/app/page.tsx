"use client";

import { useApp } from '@/context/app-context';
import HomeView from '@/components/views/home-view';
import CheckoutView from '@/components/views/checkout-view';
import SuccessView from '@/components/views/success-view';
import CartSheet from '@/components/cart-sheet';

export default function Home() {
  const { view } = useApp();

  return (
    <>
      {view === 'home' && <HomeView />}
      {view === 'checkout' && <CheckoutView />}
      {view === 'success' && <SuccessView />}

      <CartSheet />
    </>
  );
}

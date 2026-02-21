
'use client';

import React from 'react';
import { useApp } from '@/context/app-context';
import CheckoutView from '@/components/views/checkout-view';
import LoadingScreen from '@/components/loading-screen';
import CartSheet from '@/components/cart-sheet';

export default function CheckoutPage() {
  const { isInitialLoading, loadingProgress } = useApp();

  if (isInitialLoading) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  return (
    <>
      <CheckoutView />
      <CartSheet />
    </>
  );
}

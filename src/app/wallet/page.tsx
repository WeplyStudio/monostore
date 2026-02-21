
'use client';

import React from 'react';
import { useApp } from '@/context/app-context';
import WalletView from '@/components/views/wallet-view';
import LoadingScreen from '@/components/loading-screen';
import CartSheet from '@/components/cart-sheet';

export default function WalletPage() {
  const { isInitialLoading, loadingProgress } = useApp();

  if (isInitialLoading) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  return (
    <>
      <WalletView />
      <CartSheet />
    </>
  );
}

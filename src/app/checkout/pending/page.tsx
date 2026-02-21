
'use client';

import React from 'react';
import { useApp } from '@/context/app-context';
import PaymentPendingView from '@/components/views/payment-pending-view';
import LoadingScreen from '@/components/loading-screen';

export default function PaymentPendingPage() {
  const { isInitialLoading, loadingProgress } = useApp();

  if (isInitialLoading) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  return <PaymentPendingView />;
}

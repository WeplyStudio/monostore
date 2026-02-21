
'use client';

import React from 'react';
import { useApp } from '@/context/app-context';
import SuccessView from '@/components/views/success-view';
import LoadingScreen from '@/components/loading-screen';

export default function SuccessPage() {
  const { isInitialLoading, loadingProgress } = useApp();

  if (isInitialLoading) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  return <SuccessView />;
}

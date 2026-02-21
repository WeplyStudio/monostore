
'use client';

import React from 'react';

interface LoadingScreenProps {
  progress: number;
}

export default function LoadingScreen({ progress }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center animate-fadeIn">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="text-7xl md:text-8xl font-black text-primary font-headline tracking-tighter">
            {progress}%
          </div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] ml-1">
            INITIALIZING ENGINE
          </div>
        </div>
        <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden mt-4">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

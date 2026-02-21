
"use client";

import { useState, useEffect } from 'react';
import { ShoppingBag, Loader2, Wallet } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SiteHeader() {
  const [mounted, setMounted] = useState(false);
  const { setIsCartOpen, totalItems, settings, isDataLoading, activePaymentKey } = useApp();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const shopName = settings?.shopName || 'MonoStore';

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          {!mounted || isDataLoading ? (
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          ) : (
            <span className="font-bold text-xl tracking-tight">
              {shopName.toLowerCase()}<span className="text-primary">.</span>
            </span>
          )}
        </Link>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push('/wallet')}
            variant="ghost"
            className="flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-slate-100 px-3 sm:px-4 h-10 border border-slate-100"
          >
            <Wallet size={20} className="text-primary" />
            <div className="text-left hidden sm:block">
              <div className="text-[8px] font-black text-slate-400 uppercase leading-none">Wallet</div>
              <div className="text-[11px] font-black text-primary leading-none mt-0.5">
                {activePaymentKey ? formatRupiah(activePaymentKey.balance).replace(",00", "") : "Buka Wallet"}
              </div>
            </div>
          </Button>

          <Button
            onClick={() => setIsCartOpen(true)}
            variant="ghost"
            size="icon"
            className="relative rounded-xl bg-slate-50"
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-accent rounded-full ring-2 ring-background"></span>
            )}
            <span className="sr-only">Open cart</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

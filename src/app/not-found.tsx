'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center py-20 bg-[#F8F9FA]">
      <div className="w-24 h-24 bg-white text-primary rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-slate-100">
        <Search size={40} strokeWidth={1.5} className="animate-pulse" />
      </div>
      
      <div className="space-y-3 mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight font-headline">404</h1>
        <h2 className="text-xl font-bold text-foreground">Halaman Tidak Ditemukan</h2>
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed text-sm md:text-base">
          Maaf, sepertinya halaman yang Anda cari tidak ada atau telah dipindahkan ke alamat lain.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center">
        <Button asChild className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">
          <Link href="/">
            <Home size={18} className="mr-2" />
            Kembali ke Beranda
          </Link>
        </Button>
        <Button variant="outline" asChild className="rounded-xl h-12 px-8 font-bold bg-white border-slate-200">
          <Link href="/">
            Cari Produk Lain
          </Link>
        </Button>
      </div>

      <div className="mt-12 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
        MonoStore Digital Inc.
      </div>
    </div>
  );
}

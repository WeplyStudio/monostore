"use client";

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Check, Download } from 'lucide-react';

export default function SuccessView() {
  const { setView, formData } = useApp();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-24 h-24 bg-primary text-primary-foreground rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/20 transform-gpu transition-transform hover:scale-105 hover:rotate-6">
        <Check size={48} strokeWidth={3} />
      </div>
      <h2 className="text-3xl font-bold mb-3 text-foreground">Yeay, Berhasil!</h2>
      <p className="text-muted-foreground mb-10 max-w-md leading-relaxed">
        Transaksi sukses. Kami telah mengirimkan link download dan invoice ke{' '}
        <span className="text-foreground font-bold underline decoration-wavy decoration-border">{formData.email}</span>.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => setView('home')} variant="secondary" className="rounded-xl">Kembali ke Beranda</Button>
        <Button onClick={() => alert("Download Started...")} className="rounded-xl shadow-lg shadow-primary/20">
            <Download size={18} /> Download Assets
        </Button>
      </div>
    </div>
  );
}

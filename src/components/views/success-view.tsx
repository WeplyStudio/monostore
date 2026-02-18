
"use client";

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Check, Download, ExternalLink } from 'lucide-react';

export default function SuccessView() {
  const { setView, formData, lastOrder } = useApp();

  const handleDownload = (url: string) => {
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      alert("Konten: " + url);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center py-20">
      <div className="w-24 h-24 bg-primary text-primary-foreground rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/20 animate-bounce">
        <Check size={48} strokeWidth={3} />
      </div>
      <h2 className="text-3xl font-bold mb-3 text-foreground">Yeay, Berhasil!</h2>
      <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
        Transaksi sukses. Kami telah mengirimkan invoice ke{' '}
        <span className="text-foreground font-bold underline decoration-wavy decoration-border">{formData.email}</span>.
      </p>

      {lastOrder && lastOrder.items && (
        <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-10 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 text-left">Aset Digital Anda</h3>
          <div className="space-y-3">
            {lastOrder.items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="text-left">
                  <div className="font-bold text-sm">{item.name}</div>
                  <div className="text-[10px] text-gray-400 font-medium">Siap diunduh</div>
                </div>
                {item.deliveryContent ? (
                  <Button size="sm" onClick={() => handleDownload(item.deliveryContent)} className="rounded-lg h-9 px-4">
                    <Download size={14} className="mr-2" />
                    Unduh
                  </Button>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">Menunggu Link</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => setView('home')} variant="secondary" className="rounded-xl px-8">Kembali ke Beranda</Button>
      </div>
    </div>
  );
}

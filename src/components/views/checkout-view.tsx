"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Lock } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import Image from 'next/image';
import { getPlaceholderImageDetails } from '@/lib/utils';

export default function CheckoutView() {
  const { setView, cart, cartTotal, totalItems, formData, handleInputChange, resetCart } = useApp();
  const [loading, setLoading] = useState(false);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name || !formData.cardNumber || !formData.exp || !formData.cvc) {
        alert("Please fill all required fields.");
        return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setView('success');
      resetCart();
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Button onClick={() => setView('home')} variant="ghost" className="mb-8 text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} className="mr-2"/> Kembali Belanja
      </Button>

      <Card className="p-2 md:p-4 rounded-3xl shadow-xl border-border/20">
        <CardHeader className="flex-row justify-between items-center mb-4 border-b pb-6">
          <CardTitle className="text-2xl">Checkout</CardTitle>
          <div className="text-right">
             <div className="text-xs text-muted-foreground uppercase">Total Bayar</div>
             <div className="text-xl font-bold text-foreground">{formatRupiah(cartTotal)}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-10">
            <form id="checkoutForm" onSubmit={handleCheckoutSubmit}>
              <div className="space-y-8">
                <div>
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Data Diri
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Email</label>
                      <Input name="email" type="email" placeholder="email@kamu.com" value={formData.email} onChange={handleInputChange} required className="h-12 rounded-xl bg-secondary/50"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Nama</label>
                      <Input name="name" placeholder="Nama Lengkap" value={formData.name} onChange={handleInputChange} required className="h-12 rounded-xl bg-secondary/50"/>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Pembayaran
                  </h3>
                  <div className="bg-secondary/50 p-4 rounded-xl border mb-4 flex gap-3 items-center">
                    <div className="p-2 bg-background rounded-full shadow-sm border"><Lock size={14} className="text-green-600"/></div>
                    <span className="text-xs text-muted-foreground font-medium">Pembayaran aman & terenkripsi.</span>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-xs font-medium text-muted-foreground">Nomor Kartu</label>
                       <Input name="cardNumber" placeholder="0000 0000 0000 0000" value={formData.cardNumber} onChange={handleInputChange} required className="h-12 rounded-xl bg-secondary/50"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Exp Date</label>
                        <Input name="exp" placeholder="MM/YY" value={formData.exp} onChange={handleInputChange} required className="h-12 rounded-xl bg-secondary/50"/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">CVC</label>
                        <Input name="cvc" placeholder="123" value={formData.cvc} onChange={handleInputChange} required className="h-12 rounded-xl bg-secondary/50"/>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <div className="bg-secondary/50 rounded-2xl p-6 h-fit">
               <h3 className="font-bold text-foreground mb-4">Ringkasan ({totalItems} items)</h3>
               <div className="space-y-4 mb-6">
                 {cart.map((item) => {
                   const imageDetails = getPlaceholderImageDetails(item.image);
                   return (
                     <div key={item.id} className="flex gap-3 text-sm items-center">
                        <div className="w-12 h-12 bg-background rounded-lg border shrink-0 relative overflow-hidden">
                           <Image src={imageDetails.src} alt={item.name} data-ai-hint={imageDetails.hint} fill className="object-cover" />
                           {item.quantity > 1 && (
                             <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow">
                               {item.quantity}
                             </span>
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="font-medium truncate">{item.name}</div>
                           <div className="text-muted-foreground text-xs">{item.category} • {item.quantity}x</div>
                        </div>
                        <div className="font-bold whitespace-nowrap">{formatRupiah(item.price * item.quantity).replace(",00", "")}</div>
                     </div>
                   );
                 })}
               </div>
               <Button 
                  type="submit"
                  form="checkoutForm"
                  className="w-full rounded-xl shadow-lg shadow-primary/20" 
                  disabled={loading}
               >
                  {loading ? 'Processing...' : `Bayar ${formatRupiah(cartTotal)}`}
               </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

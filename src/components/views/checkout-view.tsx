"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Lock, ShieldCheck, Loader2, QrCode } from 'lucide-react';
import { formatRupiah, getPlaceholderImageDetails } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { createPakasirTransaction } from '@/lib/pakasir-actions';

export default function CheckoutView() {
  const { setView, cart, cartTotal, totalItems, formData, handleInputChange, setPaymentData } = useApp();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name || !formData.whatsapp) {
        toast({
          variant: "destructive",
          title: "Data tidak lengkap",
          description: "Harap isi Nama, Email, dan WhatsApp Anda."
        });
        return;
    }
    
    setLoading(true);
    
    // Gunakan format Order ID yang lebih bersih (hanya angka) untuk menghindari error 400 di beberapa API
    const orderId = "INV" + Date.now().toString().slice(-10);

    try {
      const result = await createPakasirTransaction(orderId, cartTotal);

      if (result && result.payment) {
        setPaymentData({
          ...result.payment,
          order_id: orderId,
          amount: cartTotal,
          customerName: formData.name,
          customerEmail: formData.email,
          whatsapp: formData.whatsapp,
          items: cart
        });
        setView('payment-pending');
      } else {
        // Tampilkan pesan error spesifik dari API jika ada
        const errorMsg = result?.message || "Gagal membuat transaksi. Silakan coba lagi.";
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("Pakasir Integration Error:", error);
      toast({
        variant: "destructive",
        title: "Gagal memproses pembayaran",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <Button 
          onClick={() => setView('home')} 
          variant="ghost" 
          className="mb-6 text-sm font-bold text-gray-500 hover:bg-transparent px-0"
        >
          <ArrowLeft size={18} className="mr-2"/> Kembali Belanja
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-6 md:p-8 pb-0">
                <CardTitle className="text-xl font-bold text-[#212529]">Detail Checkout</CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <form id="checkoutForm" onSubmit={handleCheckoutSubmit} className="space-y-8">
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#212529]">Data Diri</h3>
                    </div>
                    
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest ml-1">Email</label>
                          <Input 
                            name="email" 
                            type="email" 
                            placeholder="email@kamu.com" 
                            value={formData.email} 
                            onChange={handleInputChange} 
                            required 
                            className="h-12 rounded-xl bg-[#F8F9FA] border-none focus-visible:ring-primary/20 transition-all text-sm px-4"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest ml-1">WhatsApp</label>
                          <Input 
                            name="whatsapp" 
                            placeholder="0812..." 
                            value={formData.whatsapp} 
                            onChange={handleInputChange} 
                            required
                            className="h-12 rounded-xl bg-[#F8F9FA] border-none focus-visible:ring-primary/20 transition-all text-sm px-4"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest ml-1">Nama Lengkap</label>
                        <Input 
                          name="name" 
                          placeholder="Masukkan Nama Lengkap" 
                          value={formData.name} 
                          onChange={handleInputChange} 
                          required 
                          className="h-12 rounded-xl bg-[#F8F9FA] border-none focus-visible:ring-primary/20 transition-all text-sm px-4"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#212529]">Metode Pembayaran</h3>
                    </div>

                    <div className="p-4 rounded-2xl border-2 border-primary bg-primary/5 flex items-center justify-between group cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                                <QrCode size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-sm">QRIS (Otomatis)</div>
                                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Dana, OVO, ShopeePay, m-Banking</div>
                            </div>
                        </div>
                        <div className="w-5 h-5 rounded-full border-4 border-primary bg-white" />
                    </div>

                    <div className="bg-green-50/50 border border-green-100 p-4 rounded-xl flex gap-3 items-center mb-6">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Lock size={16} className="text-green-600"/>
                      </div>
                      <span className="text-[11px] text-green-700 font-bold uppercase tracking-wide">Transaksi aman via Pakasir</span>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 space-y-4">
              <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="p-6 md:p-8">
                  <CardTitle className="text-lg font-bold text-[#212529]">Ringkasan Pesanan</CardTitle>
                  <div className="text-xs text-gray-400 font-medium">{totalItems} Produk dipilih</div>
                </CardHeader>
                <CardContent className="px-6 md:px-8 pb-6 md:pb-8 space-y-6">
                  <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                    {cart.map((item) => {
                      const imageDetails = getPlaceholderImageDetails(item.image);
                      return (
                        <div key={item.id} className="flex gap-4 items-center">
                          <div className="w-14 h-14 bg-[#F8F9FA] rounded-xl shrink-0 relative overflow-hidden border border-gray-50">
                            <Image src={imageDetails.src} alt={item.name} data-ai-hint={imageDetails.hint} fill className="object-cover" />
                            {item.quantity > 1 && (
                              <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm ring-2 ring-white">
                                {item.quantity}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-[#212529] truncate">{item.name}</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.category}</div>
                          </div>
                          <div className="font-bold text-sm text-[#212529] whitespace-nowrap">
                            {formatRupiah(item.price * item.quantity).replace(",00", "")}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-50">
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span>{formatRupiah(cartTotal).replace(",00", "")}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-bold text-[#212529]">Total Bayar</span>
                      <span className="text-xl font-bold text-primary">{formatRupiah(cartTotal)}</span>
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    form="checkoutForm"
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-xl shadow-primary/20 transition-all" 
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : `Bayar Sekarang`}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    <ShieldCheck size={14} className="text-green-500" />
                    Garansi Keamanan 100%
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

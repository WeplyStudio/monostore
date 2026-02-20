"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Lock, ShieldCheck, Loader2, QrCode, Ticket, Tag, X } from 'lucide-react';
import { formatRupiah, getPlaceholderImageDetails } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { createPakasirTransaction } from '@/lib/pakasir-actions';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { sendOrderConfirmationEmail } from '@/lib/email-actions';

export default function CheckoutView() {
  const { setView, cart, cartTotal, cartSubtotal, discountTotal, totalItems, formData, handleInputChange, setPaymentData, activeVoucher, applyVoucher, removeVoucher, resetCart, setLastOrder } = useApp();
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim() || !db) return;
    setCheckingVoucher(true);
    try {
      const q = query(collection(db, 'vouchers'), where('code', '==', voucherCode.toUpperCase()), where('isActive', '==', true));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ variant: "destructive", title: "Voucher Tidak Ditemukan", description: "Kode voucher tidak valid atau sudah kedaluwarsa." });
      } else {
        const voucher = { ...snap.docs[0].data(), id: snap.docs[0].id } as any;
        if (cartSubtotal < voucher.minPurchase) {
          toast({ variant: "destructive", title: "Minimal Belanja Kurang", description: `Voucher ini hanya berlaku untuk minimal belanja ${formatRupiah(voucher.minPurchase)}` });
        } else {
          applyVoucher(voucher);
          setVoucherCode('');
        }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat mengecek voucher." });
    } finally {
      setCheckingVoucher(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name || !formData.whatsapp) {
        toast({ variant: "destructive", title: "Data tidak lengkap", description: "Harap isi Nama, Email, dan WhatsApp Anda." });
        return;
    }
    
    if (!db) return;
    setLoading(true);
    const orderId = "INV" + Date.now().toString().slice(-10);

    // Kasus 1: Transaksi Gratis (Total Rp 0)
    if (cartTotal === 0) {
      try {
        const orderRecord = {
          customerName: formData.name,
          customerEmail: formData.email,
          whatsapp: formData.whatsapp,
          items: cart.map((item: any) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            deliveryContent: item.deliveryContent || ''
          })),
          totalAmount: 0,
          discountAmount: discountTotal,
          voucherCode: activeVoucher?.code || null,
          status: 'completed',
          order_id: orderId,
          createdAt: serverTimestamp()
        };

        const ordersRef = collection(db, 'orders');
        const docRef = await addDoc(ordersRef, orderRecord);
        
        // Update Stok dan Sold
        for (const item of cart) {
          const productRef = doc(db, 'products', item.id);
          const productSnap = await getDoc(productRef);
          
          if (productSnap.exists()) {
            const productData = productSnap.data();
            const qty = item.quantity || 1;
            
            let updateData: any = {
              sold: increment(qty),
              stock: increment(-qty)
            };

            if (productData.flashSaleEnd && productData.flashSaleStock !== undefined) {
              const currentFSStock = productData.flashSaleStock || 0;
              const newFSStock = currentFSStock - qty;
              
              if (newFSStock <= 0) {
                updateData.price = productData.originalPrice || productData.price;
                updateData.originalPrice = null;
                updateData.flashSaleEnd = null;
                updateData.flashSaleStock = null;
              } else {
                updateData.flashSaleStock = newFSStock;
              }
            }

            updateDoc(productRef, updateData).catch(err => console.error(err));
          }
        }

        // Kirim Email
        await sendOrderConfirmationEmail({
          customerName: orderRecord.customerName,
          customerEmail: orderRecord.customerEmail,
          orderId: orderRecord.order_id,
          totalAmount: 0,
          items: orderRecord.items.map(i => ({ name: i.name, deliveryContent: i.deliveryContent }))
        });

        setLastOrder({ ...orderRecord, id: docRef.id });
        resetCart();
        toast({ title: "Pesanan Berhasil!", description: "Voucher 100% digunakan. Template Anda siap diunduh." });
        setView('success');
      } catch (error: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'orders',
          operation: 'create',
          requestResourceData: { orderId }
        }));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Kasus 2: Transaksi Berbayar (Via Pakasir)
    try {
      const result = await createPakasirTransaction(orderId, cartTotal);
      if (result && result.payment) {
        setPaymentData({
          ...result.payment,
          order_id: orderId,
          amount: cartTotal,
          discountAmount: discountTotal,
          voucherCode: activeVoucher?.code || null,
          customerName: formData.name,
          customerEmail: formData.email,
          whatsapp: formData.whatsapp,
          items: cart
        });
        setView('payment-pending');
      } else {
        throw new Error(result?.message || "Gagal membuat transaksi.");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal memproses pembayaran", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <Button onClick={() => setView('home')} variant="ghost" className="mb-6 text-sm font-bold text-gray-500 hover:bg-transparent px-0">
          <ArrowLeft size={18} className="mr-2"/> Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-bold">Data Pemesan</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form id="checkoutForm" onSubmit={handleCheckoutSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Email</label>
                      <Input name="email" type="email" placeholder="email@kamu.com" value={formData.email} onChange={handleInputChange} required className="h-12 rounded-xl bg-slate-50 border-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">WhatsApp</label>
                      <Input name="whatsapp" placeholder="0812..." value={formData.whatsapp} onChange={handleInputChange} required className="h-12 rounded-xl bg-slate-50 border-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Nama Lengkap</label>
                    <Input name="name" placeholder="Masukkan Nama Lengkap" value={formData.name} onChange={handleInputChange} required className="h-12 rounded-xl bg-slate-50 border-none" />
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-bold flex items-center gap-2"><Ticket size={20} className="text-primary" /> Gunakan Voucher</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {activeVoucher ? (
                  <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white"><Tag size={20} /></div>
                      <div>
                        <div className="font-bold text-sm text-green-700">Voucher Diterapkan: {activeVoucher.code}</div>
                        <div className="text-[10px] text-green-600 font-bold uppercase">Diskon: {activeVoucher.type === 'percentage' ? `${activeVoucher.value}%` : formatRupiah(activeVoucher.value)}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={removeVoucher} className="text-green-700 hover:bg-green-100 rounded-full"><X size={18} /></Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input placeholder="KODE VOUCHER" value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())} className="h-12 rounded-xl bg-slate-50 border-none font-bold tracking-widest" />
                    <Button onClick={handleApplyVoucher} disabled={checkingVoucher || !voucherCode} className="h-12 px-6 rounded-xl font-bold">
                      {checkingVoucher ? <Loader2 className="animate-spin" /> : 'Gunakan'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white sticky top-24">
              <CardHeader className="p-8">
                <CardTitle className="text-lg font-bold">Ringkasan Belanja</CardTitle>
                <div className="text-xs text-gray-400">{totalItems} Item</div>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-6">
                <div className="space-y-4 max-h-[250px] overflow-y-auto no-scrollbar pr-2">
                  {cart.map((item) => {
                    const isUrl = typeof item.image === 'string' && item.image.startsWith('http');
                    const imageSrc = isUrl ? item.image : getPlaceholderImageDetails(item.image).src;
                    return (
                      <div key={item.id} className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl shrink-0 relative overflow-hidden border border-slate-100">
                          <Image src={imageSrc} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs truncate">{item.name}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase">{formatRupiah(item.price)}</div>
                        </div>
                        <div className="font-bold text-xs">x{item.quantity}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>{formatRupiah(cartSubtotal)}</span>
                  </div>
                  {discountTotal > 0 && (
                    <div className="flex justify-between text-xs font-bold text-green-600 uppercase tracking-widest animate-fadeIn">
                      <span>Potongan Voucher</span>
                      <span>-{formatRupiah(discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold">Total Bayar</span>
                    <span className="text-xl font-bold text-primary">{formatRupiah(cartTotal)}</span>
                  </div>
                </div>

                <Button type="submit" form="checkoutForm" className="w-full h-14 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 transition-all" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin mr-2" /> : cartTotal === 0 ? 'Dapatkan Gratis' : `Bayar ${formatRupiah(cartTotal)}`}
                </Button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-green-500" /> Pembayaran Aman & Terverifikasi
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
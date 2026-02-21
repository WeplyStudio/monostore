
"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Lock, ShieldCheck, Loader2, QrCode, Ticket, Tag, X, Layers, Wallet, Zap } from 'lucide-react';
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
  const { 
    setView, cart, cartTotal, cartSubtotal, discountTotal, bundleDiscountTotal, 
    totalItems, formData, handleInputChange, setPaymentData, activeVoucher, 
    applyVoucher, removeVoucher, resetCart, setLastOrder, activePaymentKey, fetchPaymentKey, setActivePaymentKey
  } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'wallet'>('qris');
  const [walletKeyInput, setWalletKeyInput] = useState(activePaymentKey?.key || '');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  
  const { toast } = useToast();
  const db = useFirestore();

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim() || !db) return;
    setCheckingVoucher(true);
    try {
      const q = query(collection(db, 'vouchers'), where('code', '==', voucherCode.toUpperCase()), where('isActive', '==', true));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ variant: "destructive", title: "Voucher Tidak Ditemukan", description: "Kode voucher tidak valid." });
      } else {
        const voucher = { ...snap.docs[0].data(), id: snap.docs[0].id } as any;
        if (cartSubtotal < voucher.minPurchase) {
          toast({ variant: "destructive", title: "Minimal Belanja Kurang", description: `Butuh min. ${formatRupiah(voucher.minPurchase)}` });
        } else {
          applyVoucher(voucher);
          setVoucherCode('');
        }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan." });
    } finally {
      setCheckingVoucher(false);
    }
  };

  const handleVerifyWallet = async () => {
    if (!walletKeyInput.trim()) return;
    setIsVerifyingKey(true);
    try {
      const keyData = await fetchPaymentKey(walletKeyInput.trim());
      if (keyData) {
        setActivePaymentKey(keyData);
        toast({ title: "Wallet Terdeteksi", description: `Saldo: ${formatRupiah(keyData.balance)}` });
      } else {
        toast({ variant: "destructive", title: "Key Tidak Valid", description: "Cek kembali Payment Key Anda." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Verifikasi", description: "Error database." });
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name || !formData.whatsapp) {
        toast({ variant: "destructive", title: "Data tidak lengkap", description: "Harap isi Nama, Email, dan WhatsApp." });
        return;
    }
    
    if (!db) return;
    setLoading(true);
    const orderId = "INV" + Date.now().toString().slice(-10);

    // PAY VIA WALLET
    if (paymentMethod === 'wallet') {
      if (!activePaymentKey) {
        toast({ variant: "destructive", title: "Wallet Belum Dimasukkan", description: "Gunakan Payment Key Anda untuk membayar." });
        setLoading(false);
        return;
      }

      if (activePaymentKey.balance < cartTotal) {
        toast({ variant: "destructive", title: "Saldo Kurang", description: "Top up saldo Anda di menu Wallet." });
        setLoading(false);
        return;
      }

      try {
        // 1. Potong Saldo
        const keyRef = doc(db, 'payment_keys', activePaymentKey.id);
        await updateDoc(keyRef, { balance: increment(-cartTotal) });

        // 2. Buat Transaksi Wallet
        await addDoc(collection(db, 'wallet_transactions'), {
          paymentKeyId: activePaymentKey.id,
          amount: cartTotal,
          type: 'purchase',
          description: `Beli Template: ${cart.map(i => i.name).join(', ')}`,
          createdAt: serverTimestamp()
        });

        // 3. Buat Order
        const orderRecord = {
          customerName: formData.name,
          customerEmail: formData.email,
          whatsapp: formData.whatsapp,
          paymentKey: activePaymentKey.key,
          items: cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            deliveryContent: item.deliveryContent || '',
            quantity: item.quantity
          })),
          totalAmount: cartTotal,
          discountAmount: discountTotal + bundleDiscountTotal,
          voucherCode: activeVoucher?.code || null,
          status: 'completed',
          order_id: orderId,
          createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'orders'), orderRecord);
        
        // 4. Update Stok & Sold
        for (const item of cart) {
          const productRef = doc(db, 'products', item.id);
          const snap = await getDoc(productRef);
          if (snap.exists()) {
            await updateDoc(productRef, { sold: increment(item.quantity), stock: increment(-item.quantity) });
          }
        }

        // 5. Kirim Email
        await sendOrderConfirmationEmail({
          customerName: orderRecord.customerName,
          customerEmail: orderRecord.customerEmail,
          orderId: orderRecord.order_id,
          totalAmount: cartTotal,
          items: orderRecord.items.map(i => ({ name: i.name, deliveryContent: i.deliveryContent }))
        });

        setLastOrder({ ...orderRecord, id: docRef.id });
        resetCart();
        toast({ title: "Pembayaran Berhasil!", description: "Saldo Wallet telah digunakan." });
        setView('success');
      } catch (err) {
        toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan sistem." });
      } finally {
        setLoading(false);
      }
      return;
    }

    // PAY VIA QRIS (PAKASIR)
    try {
      const orderRecord = {
        customerName: formData.name,
        customerEmail: formData.email,
        whatsapp: formData.whatsapp,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          deliveryContent: item.deliveryContent || '',
          quantity: item.quantity
        })),
        totalAmount: cartTotal,
        discountAmount: discountTotal + bundleDiscountTotal,
        voucherCode: activeVoucher?.code || null,
        status: 'pending',
        order_id: orderId,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderRecord);
      const result = await createPakasirTransaction(orderId, cartTotal);
      
      if (result && result.payment) {
        setPaymentData({
          ...result.payment,
          firestoreId: docRef.id,
          order_id: orderId,
          amount: cartTotal,
          customerName: formData.name,
          customerEmail: formData.email,
          whatsapp: formData.whatsapp,
          items: cart
        });
        setView('payment-pending');
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal membuat QRIS." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Button onClick={() => setView('home')} variant="ghost" className="mb-6 text-sm font-bold text-gray-400 p-0">
          <ArrowLeft size={18} className="mr-2"/> Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <Card className="rounded-[2rem] border-none shadow-sm bg-white p-8">
              <h3 className="text-xl font-black mb-6">Metode Pembayaran</h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'qris' ? 'border-primary bg-primary/5' : 'border-slate-50 hover:bg-slate-50'}`}
                >
                  <QrCode size={32} className={paymentMethod === 'qris' ? 'text-primary' : 'text-slate-300'} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'qris' ? 'text-primary' : 'text-slate-400'}`}>Scan QRIS</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'wallet' ? 'border-primary bg-primary/5' : 'border-slate-50 hover:bg-slate-50'}`}
                >
                  <Wallet size={32} className={paymentMethod === 'wallet' ? 'text-primary' : 'text-slate-300'} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'wallet' ? 'text-primary' : 'text-slate-400'}`}>Mono Wallet</span>
                </button>
              </div>

              {paymentMethod === 'wallet' && (
                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-fadeIn">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Masukkan Payment Key</label>
                    {activePaymentKey && <span className="text-[10px] font-black text-green-600 uppercase">Saldo: {formatRupiah(activePaymentKey.balance)}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="MONO-XXXX-XXXX" 
                      value={walletKeyInput} 
                      onChange={e => setWalletKeyInput(e.target.value.toUpperCase())}
                      className="h-12 rounded-xl bg-white border-none font-black tracking-widest text-center"
                    />
                    <Button onClick={handleVerifyWallet} disabled={isVerifyingKey} className="h-12 rounded-xl font-bold">
                      {isVerifyingKey ? <Loader2 className="animate-spin" /> : 'Verifikasi'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            <Card className="rounded-[2rem] border-none shadow-sm bg-white p-8 space-y-6">
              <h3 className="text-xl font-black">Informasi Pengiriman</h3>
              <form id="checkoutForm" onSubmit={handleCheckoutSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">WhatsApp</label>
                    <Input name="whatsapp" placeholder="08..." value={formData.whatsapp} onChange={handleInputChange} required className="h-12 rounded-xl bg-slate-50 border-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Email</label>
                    <Input name="email" type="email" placeholder="email@anda.com" value={formData.email} onChange={handleInputChange} required className="h-12 rounded-xl bg-slate-50 border-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nama Lengkap</label>
                  <Input name="name" placeholder="Nama Anda" value={formData.name} onChange={handleInputChange} required className="h-12 rounded-xl bg-slate-50 border-none" />
                </div>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 sticky top-24 space-y-6">
              <h3 className="text-lg font-black">Ringkasan Pesanan</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden relative">
                      <Image src={item.image.startsWith('http') ? item.image : getPlaceholderImageDetails(item.image).src} alt="" fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs truncate">{item.name}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">{formatRupiah(item.price)}</div>
                    </div>
                    <div className="font-black text-xs">x{item.quantity}</div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-50 space-y-3">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>{formatRupiah(cartSubtotal)}</span>
                </div>
                {bundleDiscountTotal > 0 && <div className="flex justify-between text-xs font-black text-primary uppercase"><span>Bundle Hemat</span><span>-{formatRupiah(bundleDiscountTotal)}</span></div>}
                {discountTotal > 0 && <div className="flex justify-between text-xs font-black text-green-600 uppercase"><span>Voucher</span><span>-{formatRupiah(discountTotal)}</span></div>}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-black">Total Akhir</span>
                  <span className="text-2xl font-black text-primary">{formatRupiah(cartTotal)}</span>
                </div>
              </div>

              <Button type="submit" form="checkoutForm" className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : paymentMethod === 'wallet' ? 'Bayar via Wallet' : `Bayar ${formatRupiah(cartTotal)}`}
              </Button>
              <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <ShieldCheck size={14} className="text-green-500" /> Transaksi Aman & Terenkripsi
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

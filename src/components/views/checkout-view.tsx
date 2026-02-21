
"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Lock, ShieldCheck, Loader2, QrCode, Wallet, Mail, CheckCircle2, Star, Info } from 'lucide-react';
import { formatRupiah, getPlaceholderImageDetails } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { createPakasirTransaction } from '@/lib/pakasir-actions';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { sendOrderConfirmationEmail } from '@/lib/email-actions';
import { useRouter } from 'next/navigation';
import { Slider } from '@/components/ui/slider';

export default function CheckoutView() {
  const { 
    cart, cartTotal, cartSubtotal, discountTotal, bundleDiscountTotal, 
    formData, handleInputChange, setPaymentData, activeVoucher, 
    resetCart, setLastOrder, activePaymentKey, fetchPaymentKey, setActivePaymentKey, sendVerificationCode,
    pointsToRedeem, setPointsToRedeem, pointsEarned
  } = useApp();
  
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'wallet'>('qris');
  const [walletKeyInput, setWalletKeyInput] = useState(activePaymentKey?.key || '');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  
  // 2SV States
  const [requires2SV, setRequires2SV] = useState(false);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [serverCode, setServerCode] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const { toast } = useToast();
  const db = useFirestore();

  useEffect(() => {
    if (activePaymentKey) {
      setWalletKeyInput(activePaymentKey.key);
    }
  }, [activePaymentKey]);

  const handleVerifyWallet = async () => {
    if (!walletKeyInput.trim()) return;
    setIsVerifyingKey(true);
    try {
      const keyData = await fetchPaymentKey(walletKeyInput.trim());
      if (keyData) {
        setActivePaymentKey(keyData);
        if (keyData.is2SVEnabled) {
          setRequires2SV(true);
          toast({ title: "2-Step Verification Aktif", description: "Klik tombol 'Kirim Kode' untuk melanjutkan." });
        } else {
          setRequires2SV(false);
          toast({ title: "Wallet Terhubung", description: `Saldo: ${formatRupiah(keyData.balance)}` });
        }
      } else {
        toast({ variant: "destructive", title: "Key Tidak Valid", description: "Periksa kembali Payment Key Anda." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Verifikasi", description: "Terjadi kesalahan." });
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handleSendCode = async () => {
    if (!activePaymentKey) return;
    setIsSendingCode(true);
    try {
      const res = await sendVerificationCode(activePaymentKey);
      if (res) {
        setServerCode(res.code);
        toast({ title: "Kode Terkirim", description: `Cek email ${activePaymentKey.email}` });
      } else {
        toast({ variant: "destructive", title: "Gagal", description: "Gagal mengirim email verifikasi." });
      }
    } finally {
      setIsSendingCode(false);
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
        toast({ variant: "destructive", title: "Wallet Belum Terhubung", description: "Gunakan Payment Key Anda." });
        setLoading(false);
        return;
      }

      if (requires2SV && verificationCodeInput !== serverCode) {
        toast({ variant: "destructive", title: "Kode Salah", description: "Kode verifikasi 2SV tidak cocok." });
        setLoading(false);
        return;
      }

      if (activePaymentKey.balance < cartTotal) {
        toast({ variant: "destructive", title: "Saldo Kurang", description: "Silakan top up di menu Wallet." });
        setLoading(false);
        return;
      }

      try {
        // 1. Update Balance & Create Order
        const keyRef = doc(db, 'payment_keys', activePaymentKey.id);
        
        // Final points update: deduct redeemed, add earned
        const pointsUpdate = pointsToRedeem > 0 ? -pointsToRedeem : pointsEarned;
        
        await updateDoc(keyRef, { 
          balance: increment(-cartTotal),
          points: increment(pointsUpdate)
        });

        await addDoc(collection(db, 'wallet_transactions'), {
          paymentKeyId: activePaymentKey.id,
          amount: cartTotal,
          type: 'purchase',
          description: `Beli Template: ${cart.map(i => i.name).join(', ')}`,
          createdAt: serverTimestamp()
        });

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
          discountAmount: discountTotal + bundleDiscountTotal + pointsToRedeem,
          pointsEarned: pointsEarned,
          pointsRedeemed: pointsToRedeem,
          voucherCode: activeVoucher?.code || null,
          status: 'completed',
          order_id: orderId,
          createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'orders'), orderRecord);
        
        for (const item of cart) {
          const productRef = doc(db, 'products', item.id);
          await updateDoc(productRef, { sold: increment(item.quantity), stock: increment(-item.quantity) });
        }

        await sendOrderConfirmationEmail({
          customerName: orderRecord.customerName,
          customerEmail: orderRecord.customerEmail,
          orderId: orderId,
          totalAmount: cartTotal,
          items: orderRecord.items.map(i => ({ name: i.name, deliveryContent: i.deliveryContent }))
        });

        // Update local active key state
        setActivePaymentKey({
          ...activePaymentKey,
          balance: activePaymentKey.balance - cartTotal,
          points: (activePaymentKey.points || 0) + pointsUpdate
        });

        setLastOrder({ ...orderRecord, id: docRef.id });
        resetCart();
        toast({ title: "Pembayaran Berhasil!", description: "Template Anda sedang disiapkan." });
        router.push('/checkout/success');
      } catch (err) {
        toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan sistem." });
      } finally {
        setLoading(false);
      }
      return;
    }

    // PAY VIA QRIS
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
        discountAmount: discountTotal + bundleDiscountTotal + pointsToRedeem,
        pointsEarned: pointsEarned,
        pointsRedeemed: pointsToRedeem,
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
          items: cart,
          pointsEarned,
          pointsRedeemed: pointsToRedeem,
          paymentKeyId: activePaymentKey?.id || null
        });
        router.push('/checkout/pending');
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
        <Button onClick={() => router.push('/')} variant="ghost" className="mb-6 text-sm font-bold text-gray-400 p-0">
          <ArrowLeft size={18} className="mr-2"/> Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <Card className="rounded-[2rem] border-none shadow-sm bg-white p-8">
              <h3 className="text-xl font-black mb-6">Metode Pembayaran</h3>
              <div className="grid grid-cols-2 gap-4 mb-8">
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

              <div className="space-y-6">
                <div className={paymentMethod === 'wallet' ? 'animate-fadeIn' : 'hidden md:block opacity-50'}>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-3">Akses Payment Key (Wajib untuk Poin)</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="MONO-XXXX-XXXX" 
                        value={walletKeyInput} 
                        onChange={e => setWalletKeyInput(e.target.value.toUpperCase())}
                        className="h-12 rounded-xl bg-white border-none font-black tracking-widest text-center"
                      />
                      <Button onClick={handleVerifyWallet} disabled={isVerifyingKey} className="h-12 rounded-xl font-bold">
                        {isVerifyingKey ? <Loader2 className="animate-spin" /> : 'Hubungkan'}
                      </Button>
                    </div>
                  </div>

                  {requires2SV && activePaymentKey && paymentMethod === 'wallet' && (
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Lock size={16} className="text-blue-600" />
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">2-Step Verification</span>
                      </div>
                      <p className="text-[10px] text-blue-500 font-medium">Masukkan kode verifikasi yang dikirim ke <strong>{activePaymentKey.email}</strong></p>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Kode 6-Digit" 
                          value={verificationCodeInput} 
                          onChange={e => setVerificationCodeInput(e.target.value)}
                          className="h-12 rounded-xl bg-white border-none text-center font-black tracking-[10px]"
                          maxLength={6}
                        />
                        <Button 
                          onClick={handleSendCode} 
                          disabled={isSendingCode} 
                          variant="secondary"
                          className="h-12 rounded-xl font-bold"
                        >
                          {isSendingCode ? <Loader2 className="animate-spin" /> : 'Kirim Kode'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {activePaymentKey && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-400 text-white rounded-full flex items-center justify-center shadow-sm">
                            <Star size={20} className="fill-white" />
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">MonoPoints</div>
                            <div className="text-lg font-black text-yellow-700">{activePaymentKey.points || 0} Poin</div>
                          </div>
                        </div>
                        {activePaymentKey.points && activePaymentKey.points > 0 ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] font-bold text-yellow-600 uppercase">Tukarkan Poin</span>
                            <Slider 
                              className="w-32" 
                              max={Math.min(activePaymentKey.points, cartSubtotal)} 
                              step={1} 
                              value={[pointsToRedeem]} 
                              onValueChange={(val) => setPointsToRedeem(val[0])} 
                            />
                            <div className="text-[10px] font-black text-yellow-700">-{formatRupiah(pointsToRedeem)}</div>
                          </div>
                        ) : (
                          <div className="text-[9px] font-bold text-yellow-600 uppercase italic">Kumpulkan poin tiap belanja</div>
                        )}
                      </div>
                      
                      {pointsToRedeem > 0 ? (
                        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-[9px] font-bold uppercase tracking-widest">
                          <Info size={14} /> Poin digunakan: Kamu tidak akan mendapatkan poin baru untuk transaksi ini.
                        </div>
                      ) : pointsEarned > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 rounded-xl text-[9px] font-bold uppercase tracking-widest">
                          <CheckCircle2 size={14} /> Kamu akan mendapatkan +{pointsEarned} MonoPoints!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
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
                {pointsToRedeem > 0 && <div className="flex justify-between text-xs font-black text-yellow-600 uppercase"><span>Tukar Poin</span><span>-{formatRupiah(pointsToRedeem)}</span></div>}
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

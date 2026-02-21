
"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, increment, getDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Smartphone, CheckCircle2, AlertTriangle, ArrowLeft, Lock } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { checkPakasirStatus } from '@/lib/pakasir-actions';
import { sendOrderConfirmationEmail } from '@/lib/email-actions';
import { useRouter } from 'next/navigation';

export default function PaymentPendingView() {
  const { paymentData, resetCart, setLastOrder } = useApp();
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [isChecking, setIsChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const db = useFirestore();
  const { toast } = useToast();

  const orderId = paymentData?.order_id;
  const amount = paymentData?.amount;
  const qrData = paymentData?.payment_number;
  const firestoreId = paymentData?.firestoreId;

  useEffect(() => {
    if (timeLeft <= 0 || status === 'success') return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCheckStatus = async (auto = false) => {
    if (!orderId || !db || !amount || !firestoreId) return;
    if (!auto) setIsChecking(true);
    
    try {
      const result = await checkPakasirStatus(orderId, amount);
      if (result.transaction && (result.transaction.status === 'success' || result.transaction.status === 'completed')) {
        await handlePaymentSuccess();
      } else if (!auto && (!result.transaction || result.transaction.status !== 'success')) {
         toast({ title: "Belum terbayar", description: "Silakan selesaikan pembayaran QRIS Anda." });
      }
    } catch (error) {
      console.error("Polling Error:", error);
    } finally {
      if (!auto) setIsChecking(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (status === 'success' || !firestoreId || !db) return;
    setStatus('success');
    
    try {
      const orderRef = doc(db, 'orders', firestoreId);
      await updateDoc(orderRef, { status: 'completed', paidAt: serverTimestamp() });
      
      for (const item of paymentData.items) {
        const productRef = doc(db, 'products', item.id);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = productSnap.data();
          const qty = item.quantity || 1;
          let updateData: any = { sold: increment(qty), stock: increment(-qty) };
          if (productData.flashSaleEnd && productData.flashSaleStock !== undefined) {
            const currentFSStock = productData.flashSaleStock || 0;
            const newFSStock = currentFSStock - qty;
            if (newFSStock <= 0) {
              updateData.price = productData.originalPrice || productData.price;
              updateData.originalPrice = null;
              updateData.flashSaleEnd = null;
              updateData.flashSaleStock = null;
            } else { updateData.flashSaleStock = newFSStock; }
          }
          await updateDoc(productRef, updateData);
        }
      }
      
      await sendOrderConfirmationEmail({
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        orderId: paymentData.order_id,
        totalAmount: paymentData.amount,
        items: paymentData.items.map((i: any) => ({ name: i.name, deliveryContent: i.deliveryContent || '' }))
      });

      const updatedSnap = await getDoc(orderRef);
      setLastOrder({ ...updatedSnap.data(), id: firestoreId });
      resetCart();
      toast({ title: "Pembayaran Berhasil!", description: "Template website Anda siap diunduh dan telah dikirim ke email." });
      setTimeout(() => router.push('/checkout/success'), 1500);
    } catch (error) {
        console.error("Payment Success Error:", error);
    }
  };

  useEffect(() => {
    if (status === 'success' || !orderId) return;
    const interval = setInterval(() => handleCheckStatus(true), 5000);
    return () => clearInterval(interval);
  }, [orderId, status, amount]);

  if (!paymentData) return null;

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-12 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => router.push('/checkout')} className="p-0 font-bold text-gray-500">
                <ArrowLeft size={18} className="mr-2" /> Kembali
            </Button>
            <div className={`text-[10px] font-bold uppercase tracking-widest ${timeLeft < 60 ? 'text-destructive animate-pulse' : 'text-gray-400'}`}>
                Sisa Waktu: {timeLeft > 0 ? formatTime(timeLeft) : 'EXPIRED'}
            </div>
        </div>
        <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white text-center">
          <CardHeader className="bg-primary p-8 text-white">
            <div className="flex justify-center mb-4"><div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Smartphone size={24} /></div></div>
            <CardTitle className="text-2xl font-bold">Lakukan Pembayaran</CardTitle>
            <p className="text-white/70 text-sm mt-1">Scan kode QRIS di bawah</p>
          </CardHeader>
          <CardContent className="p-8 md:p-10 space-y-8">
            <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">{formatRupiah(amount)}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID: {orderId}</div>
            </div>
            <div className="relative group">
                <div className="aspect-square w-full max-w-[240px] mx-auto bg-white p-4 rounded-3xl shadow-inner border-2 border-slate-100 flex items-center justify-center">
                    {qrData ? (
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`} alt="QRIS Code" className={`w-full h-full object-contain ${timeLeft <= 0 ? 'opacity-20 grayscale' : ''}`} />
                    ) : <Loader2 className="animate-spin text-primary" size={32} />}
                </div>
                {status === 'success' && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fadeIn rounded-3xl">
                        <CheckCircle2 size={64} className="text-green-500 mb-2" /><span className="font-bold text-green-600">Terbayar!</span>
                    </div>
                )}
            </div>
            <div className="space-y-4">
                <Button onClick={() => handleCheckStatus()} disabled={isChecking || status === 'success' || timeLeft <= 0} variant="outline" className="w-full h-12 rounded-xl font-bold gap-2">
                    {isChecking ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw className="h-4 w-4" />} Cek Status Pembayaran
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

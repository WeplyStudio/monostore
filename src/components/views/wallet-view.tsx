
'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Wallet, 
  Plus, 
  History, 
  Copy, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
  Zap,
  ShieldCheck,
  Mail,
  Lock,
  CheckCircle2,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { createPakasirTransaction, checkPakasirStatus } from '@/lib/pakasir-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function WalletView() {
  const { activePaymentKey, setActivePaymentKey, fetchPaymentKey, generateNewPaymentKey } = useApp();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [inputKey, setInputKey] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [topupAmount, setTopupAmount] = useState('50000');
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  const [topupQR, setTopupQR] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Kueri transaksi disederhanakan untuk menghindari error perizinan/indeks
  const txQuery = useMemoFirebase(() => {
    if (!db || !activePaymentKey) return null;
    return query(
      collection(db, 'wallet_transactions'), 
      where('paymentKeyId', '==', activePaymentKey.id),
      orderBy('createdAt', 'desc')
    );
  }, [db, activePaymentKey]);

  const { data: transactions, loading: txLoading, error: txError } = useCollection<any>(txQuery);

  // Polling status top-up
  useEffect(() => {
    if (!topupQR || isSuccess) return;

    const interval = setInterval(async () => {
      try {
        const result = await checkPakasirStatus(topupQR.order_id, topupQR.amount);
        if (result.transaction && (result.transaction.status === 'success' || result.transaction.status === 'completed')) {
          handleTopupSuccess();
        }
      } catch (err) {
        console.error("Topup polling error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [topupQR, isSuccess]);

  const handleTopupSuccess = async () => {
    if (!db || !activePaymentKey || !topupQR || isSuccess) return;
    setIsSuccess(true);

    try {
      const keyRef = doc(db, 'payment_keys', activePaymentKey.id);
      const amount = topupQR.amount;

      // 1. Update Saldo di Firestore
      await updateDoc(keyRef, { 
        balance: increment(amount),
        updatedAt: serverTimestamp() 
      });

      // 2. Catat Transaksi
      await addDoc(collection(db, 'wallet_transactions'), {
        paymentKeyId: activePaymentKey.id,
        amount: amount,
        type: 'topup',
        description: `Top Up Saldo via QRIS`,
        createdAt: serverTimestamp()
      });

      // 3. Update State Lokal
      setActivePaymentKey({
        ...activePaymentKey,
        balance: activePaymentKey.balance + amount
      });

      toast({ 
        title: "Top Up Berhasil!", 
        description: `Saldo sebesar ${formatRupiah(amount)} telah ditambahkan.` 
      });

      setTimeout(() => {
        setTopupQR(null);
        setIsSuccess(false);
      }, 3000);

    } catch (err) {
      console.error("Topup processing error:", err);
    }
  };

  const handleAccessKey = async () => {
    if (!inputKey.trim()) return;
    setLoading(true);
    try {
      const keyData = await fetchPaymentKey(inputKey.trim());
      if (keyData) {
        setActivePaymentKey(keyData);
        toast({ title: "Akses Berhasil", description: "Payment Key Anda telah dimuat." });
      } else {
        toast({ variant: "destructive", title: "Key Tidak Valid", description: "Periksa kembali kode Payment Key Anda." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan koneksi." });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!inputEmail.trim() || !inputEmail.includes('@')) {
      toast({ variant: "destructive", title: "Email Tidak Valid", description: "Harap masukkan email yang benar." });
      return;
    }
    setLoading(true);
    try {
      await generateNewPaymentKey(inputEmail.trim());
      toast({ title: "Berhasil!", description: "Payment Key telah dibuat dan dikirim ke email." });
      setInputEmail('');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message || "Coba lagi beberapa saat." });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2SV = async (enabled: boolean) => {
    if (!db || !activePaymentKey) return;
    try {
      await updateDoc(doc(db, 'payment_keys', activePaymentKey.id), { is2SVEnabled: enabled });
      setActivePaymentKey({ ...activePaymentKey, is2SVEnabled: enabled });
      toast({ title: enabled ? "2SV Aktif" : "2SV Nonaktif" });
    } catch (err) {
      console.error("Update 2SV error:", err);
    }
  };

  const handleTopup = async () => {
    if (!activePaymentKey) return;
    setIsTopupLoading(true);
    setIsSuccess(false);
    const amount = parseInt(topupAmount);
    const orderId = `TOPUP-${Date.now()}`;
    
    try {
      const result = await createPakasirTransaction(orderId, amount);
      if (result && result.payment) {
        setTopupQR({ ...result.payment, amount, order_id: orderId });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal membuat QRIS topup." });
    } finally {
      setIsTopupLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Disalin!" });
  };

  if (!activePaymentKey) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 animate-fadeIn">
        <Card className="w-full max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-primary text-white p-10 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
              <Wallet size={32} />
            </div>
            <CardTitle className="text-2xl font-black font-headline">Mono Wallet</CardTitle>
            <CardDescription className="text-white/70">Akses saldo tanpa login menggunakan Payment Key.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Punya Payment Key?</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="MONO-XXXX-XXXX" 
                    value={inputKey} 
                    onChange={e => setInputKey(e.target.value.toUpperCase())}
                    className="h-12 rounded-xl bg-slate-50 border-none font-black tracking-widest text-center"
                  />
                  <Button onClick={handleAccessKey} disabled={loading} className="h-12 w-12 rounded-xl p-0">
                    {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-300"><span className="bg-white px-2">Atau buat baru</span></div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Masukkan Email</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      placeholder="email@anda.com" 
                      value={inputEmail} 
                      onChange={e => setInputEmail(e.target.value)}
                      className="h-12 pl-10 rounded-xl bg-slate-50 border-none"
                    />
                  </div>
                  <Button onClick={handleGenerateKey} disabled={loading} className="h-12 rounded-xl px-4 font-bold">
                    {loading ? <Loader2 className="animate-spin" /> : 'Buat Key'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black font-headline flex items-center gap-3">
            <Wallet size={32} className="text-primary" /> Wallet Dashboard
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <code className="bg-slate-100 px-3 py-1 rounded-lg font-black text-sm tracking-widest">{activePaymentKey.key}</code>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(activePaymentKey.key)} className="h-8 w-8 rounded-lg">
              <Copy size={14} />
            </Button>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1">
              <Mail size={10} /> {activePaymentKey.email}
            </span>
            <Button variant="ghost" className="text-xs font-bold text-destructive px-2 h-8 flex items-center gap-1" onClick={() => setActivePaymentKey(null)}>
              <LogOut size={12} /> Logout
            </Button>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Saldo</div>
          <div className="text-4xl font-black text-primary">{formatRupiah(activePaymentKey.balance)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-[2rem] border-none shadow-sm bg-primary text-white p-6 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} />
                  <span className="text-xs font-bold uppercase tracking-widest">2-Step Verification</span>
                </div>
                <Switch 
                  checked={activePaymentKey.is2SVEnabled} 
                  onCheckedChange={handleToggle2SV}
                  className="data-[state=checked]:bg-white"
                />
             </div>
             <p className="text-[10px] text-white/70 leading-relaxed">
               Setiap pembayaran akan meminta kode verifikasi yang dikirim ke email Anda.
             </p>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 space-y-6">
            <h3 className="text-lg font-black flex items-center gap-2"><Plus size={20} /> Top Up Saldo</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nominal</label>
                <Select value={topupAmount} onValueChange={setTopupAmount} disabled={!!topupQR && !isSuccess}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    {[10000, 25000, 50000, 100000, 250000, 500000].map(amt => (
                      <SelectItem key={amt} value={amt.toString()}>{formatRupiah(amt)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {topupQR ? (
                <div className="space-y-4 text-center p-4 bg-slate-50 rounded-2xl animate-fadeIn relative">
                  <div className="aspect-square w-full max-w-[180px] mx-auto bg-white p-3 rounded-xl border border-slate-100 shadow-inner relative">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(topupQR.payment_number)}`} 
                      alt="QRIS" 
                      className={`w-full h-full object-contain ${isSuccess ? 'opacity-20 grayscale' : ''}`} 
                    />
                    {isSuccess && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center animate-fadeIn">
                        <CheckCircle2 size={48} className="text-green-500 mb-2" />
                        <span className="text-xs font-black text-green-600">BERHASIL</span>
                      </div>
                    )}
                  </div>
                  {!isSuccess && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-bold text-slate-500 flex items-center justify-center gap-2">
                        <RefreshCw size={10} className="animate-spin" /> Menunggu pembayaran...
                      </p>
                      <Button variant="ghost" className="w-full text-[10px] font-bold text-destructive h-8" onClick={() => setTopupQR(null)}>Batal</Button>
                    </div>
                  )}
                </div>
              ) : (
                <Button onClick={handleTopup} disabled={isTopupLoading} className="w-full h-12 rounded-xl font-black text-lg shadow-lg shadow-primary/20">
                  {isTopupLoading ? <Loader2 className="animate-spin" /> : 'Isi Saldo'}
                </Button>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
            <h3 className="text-lg font-black flex items-center gap-2 mb-8"><History size={20} /> Riwayat Transaksi</h3>
            <div className="space-y-4">
              {txLoading ? (
                <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-200" size={32} /></div>
              ) : txError ? (
                <div className="py-10 text-center bg-red-50 rounded-2xl p-4">
                  <AlertCircle className="mx-auto text-red-500 mb-2" />
                  <p className="text-xs font-bold text-red-600">Gagal memuat transaksi. Silakan muat ulang halaman.</p>
                </div>
              ) : transactions?.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-50 rounded-[2rem]">
                  <p className="text-sm font-bold text-slate-300">Belum ada transaksi</p>
                </div>
              ) : (
                transactions?.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:border-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'topup' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                        {tx.type === 'topup' ? <Plus size={18} /> : <Zap size={18} />}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{tx.description}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString('id-ID') : 'Baru saja'}
                        </div>
                      </div>
                    </div>
                    <div className={`font-black text-sm ${tx.type === 'topup' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'topup' ? '+' : '-'}{formatRupiah(tx.amount).replace(",00", "")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

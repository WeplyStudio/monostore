
"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Wallet, 
  Plus, 
  History, 
  Copy, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  Search,
  Zap,
  Ticket
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { createPakasirTransaction } from '@/lib/pakasir-actions';

export default function WalletView() {
  const { activePaymentKey, setActivePaymentKey, fetchPaymentKey, generateNewPaymentKey, setView } = useApp();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [inputKey, setInputKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [topupAmount, setTopupAmount] = useState('50000');
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  const [topupQR, setTopupQR] = useState<any>(null);

  const txQuery = useMemoFirebase(() => {
    if (!db || !activePaymentKey) return null;
    return query(
      collection(db, 'wallet_transactions'), 
      where('paymentKeyId', '==', activePaymentKey.id),
      orderBy('createdAt', 'desc')
    );
  }, [db, activePaymentKey]);

  const { data: transactions, loading: txLoading } = useCollection<any>(txQuery);

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
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Gagal memuat key." });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    setLoading(true);
    try {
      const keyData = await generateNewPaymentKey();
      toast({ title: "Key Baru Dibuat!", description: "Simpan kode ini dengan aman." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Gagal membuat key." });
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    if (!activePaymentKey) return;
    setIsTopupLoading(true);
    const amount = parseInt(topupAmount);
    const orderId = `TOPUP-${Date.now()}`;
    
    try {
      const result = await createPakasirTransaction(orderId, amount);
      if (result && result.payment) {
        setTopupQR({
          ...result.payment,
          amount,
          order_id: orderId
        });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal membuat QRIS topup." });
    } finally {
      setIsTopupLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Disalin!", description: "Kode key telah disalin ke clipboard." });
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
            <CardDescription className="text-white/70">Akses saldo anonim Anda tanpa login.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Masukkan Payment Key</label>
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
                <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-300"><span className="bg-white px-2">Atau</span></div>
              </div>

              <Button variant="outline" onClick={handleGenerateKey} disabled={loading} className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold hover:bg-slate-50">
                Buat Payment Key Baru
              </Button>
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <AlertCircle className="text-blue-500 shrink-0" size={18} />
              <p className="text-[10px] text-blue-600 font-bold leading-relaxed">
                SIMPAN KEY ANDA. Siapa pun yang memiliki key ini dapat menggunakan saldo di dalamnya.
              </p>
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
          <div className="flex items-center gap-2 mt-2">
            <code className="bg-slate-100 px-3 py-1 rounded-lg font-black text-sm tracking-widest">{activePaymentKey.key}</code>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(activePaymentKey.key)} className="h-8 w-8 rounded-lg">
              <Copy size={14} />
            </Button>
            <Button variant="ghost" className="text-xs font-bold text-destructive px-2 h-8" onClick={() => setActivePaymentKey(null)}>Logout</Button>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Saldo</div>
          <div className="text-4xl font-black text-primary">{formatRupiah(activePaymentKey.balance)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 space-y-6">
            <h3 className="text-lg font-black flex items-center gap-2"><Plus size={20} /> Top Up Saldo</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nominal (IDR)</label>
                <Select value={topupAmount} onValueChange={setTopupAmount}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                    <SelectValue placeholder="Pilih Nominal" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    <SelectItem value="10000">{formatRupiah(10000)}</SelectItem>
                    <SelectItem value="25000">{formatRupiah(25000)}</SelectItem>
                    <SelectItem value="50000">{formatRupiah(50000)}</SelectItem>
                    <SelectItem value="100000">{formatRupiah(100000)}</SelectItem>
                    <SelectItem value="250000">{formatRupiah(250000)}</SelectItem>
                    <SelectItem value="500000">{formatRupiah(500000)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {topupQR ? (
                <div className="space-y-4 text-center p-4 bg-slate-50 rounded-2xl animate-fadeIn">
                  <div className="aspect-square w-full max-w-[180px] mx-auto bg-white p-3 rounded-xl border border-slate-100 shadow-inner">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(topupQR.payment_number)}`} alt="QRIS" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500">Scan QRIS untuk menyelesaikan top up {formatRupiah(topupQR.amount)}</p>
                  <Button variant="outline" className="w-full text-xs font-bold" onClick={() => setTopupQR(null)}>Batal</Button>
                </div>
              ) : (
                <Button onClick={handleTopup} disabled={isTopupLoading} className="w-full h-12 rounded-xl font-black text-lg">
                  {isTopupLoading ? <Loader2 className="animate-spin" /> : 'Isi Saldo Sekarang'}
                </Button>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black flex items-center gap-2"><History size={20} /> Riwayat Transaksi</h3>
            </div>
            
            <div className="space-y-4">
              {txLoading ? (
                <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-200" size={32} /></div>
              ) : transactions?.length === 0 ? (
                <div className="py-20 text-center space-y-2 border-2 border-dashed border-slate-50 rounded-[2rem]">
                  <p className="text-sm font-bold text-slate-300">Belum ada transaksi</p>
                  <p className="text-[10px] text-slate-300 uppercase tracking-widest">Saldo Anda akan tercatat di sini</p>
                </div>
              ) : (
                transactions?.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
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

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

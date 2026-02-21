
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  doc, 
  updateDoc, 
  increment, 
  addDoc, 
  serverTimestamp, 
  orderBy 
} from 'firebase/firestore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Wallet, 
  Plus, 
  Minus, 
  ShieldCheck, 
  History, 
  Mail, 
  CheckCircle2, 
  X,
  Send,
  Lock,
  KeyRound,
  Star
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { sendVerificationCodeEmail } from '@/lib/email-actions';

interface PaymentKeyDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  paymentKey: any;
}

export function PaymentKeyDetailsDialog({ isOpen, onClose, paymentKey }: PaymentKeyDetailsDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [balanceInput, setBalanceInput] = useState('0');
  const [pointsInput, setPointsInput] = useState('0');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [lastSentOtp, setLastSentOtp] = useState<string | null>(null);

  // Fetch transactions for this key
  const txQuery = useMemoFirebase(() => {
    if (!db || !paymentKey) return null;
    return query(
      collection(db, 'wallet_transactions'),
      where('paymentKeyId', '==', paymentKey.id)
    );
  }, [db, paymentKey]);

  const { data: transactions, loading: txLoading } = useCollection<any>(txQuery);

  const sortedTransactions = useMemo(() => {
    if (!transactions) return [];
    return [...transactions].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [transactions]);

  const handleUpdateBalance = async (type: 'add' | 'subtract') => {
    if (!db || !paymentKey || !balanceInput) return;
    const amount = parseFloat(balanceInput);
    if (isNaN(amount) || amount <= 0) return;

    setIsUpdating(true);
    try {
      const finalAmount = type === 'add' ? amount : -amount;
      const keyRef = doc(db, 'payment_keys', paymentKey.id);
      
      await updateDoc(keyRef, {
        balance: increment(finalAmount),
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, 'wallet_transactions'), {
        paymentKeyId: paymentKey.id,
        amount: Math.abs(finalAmount),
        type: type === 'add' ? 'topup' : 'purchase',
        description: `Penyesuaian Admin: ${type === 'add' ? 'Penambahan' : 'Pengurangan'} Saldo`,
        createdAt: serverTimestamp()
      });

      toast({ title: "Berhasil", description: `Saldo ${type === 'add' ? 'ditambah' : 'dikurangi'} ${formatRupiah(amount)}` });
      setBalanceInput('0');
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan sistem." });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePoints = async (type: 'add' | 'subtract') => {
    if (!db || !paymentKey || !pointsInput) return;
    const amount = parseInt(pointsInput);
    if (isNaN(amount) || amount <= 0) return;

    setIsUpdating(true);
    try {
      const finalAmount = type === 'add' ? amount : -amount;
      const keyRef = doc(db, 'payment_keys', paymentKey.id);
      
      await updateDoc(keyRef, {
        points: increment(finalAmount),
        updatedAt: serverTimestamp()
      });

      toast({ title: "Berhasil", description: `Poin ${type === 'add' ? 'ditambah' : 'dikurangi'} ${amount} Poin` });
      setPointsInput('0');
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan sistem." });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendOtp = async () => {
    if (!paymentKey?.email) return;
    setIsSendingOtp(true);
    setLastSentOtp(null);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const res = await sendVerificationCodeEmail(paymentKey.email, code);
      if (res.success) {
        setLastSentOtp(code);
        toast({ title: "OTP Terkirim", description: `Kode verifikasi telah dikirim ke ${paymentKey.email}` });
      } else {
        throw new Error("Gagal mengirim email.");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setIsSendingOtp(false);
    }
  };

  if (!paymentKey) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setLastSentOtp(null);
        onClose();
      }
    }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2.5rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-black">
            <Wallet className="text-primary" /> Detail Payment Key
          </DialogTitle>
          <DialogDescription className="font-mono tracking-widest text-primary font-bold">
            {paymentKey.key}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-6">
          {/* Section: Management (Left) */}
          <div className="md:col-span-7 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="rounded-[2rem] border-none shadow-sm bg-slate-50 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo</span>
                  <span className="text-xl font-black text-primary">{formatRupiah(paymentKey.balance || 0)}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      value={balanceInput} 
                      onChange={e => setBalanceInput(e.target.value)} 
                      className="h-10 rounded-xl bg-white border-none font-bold"
                    />
                    <div className="flex gap-1">
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl text-green-600 bg-white" onClick={() => handleUpdateBalance('add')} disabled={isUpdating}><Plus size={18} /></Button>
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl text-red-600 bg-white" onClick={() => handleUpdateBalance('subtract')} disabled={isUpdating}><Minus size={18} /></Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="rounded-[2rem] border-none shadow-sm bg-yellow-50 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest flex items-center gap-1"><Star size={10} /> MonoPoints</span>
                  <span className="text-xl font-black text-yellow-700">{paymentKey.points || 0}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      value={pointsInput} 
                      onChange={e => setPointsInput(e.target.value)} 
                      className="h-10 rounded-xl bg-white border-none font-bold text-yellow-700"
                    />
                    <div className="flex gap-1">
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl text-yellow-600 bg-white" onClick={() => handleUpdatePoints('add')} disabled={isUpdating}><Plus size={18} /></Button>
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl text-red-600 bg-white" onClick={() => handleUpdatePoints('subtract')} disabled={isUpdating}><Minus size={18} /></Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="rounded-[2rem] border-none shadow-sm bg-white p-6 space-y-4 border border-slate-100">
               <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="text-blue-600" size={18} />
                  <h4 className="text-sm font-black">Verifikasi Identitas</h4>
               </div>
               <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Email Terhubung</div>
                    <div className="text-xs font-bold text-blue-700 truncate">{paymentKey.email}</div>
                  </div>
                  <Button 
                    onClick={handleSendOtp} 
                    disabled={isSendingOtp}
                    size="sm" 
                    className="rounded-xl h-10 px-4 font-bold bg-blue-600 hover:bg-blue-700"
                  >
                    {isSendingOtp ? <Loader2 className="animate-spin h-4 w-4" /> : <Send size={14} className="mr-2" />}
                    Kirim OTP
                  </Button>
               </div>

               {lastSentOtp && (
                 <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col items-center gap-1 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-1">
                      <KeyRound size={14} className="text-orange-500" />
                      <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">OTP TERKIRIM (ADMIN VIEW)</span>
                    </div>
                    <span className="text-3xl font-black text-orange-600 tracking-[0.4em]">{lastSentOtp}</span>
                    <p className="text-[8px] text-orange-400 font-bold uppercase mt-1">Cocokkan kode yang diberikan user dengan kode di atas</p>
                 </div>
               )}

               <p className="text-[9px] text-muted-foreground font-medium italic">
                 Gunakan fitur ini untuk mengirimkan kode OTP ke email pemilik jika ingin memverifikasi kepemilikan Key ini secara manual.
               </p>
            </Card>
          </div>

          {/* Section: History (Right) */}
          <div className="md:col-span-5 space-y-4">
            <h4 className="text-sm font-black flex items-center gap-2">
              <History size={18} className="text-slate-400" /> Riwayat Transaksi
            </h4>
            <ScrollArea className="h-[400px] rounded-3xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="space-y-3">
                {txLoading ? (
                  <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-200" /></div>
                ) : sortedTransactions.length === 0 ? (
                  <div className="py-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Belum ada transaksi</div>
                ) : (
                  sortedTransactions.map((tx: any) => (
                    <div key={tx.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold truncate">{tx.description}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                          {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString('id-ID') : 'Baru saja'}
                        </div>
                      </div>
                      <div className={`text-xs font-black shrink-0 ml-2 ${tx.type === 'topup' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'topup' ? '+' : '-'}{formatRupiah(tx.amount).replace(",00", "")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => { setLastSentOtp(null); onClose(); }} className="rounded-xl font-bold">Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

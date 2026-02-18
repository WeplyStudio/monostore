'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Ticket, Tag, Calendar } from 'lucide-react';

interface VoucherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  voucher?: any;
}

export function VoucherDialog({ isOpen, onClose, voucher }: VoucherDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    minPurchase: '0',
    isActive: true,
    expiryDate: ''
  });

  useEffect(() => {
    if (voucher) {
      setFormData({
        code: voucher.code || '',
        type: voucher.type || 'percentage',
        value: voucher.value?.toString() || '',
        minPurchase: voucher.minPurchase?.toString() || '0',
        isActive: voucher.isActive ?? true,
        expiryDate: voucher.expiryDate || ''
      });
    } else {
      setFormData({
        code: '', type: 'percentage', value: '', minPurchase: '0', isActive: true, expiryDate: ''
      });
    }
  }, [voucher, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setLoading(true);
    try {
      const payload = {
        code: formData.code.toUpperCase().trim(),
        type: formData.type,
        value: parseFloat(formData.value),
        minPurchase: parseFloat(formData.minPurchase),
        isActive: formData.isActive,
        expiryDate: formData.expiryDate || null,
        updatedAt: serverTimestamp(),
      };

      if (voucher) {
        await updateDoc(doc(db, 'vouchers', voucher.id), payload);
        toast({ title: 'Success', description: 'Voucher diperbarui' });
      } else {
        await addDoc(collection(db, 'vouchers'), { ...payload, createdAt: serverTimestamp() });
        toast({ title: 'Success', description: 'Voucher baru ditambahkan' });
      }
      onClose();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Ticket size={20} /> {voucher ? 'Edit Voucher' : 'Tambah Voucher'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-gray-400">Kode Voucher</Label>
              <Input placeholder="CONTOH: HEMAT50" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} required className="rounded-xl bg-slate-50 border-none font-black tracking-widest text-lg" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-gray-400">Tipe Potongan</Label>
                <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                  <SelectTrigger className="rounded-xl bg-slate-50 border-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Persentase (%)</SelectItem>
                    <SelectItem value="fixed">Nilai Tetap (IDR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-gray-400">Nilai ({formData.type === 'percentage' ? '%' : 'IDR'})</Label>
                <Input type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} required className="rounded-xl bg-slate-50 border-none font-bold" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-gray-400">Minimal Belanja (IDR)</Label>
              <Input type="number" value={formData.minPurchase} onChange={e => setFormData({...formData, minPurchase: e.target.value})} className="rounded-xl bg-slate-50 border-none" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2"><Calendar size={14} /> Tanggal Kedaluwarsa (Opsional)</Label>
              <Input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="rounded-xl bg-slate-50 border-none" />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="space-y-0.5">
                <Label className="font-bold">Aktifkan Voucher</Label>
                <p className="text-[10px] text-muted-foreground">Voucher bisa digunakan saat checkout</p>
              </div>
              <Switch checked={formData.isActive} onCheckedChange={val => setFormData({...formData, isActive: val})} />
            </div>
          </div>
          <DialogFooter><Button type="submit" disabled={loading} className="w-full rounded-xl h-12 font-bold">{loading ? <Loader2 className="animate-spin mr-2" /> : 'Simpan Voucher'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
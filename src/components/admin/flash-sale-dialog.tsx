
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, AlertTriangle, Clock } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface FlashSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export function FlashSaleDialog({ isOpen, onClose, product }: FlashSaleDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    price: '',
    flashSaleEnd: ''
  });

  useEffect(() => {
    if (product) {
      // If product is already in flash sale, use current price as promo price
      // and if not, suggest a 20% discount as default
      const isFlashSale = product.flashSaleEnd && new Date(product.flashSaleEnd).getTime() > Date.now();
      
      setFormData({
        price: product.price?.toString() || '',
        flashSaleEnd: product.flashSaleEnd || ''
      });
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !product) return;

    setLoading(true);
    try {
      const flashPrice = parseFloat(formData.price);
      
      // We set originalPrice to the current base price if it's not already set
      // to ensure we can show the strikethrough.
      const originalPrice = product.originalPrice || product.price;

      const payload = {
        price: flashPrice,
        originalPrice: originalPrice,
        flashSaleEnd: formData.flashSaleEnd,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'products', product.id), payload);
      
      toast({ 
        title: 'Flash Sale Aktif!', 
        description: `${product.name} sekarang dalam masa promo kilat.` 
      });
      onClose();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Gagal', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!db || !product) return;
    setLoading(true);
    try {
      // When disabling, we revert the price to the originalPrice
      const revertPrice = product.originalPrice || product.price;
      
      await updateDoc(doc(db, 'products', product.id), {
        price: revertPrice,
        originalPrice: null,
        flashSaleEnd: null,
        updatedAt: serverTimestamp()
      });

      toast({ title: 'Flash Sale Dimatikan', description: 'Harga produk telah kembali normal.' });
      onClose();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Gagal', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Zap size={20} className="fill-red-600" /> Pengaturan Flash Sale
          </DialogTitle>
          <DialogDescription>
            Atur harga khusus dan durasi promo untuk <strong>{product.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase">Harga Saat Ini</span>
              <span className="font-bold text-slate-600">{formatRupiah(product.price)}</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-red-500 tracking-widest">Harga Flash Sale (IDR)</Label>
              <Input 
                type="number" 
                placeholder="Masukkan harga promo..." 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: e.target.value})} 
                required 
                className="h-12 rounded-xl bg-red-50 border-red-100 font-black text-red-600 text-lg focus-visible:ring-red-200" 
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                <Clock size={12} /> Waktu Berakhir
              </Label>
              <Input 
                type="datetime-local" 
                value={formData.flashSaleEnd} 
                onChange={e => setFormData({...formData, flashSaleEnd: e.target.value})} 
                required 
                className="h-12 rounded-xl bg-slate-50 border-none" 
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <AlertTriangle size={16} className="text-blue-500 shrink-0" />
              <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                Harga normal akan otomatis dicoret dan section Flash Sale akan muncul di beranda.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {product.flashSaleEnd && (
              <Button type="button" variant="ghost" onClick={handleDisable} disabled={loading} className="rounded-xl font-bold text-destructive hover:bg-red-50">
                Matikan Flash Sale
              </Button>
            )}
            <div className="flex gap-2 flex-1">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl font-bold flex-1">Batal</Button>
              <Button type="submit" disabled={loading} className="rounded-xl h-11 font-bold bg-red-600 hover:bg-red-700 text-white flex-1">
                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Simpan & Aktifkan'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

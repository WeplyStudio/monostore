
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, AlertTriangle, Clock, Package, ShoppingBag } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface FlashSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
  allProducts: any[];
}

export function FlashSaleDialog({ isOpen, onClose, product, allProducts }: FlashSaleDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [formData, setFormData] = useState({
    price: '',
    flashSaleEnd: '',
    flashSaleStock: ''
  });

  useEffect(() => {
    if (product) {
      setSelectedProductId(product.id);
      setFormData({
        price: product.price?.toString() || '',
        flashSaleEnd: product.flashSaleEnd || '',
        flashSaleStock: product.flashSaleStock?.toString() || ''
      });
    } else {
      setSelectedProductId('');
      setFormData({
        price: '',
        flashSaleEnd: '',
        flashSaleStock: ''
      });
    }
  }, [product, isOpen]);

  const selectedProductData = allProducts.find(p => p.id === selectedProductId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedProductId) return;

    setLoading(true);
    try {
      const flashPrice = parseFloat(formData.price);
      const fsStock = parseInt(formData.flashSaleStock) || 0;
      
      const originalPrice = selectedProductData?.originalPrice || selectedProductData?.price;

      const payload = {
        price: flashPrice,
        originalPrice: originalPrice,
        flashSaleEnd: formData.flashSaleEnd,
        flashSaleStock: fsStock,
        flashSaleInitialStock: fsStock, // Tracking initial quota for progress
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'products', selectedProductId), payload);
      
      toast({ 
        title: 'Flash Sale Aktif!', 
        description: `Promo kilat telah dikonfigurasi.` 
      });
      onClose();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Gagal', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!db || !selectedProductId || !selectedProductData) return;
    setLoading(true);
    try {
      const revertPrice = selectedProductData.originalPrice || selectedProductData.price;
      
      await updateDoc(doc(db, 'products', selectedProductId), {
        price: revertPrice,
        originalPrice: null,
        flashSaleEnd: null,
        flashSaleStock: null,
        flashSaleInitialStock: null,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[2.5rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 text-xl font-black">
            <Zap size={24} className="fill-red-600" /> Konfigurasi Flash Sale
          </DialogTitle>
          <DialogDescription className="font-bold">
            Tentukan produk, harga, dan kuota khusus promo kilat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            {!product && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                  <ShoppingBag size={12} /> Pilih Produk
                </Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                    <SelectValue placeholder="Pilih produk..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    {allProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedProductData && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Harga Normal</span>
                <span className="font-black text-slate-600">{formatRupiah(selectedProductData.originalPrice || selectedProductData.price)}</span>
              </div>
            )}

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                  <Package size={12} /> Kuota Promo
                </Label>
                <Input 
                  type="number" 
                  placeholder="Misal: 10"
                  value={formData.flashSaleStock} 
                  onChange={e => setFormData({...formData, flashSaleStock: e.target.value})} 
                  required 
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                  <Clock size={12} /> Selesai Pada
                </Label>
                <Input 
                  type="datetime-local" 
                  value={formData.flashSaleEnd} 
                  onChange={e => setFormData({...formData, flashSaleEnd: e.target.value})} 
                  required 
                  className="h-12 rounded-xl bg-slate-50 border-none text-[10px] font-bold" 
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <AlertTriangle size={20} className="text-blue-500 shrink-0" />
              <p className="text-[10px] text-blue-600 font-bold leading-relaxed uppercase">
                Progress bar akan dihitung berdasarkan Kuota Promo yang terjual. Jika kuota habis, harga otomatis kembali normal.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {product && (
              <Button type="button" variant="ghost" onClick={handleDisable} disabled={loading} className="rounded-xl font-bold text-destructive hover:bg-red-50">
                Matikan Flash Sale
              </Button>
            )}
            <div className="flex gap-2 flex-1">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl font-bold flex-1">Batal</Button>
              <Button type="submit" disabled={loading || !selectedProductId} className="rounded-xl h-11 font-black bg-red-600 hover:bg-red-700 text-white flex-1 shadow-lg shadow-red-100">
                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Aktifkan Promo'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

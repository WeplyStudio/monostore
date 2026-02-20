
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
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package } from 'lucide-react';

interface BundleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bundle?: any;
  products: any[];
}

export function BundleDialog({ isOpen, onClose, bundle, products }: BundleDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    discountPercentage: '',
    productIds: [] as string[],
    isActive: true
  });

  useEffect(() => {
    if (bundle) {
      setFormData({
        name: bundle.name || '',
        discountPercentage: bundle.discountPercentage?.toString() || '',
        productIds: bundle.productIds || [],
        isActive: bundle.isActive ?? true
      });
    } else {
      setFormData({
        name: '',
        discountPercentage: '10',
        productIds: [],
        isActive: true
      });
    }
  }, [bundle, isOpen]);

  const toggleProduct = (productId: string) => {
    setFormData(prev => {
      const ids = [...prev.productIds];
      const index = ids.indexOf(productId);
      if (index > -1) ids.splice(index, 1);
      else ids.push(productId);
      return { ...prev, productIds: ids };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || formData.productIds.length < 2) {
      toast({ variant: 'destructive', title: 'Error', description: 'Pilih minimal 2 produk untuk bundling' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        discountPercentage: parseFloat(formData.discountPercentage),
        productIds: formData.productIds,
        isActive: formData.isActive,
        updatedAt: serverTimestamp(),
      };

      if (bundle) {
        await updateDoc(doc(db, 'bundles', bundle.id), payload);
        toast({ title: 'Berhasil', description: 'Bundle diperbarui' });
      } else {
        await addDoc(collection(db, 'bundles'), { ...payload, createdAt: serverTimestamp() });
        toast({ title: 'Berhasil', description: 'Bundle baru ditambahkan' });
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
        <DialogHeader><DialogTitle>{bundle ? 'Edit Bundle' : 'Tambah Bundle Produk'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-400 uppercase">Nama Bundle</Label>
              <Input placeholder="Contoh: Starter Pack React" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="rounded-xl bg-slate-50 border-none" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-400 uppercase">Diskon Bundle (%)</Label>
              <Input type="number" value={formData.discountPercentage} onChange={e => setFormData({...formData, discountPercentage: e.target.value})} required className="rounded-xl bg-slate-50 border-none font-bold" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-400 uppercase">Pilih Produk (Min. 2)</Label>
              <ScrollArea className="h-48 border border-slate-100 rounded-xl p-4 bg-slate-50">
                <div className="space-y-3">
                  {products.map(p => (
                    <div key={p.id} className="flex items-center space-x-3">
                      <Checkbox 
                        id={p.id} 
                        checked={formData.productIds.includes(p.id)} 
                        onCheckedChange={() => toggleProduct(p.id)} 
                      />
                      <label htmlFor={p.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                        {p.name} <span className="text-[10px] text-muted-foreground">({p.category})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="space-y-0.5">
                <Label className="font-bold">Aktifkan Bundle</Label>
                <p className="text-[10px] text-muted-foreground">Bundle akan muncul di halaman promo</p>
              </div>
              <Switch checked={formData.isActive} onCheckedChange={val => setFormData({...formData, isActive: val})} />
            </div>
          </div>
          <DialogFooter><Button type="submit" disabled={loading} className="w-full rounded-xl h-12 font-bold">{loading ? <Loader2 className="animate-spin mr-2" /> : 'Simpan Bundle'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

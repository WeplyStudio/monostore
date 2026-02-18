
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
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { CATEGORIES } from '@/lib/data';
import { uploadToImgBB } from '@/lib/imgbb';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Link as LinkIcon, Package } from 'lucide-react';
import Image from 'next/image';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
}

export function ProductDialog({ isOpen, onClose, product }: ProductDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    features: '',
    stock: '',
    isBestSeller: false,
    image: '',
    deliveryContent: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        category: product.category || '',
        description: product.description || '',
        features: product.features?.join(', ') || '',
        stock: product.stock?.toString() || '0',
        isBestSeller: product.isBestSeller || false,
        image: product.image || '',
        deliveryContent: product.deliveryContent || ''
      });
      setImagePreview(product.image || '');
    } else {
      setFormData({
        name: '',
        price: '',
        category: '',
        description: '',
        features: '',
        stock: '0',
        isBestSeller: false,
        image: '',
        deliveryContent: ''
      });
      setImagePreview('');
      setImageFile(null);
    }
  }, [product, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setLoading(true);
    try {
      let imageUrl = formData.image;
      if (imageFile) {
        imageUrl = await uploadToImgBB(imageFile);
      }

      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        description: formData.description,
        features: formData.features.split(',').map(f => f.trim()).filter(f => f !== ''),
        stock: parseInt(formData.stock) || 0,
        isBestSeller: formData.isBestSeller,
        image: imageUrl,
        deliveryContent: formData.deliveryContent,
        updatedAt: serverTimestamp(),
        rating: product?.rating || 5.0,
        reviews: product?.reviews || 0,
        sold: product?.sold || 0,
      };

      if (product) {
        const docRef = doc(db, 'products', product.id);
        updateDoc(docRef, payload)
          .then(() => {
            toast({ title: 'Success', description: 'Product updated successfully' });
            onClose();
          })
          .catch(async (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: payload }));
          });
      } else {
        const collectionRef = collection(db, 'products');
        const finalPayload = { ...payload, createdAt: serverTimestamp() };
        addDoc(collectionRef, finalPayload)
          .then(() => {
            toast({ title: 'Success', description: 'Product created successfully' });
            onClose();
          })
          .catch(async (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: collectionRef.path, operation: 'create', requestResourceData: finalPayload }));
          });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{product ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase text-gray-400">Nama Produk</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="h-11 rounded-xl bg-slate-50 border-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-xs font-bold uppercase text-gray-400">Harga (IDR)</Label>
                  <Input id="price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="h-11 rounded-xl bg-slate-50 border-none" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-bold uppercase text-gray-400">Kategori</Label>
                  <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => c !== 'Semua').map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="stock" className="text-xs font-bold uppercase text-gray-400 flex items-center gap-1">
                    <Package size={12} /> Jumlah Stok
                  </Label>
                  <Input id="stock" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required className="h-11 rounded-xl bg-slate-50 border-none" />
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl h-11">
                    <input type="checkbox" id="bestseller" checked={formData.isBestSeller} onChange={e => setFormData({...formData, isBestSeller: e.target.checked})} className="w-5 h-5 rounded-md border-gray-300 text-primary" />
                    <Label htmlFor="bestseller" className="cursor-pointer font-bold text-xs">Best Seller</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deliveryContent" className="text-xs font-bold uppercase text-gray-400 flex items-center gap-1">
                  <LinkIcon size={12} /> Link / File Download (Diberikan ke Pembeli)
                </Label>
                <Input id="deliveryContent" placeholder="https://..." value={formData.deliveryContent} onChange={e => setFormData({...formData, deliveryContent: e.target.value})} className="h-11 rounded-xl bg-blue-50 border-none focus:ring-blue-200" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="features" className="text-xs font-bold uppercase text-gray-400">Fitur (pisahkan dengan koma)</Label>
                <Input id="features" placeholder="SEO Ready, Responsive, Dark Mode" value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none" />
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-gray-400">Gambar Produk</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors relative">
                  {imagePreview ? (
                    <div className="relative aspect-square w-full max-w-[200px] mx-auto overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      <button type="button" onClick={() => { setImagePreview(''); setImageFile(null); }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5"><X size={14} /></button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-3 py-10">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><Upload size={24} /></div>
                      <span className="text-sm font-bold text-slate-500">Klik untuk upload gambar</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold uppercase text-gray-400">Deskripsi Produk</Label>
                <Textarea id="description" rows={5} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required className="rounded-xl bg-slate-50 border-none" />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl font-bold">Batal</Button>
            <Button type="submit" disabled={loading} className="min-w-[150px] rounded-xl font-bold h-11">
              {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : (product ? 'Simpan Perubahan' : 'Tambah Produk')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

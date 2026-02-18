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
import { Loader2, Upload, X, Link as LinkIcon, Package, Zap, Tag } from 'lucide-react';
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
    originalPrice: '',
    category: '',
    description: '',
    features: '',
    stock: '',
    isBestSeller: false,
    image: '',
    deliveryContent: '',
    flashSaleEnd: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        originalPrice: product.originalPrice?.toString() || '',
        category: product.category || '',
        description: product.description || '',
        features: product.features?.join(', ') || '',
        stock: product.stock?.toString() || '0',
        isBestSeller: product.isBestSeller || false,
        image: product.image || '',
        deliveryContent: product.deliveryContent || '',
        flashSaleEnd: product.flashSaleEnd || ''
      });
      setImagePreview(product.image || '');
    } else {
      setFormData({
        name: '', price: '', originalPrice: '', category: '', description: '', features: '',
        stock: '0', isBestSeller: false, image: '', deliveryContent: '', flashSaleEnd: ''
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
      if (imageFile) imageUrl = await uploadToImgBB(imageFile);

      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        category: formData.category,
        description: formData.description,
        features: formData.features.split(',').map(f => f.trim()).filter(f => f !== ''),
        stock: parseInt(formData.stock) || 0,
        isBestSeller: formData.isBestSeller,
        image: imageUrl,
        deliveryContent: formData.deliveryContent,
        flashSaleEnd: formData.flashSaleEnd || null,
        updatedAt: serverTimestamp(),
        rating: product?.rating || 5.0,
        reviews: product?.reviews || 0,
        sold: product?.sold || 0,
      };

      if (product) {
        const docRef = doc(db, 'products', product.id);
        await updateDoc(docRef, payload);
        toast({ title: 'Success', description: 'Produk diperbarui' });
      } else {
        const collectionRef = collection(db, 'products');
        await addDoc(collectionRef, { ...payload, createdAt: serverTimestamp() });
        toast({ title: 'Success', description: 'Produk baru ditambahkan' });
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader><DialogTitle>{product ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-xs font-bold uppercase text-gray-400">Nama Produk</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="rounded-xl bg-slate-50 border-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs font-bold uppercase text-gray-400">Harga Promo (IDR)</Label><Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="rounded-xl bg-blue-50 border-none font-bold" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold uppercase text-gray-400">Harga Normal (Coret)</Label><Input type="number" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} className="rounded-xl bg-slate-50 border-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs font-bold uppercase text-gray-400">Stok</Label><Input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required className="rounded-xl bg-slate-50 border-none" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold uppercase text-gray-400">Kategori</Label>
                  <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})}>
                    <SelectTrigger className="rounded-xl bg-slate-50 border-none"><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.filter(c => c !== 'Semua').map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5 p-4 bg-red-50 rounded-xl border border-red-100">
                <Label className="text-xs font-bold uppercase text-red-600 flex items-center gap-2"><Zap size={14} className="fill-red-600" /> Flash Sale End Time (Opsional)</Label>
                <Input type="datetime-local" value={formData.flashSaleEnd} onChange={e => setFormData({...formData, flashSaleEnd: e.target.value})} className="rounded-xl bg-white border-red-200" />
                <p className="text-[10px] text-red-400 mt-1 italic">*Biarkan kosong jika bukan Flash Sale</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-gray-400">Gambar Produk</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center relative aspect-square max-w-[200px] mx-auto overflow-hidden">
                  {imagePreview ? (
                    <>
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      <button type="button" onClick={() => { setImagePreview(''); setImageFile(null); }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"><X size={14} /></button>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center h-full gap-2">
                      <Upload size={24} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400">UPLOAD</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  )}
                </div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-bold uppercase text-gray-400">Link Produk Digital</Label><Input value={formData.deliveryContent} onChange={e => setFormData({...formData, deliveryContent: e.target.value})} placeholder="https://..." className="rounded-xl bg-slate-50 border-none" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold uppercase text-gray-400">Deskripsi</Label><Textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required className="rounded-xl bg-slate-50 border-none" /></div>
            </div>
          </div>
          <DialogFooter><Button type="submit" disabled={loading} className="w-full rounded-xl h-12 font-bold">{loading ? <Loader2 className="animate-spin mr-2" /> : 'Simpan Produk'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
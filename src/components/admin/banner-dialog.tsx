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
import { uploadToImgBB } from '@/lib/imgbb';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Link as LinkIcon, Info } from 'lucide-react';
import Image from 'next/image';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface BannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  banner?: any;
}

export function BannerDialog({ isOpen, onClose, banner }: BannerDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    image: '',
    order: '0'
  });

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || '',
        link: banner.link || '',
        image: banner.image || '',
        order: banner.order?.toString() || '0'
      });
      setImagePreview(banner.image || '');
    } else {
      setFormData({
        title: '',
        link: '',
        image: '',
        order: '0'
      });
      setImagePreview('');
      setImageFile(null);
    }
  }, [banner, isOpen]);

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
        title: formData.title,
        link: formData.link,
        image: imageUrl,
        order: parseInt(formData.order) || 0,
        updatedAt: serverTimestamp(),
      };

      if (banner) {
        const docRef = doc(db, 'banners', banner.id);
        updateDoc(docRef, payload)
          .then(() => {
            toast({ title: 'Success', description: 'Banner updated successfully' });
            onClose();
          })
          .catch(async (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: payload }));
          });
      } else {
        const collectionRef = collection(db, 'banners');
        const finalPayload = { ...payload, createdAt: serverTimestamp() };
        addDoc(collectionRef, finalPayload)
          .then(() => {
            toast({ title: 'Success', description: 'Banner created successfully' });
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
      <DialogContent className="max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{banner ? 'Edit Banner' : 'Tambah Banner Baru'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase text-gray-400">Gambar Banner</Label>
              <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                <Info size={10} /> Rekomendasi: 1920 x 822 px (21:9)
              </div>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors relative">
              {imagePreview ? (
                <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  <button type="button" onClick={() => { setImagePreview(''); setImageFile(null); }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5"><X size={14} /></button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-3 py-10">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><Upload size={24} /></div>
                  <span className="text-sm font-bold text-slate-500">Klik untuk upload banner</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-bold uppercase text-gray-400">Judul (Opsional)</Label>
              <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order" className="text-xs font-bold uppercase text-gray-400">Urutan (0-9)</Label>
              <Input id="order" type="number" value={formData.order} onChange={e => setFormData({...formData, order: e.target.value})} required className="h-11 rounded-xl bg-slate-50 border-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link" className="text-xs font-bold uppercase text-gray-400 flex items-center gap-1">
              <LinkIcon size={12} /> Link Tujuan (Opsional)
            </Label>
            <Input id="link" placeholder="https://..." value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className="h-11 rounded-xl bg-slate-50 border-none" />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl font-bold">Batal</Button>
            <Button type="submit" disabled={loading} className="min-w-[150px] rounded-xl font-bold h-11">
              {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : (banner ? 'Simpan' : 'Tambah Banner')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

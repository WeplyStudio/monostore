
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
import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';

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
    isBestSeller: false,
    image: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        category: product.category || '',
        description: product.description || '',
        features: product.features?.join(', ') || '',
        isBestSeller: product.isBestSeller || false,
        image: product.image || ''
      });
      setImagePreview(product.image || '');
    } else {
      setFormData({
        name: '',
        price: '',
        category: '',
        description: '',
        features: '',
        isBestSeller: false,
        image: ''
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

      // Upload to ImgBB if a new file is selected
      if (imageFile) {
        imageUrl = await uploadToImgBB(imageFile);
      }

      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        description: formData.description,
        features: formData.features.split(',').map(f => f.trim()).filter(f => f !== ''),
        isBestSeller: formData.isBestSeller,
        image: imageUrl,
        updatedAt: serverTimestamp(),
        // Default values for new products
        rating: product?.rating || 5.0,
        reviews: product?.reviews || 0,
        sold: product?.sold || 0,
      };

      if (product) {
        await updateDoc(doc(db, 'products', product.id), payload);
        toast({ title: 'Success', description: 'Product updated successfully' });
      } else {
        await addDoc(collection(db, 'products'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Success', description: 'Product created successfully' });
      }
      onClose();
    } catch (error: any) {
      console.error(error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message || 'Something went wrong' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Create New Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (IDR)</Label>
                  <Input 
                    id="price" 
                    type="number"
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={val => setFormData({...formData, category: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => c !== 'Semua').map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features (comma separated)</Label>
                <Input 
                  id="features" 
                  placeholder="e.g. Responsive, Dark Mode, SEO Ready"
                  value={formData.features} 
                  onChange={e => setFormData({...formData, features: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="bestseller" 
                  checked={formData.isBestSeller}
                  onChange={e => setFormData({...formData, isBestSeller: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="bestseller" className="cursor-pointer">Best Seller Product</Label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Product Image</Label>
                <div className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative">
                  {imagePreview ? (
                    <div className="relative aspect-square w-full max-w-[200px] mx-auto overflow-hidden rounded-lg border">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      <button 
                        type="button"
                        onClick={() => { setImagePreview(''); setImageFile(null); }}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 py-8">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <Upload size={20} />
                      </div>
                      <span className="text-xs font-medium">Click to upload image</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  rows={5}
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[120px]">
              {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              {product ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

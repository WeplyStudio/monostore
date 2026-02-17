'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, ShoppingBag, Share2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { formatRupiah, getPlaceholderImageDetails } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { PRODUCTS } from '@/lib/data';
import type { Product } from '@/lib/types';
import { useRouter, useParams } from 'next/navigation';

export default function ProductDetailPage() {
  const { addToCart, addViewedProduct } = useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [qty, setQty] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const id = params.id;

  useEffect(() => {
    if (!id) return;
    const productId = parseInt(id, 10);
    const foundProduct = PRODUCTS.find((p) => p.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
      addViewedProduct(foundProduct);
    } else {
      // Handle product not found, maybe redirect or show a 404 component
      router.push('/');
    }
  }, [id, addViewedProduct, router]);

  if (!product) {
    return <div className="text-center py-20">Loading product...</div>;
  }

  const handleIncrement = () => setQty((prev) => prev + 1);
  const handleDecrement = () => setQty((prev) => (prev > 1 ? prev - 1 : 1));

  const imageDetails = getPlaceholderImageDetails(product.image);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
       <Button onClick={() => router.back()} variant="ghost" className="mb-8 text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} className="mr-2"/> Kembali
      </Button>
      <div className="grid md:grid-cols-2 gap-8 md:gap-16">
        {/* Left: Image */}
        <div className="w-full bg-secondary p-8 flex items-center justify-center relative min-h-[300px] md:min-h-[500px] rounded-3xl">
          <Image
            src={imageDetails.src}
            alt={product.name}
            data-ai-hint={imageDetails.hint}
            width={imageDetails.width}
            height={imageDetails.height}
            className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-3xl shadow-2xl"
          />
          <div className="absolute top-6 left-6 flex flex-col gap-2">
            {product.isBestSeller && (
              <Badge className="bg-primary text-primary-foreground text-xs font-bold w-fit flex items-center gap-1 shadow-lg">
                <TrendingUp size={12} /> Best Seller
              </Badge>
            )}
            <Badge variant="secondary" className="backdrop-blur text-foreground text-xs font-bold w-fit">
              {product.category}
            </Badge>
          </div>
        </div>

        {/* Right: Info */}
        <div className="w-full flex flex-col py-8">
          <div className="mb-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground font-medium">({product.reviews} Reviews)</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-muted-foreground">{product.sold}+ Terjual</span>
            </div>

            <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">{product.name}</h1>
            <p className="text-muted-foreground text-base leading-relaxed mb-6">{product.description}</p>

            <Separator className="my-8" />

            <div className="mb-6">
              <h3 className="text-3xl font-bold text-foreground">{formatRupiah(product.price * qty)}</h3>
              {qty > 1 && <p className="text-sm text-muted-foreground mt-1">({formatRupiah(product.price)} each)</p>}
            </div>

            <div className="mb-8">
              <h4 className="text-sm font-bold text-foreground uppercase mb-3">Jumlah (Licence)</h4>
              <div className="flex items-center justify-between p-1 bg-secondary rounded-xl border border-border/50 max-w-[160px]">
                <Button onClick={handleDecrement} size="icon" variant="ghost" className="rounded-lg text-muted-foreground hover:text-foreground">
                  <Minus size={18} />
                </Button>
                <span className="font-bold text-lg text-foreground w-8 text-center">{qty}</span>
                <Button onClick={handleIncrement} size="icon" className="rounded-lg bg-background text-foreground hover:bg-background/80 shadow-sm">
                  <Plus size={18} />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-8 border-t">
            <Button variant="outline" size="icon" className="px-3" onClick={() => alert('Share feature simulation')}>
              <Share2 size={18} />
            </Button>
            <Button onClick={() => addToCart(product, qty)} className="flex-1 rounded-xl shadow-lg shadow-primary/20">
              <ShoppingBag size={18} /> Tambah ke Keranjang ({qty})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

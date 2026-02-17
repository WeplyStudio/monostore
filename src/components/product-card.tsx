"use client";

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { formatRupiah, getPlaceholderImageDetails } from '@/lib/utils';
import { useApp } from '@/context/app-context';
import { Star, TrendingUp, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { setSelectedProduct } = useApp();
  const imageDetails = getPlaceholderImageDetails(product.image);
  const logoPlaceholder = getPlaceholderImageDetails('logo-placeholder');

  return (
    <div
      onClick={() => setSelectedProduct(product)}
      className="group relative bg-card p-3 rounded-2xl border border-border/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {product.isBestSeller && (
        <div className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border-2 border-background flex items-center gap-1">
          <TrendingUp size={10} /> TERLARIS
        </div>
      )}

      <div className="aspect-square bg-secondary rounded-xl overflow-hidden mb-3 relative">
        <Image 
            src={imageDetails.src} 
            alt={product.name} 
            data-ai-hint={imageDetails.hint}
            width={imageDetails.width}
            height={imageDetails.height}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/40 transition-colors"></div>
      </div>

      <div className="px-1">
        <h3 className="text-sm md:text-base font-bold text-foreground leading-tight mb-1 truncate">{product.name}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Badge variant="secondary" className="text-[10px]">{product.category}</Badge>
          <span className="flex items-center gap-0.5"><Star size={12} className="fill-yellow-400 text-yellow-400"/> {product.rating}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-foreground">{formatRupiah(product.price).replace(",00", "")}</span>
          <div className="w-7 h-7 bg-secondary rounded-full flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

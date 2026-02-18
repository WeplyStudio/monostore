
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatRupiah, getPlaceholderImageDetails } from '@/lib/utils';
import { Star, TrendingUp, ArrowRight, PackageX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Check if image is a URL or a placeholder ID
  const isUrl = typeof product.image === 'string' && product.image.startsWith('http');
  const imageSrc = isUrl ? product.image : getPlaceholderImageDetails(product.image).src;
  const isOutOfStock = (product.stock ?? 0) <= 0;

  return (
    <Link 
      href={`/product/${product.id}`} 
      className={`group relative block bg-card p-3 rounded-2xl border border-border/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${isOutOfStock ? 'opacity-75' : ''}`}
    >
      {product.isBestSeller && !isOutOfStock && (
        <div className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border-2 border-background flex items-center gap-1">
          <TrendingUp size={10} /> TERLARIS
        </div>
      )}

      {isOutOfStock && (
        <div className="absolute -top-2 -right-2 z-20 bg-destructive text-destructive-foreground text-[9px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-background flex items-center gap-1 uppercase tracking-tighter">
          <PackageX size={10} /> STOK HABIS
        </div>
      )}

      <div className="aspect-square bg-secondary rounded-xl overflow-hidden mb-3 relative">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? 'grayscale' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/40 transition-colors"></div>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full">KOSONG</span>
          </div>
        )}
      </div>

      <div className="px-1">
        <h3 className="text-sm md:text-base font-bold text-foreground leading-tight mb-1 truncate">{product.name}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Badge variant="secondary" className="text-[10px]">{product.category}</Badge>
          <span className="flex items-center gap-0.5"><Star size={12} className="fill-yellow-400 text-yellow-400"/> {product.rating}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-sm font-bold ${isOutOfStock ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
            {formatRupiah(product.price).replace(",00", "")}
          </span>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isOutOfStock ? 'bg-slate-100 text-slate-300' : 'bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground'}`}>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}

"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatRupiah, getPlaceholderImageDetails } from '@/lib/utils';
import { Star, TrendingUp, ArrowRight, PackageX, AlertCircle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isUrl = typeof product.image === 'string' && product.image.startsWith('http');
  const imageSrc = isUrl ? product.image : getPlaceholderImageDetails(product.image).src;
  const stock = product.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 10;

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  // Flash Sale check
  const isFlashSale = product.flashSaleEnd && new Date(product.flashSaleEnd).getTime() > Date.now();

  return (
    <Link 
      href={`/product/${product.id}`} 
      className={`group relative block bg-card p-3 rounded-2xl border border-border/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${isOutOfStock ? 'opacity-75' : ''}`}
    >
      {product.isBestSeller && !isOutOfStock && !isFlashSale && (
        <div className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border-2 border-background flex items-center gap-1">
          <TrendingUp size={10} /> TERLARIS
        </div>
      )}

      {isFlashSale && !isOutOfStock && (
        <div className="absolute -top-2 -right-2 z-10 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-background flex items-center gap-1 animate-pulse">
          <Zap size={10} className="fill-white" /> FLASH SALE
        </div>
      )}

      {isOutOfStock && (
        <div className="absolute -top-2 -right-2 z-20 bg-destructive text-destructive-foreground text-[9px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-background flex items-center gap-1 uppercase tracking-tighter">
          <PackageX size={10} /> STOK HABIS
        </div>
      )}

      {hasDiscount && !isOutOfStock && (
        <div className="absolute top-2 left-2 z-10 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
          -{discountPercent}%
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
      </div>

      <div className="px-1">
        <h3 className="text-sm font-bold text-foreground leading-tight mb-1 truncate">{product.name}</h3>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
          <span className="flex items-center gap-0.5"><Star size={10} className="fill-yellow-400 text-yellow-400"/> {product.rating}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>{product.category}</span>
        </div>
        
        <div className="flex flex-col mt-2">
          {hasDiscount && (
            <span className="text-[10px] text-muted-foreground line-through decoration-red-400/50">
              {formatRupiah(product.originalPrice!).replace(",00", "")}
            </span>
          )}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-bold ${isOutOfStock ? 'text-muted-foreground' : 'text-primary'}`}>
              {formatRupiah(product.price).replace(",00", "")}
            </span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isOutOfStock ? 'bg-slate-100 text-slate-300' : 'bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground'}`}>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
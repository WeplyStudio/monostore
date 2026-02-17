"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Zap, TrendingUp, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/product-card';
import { PRODUCTS, INITIAL_RECOMMENDATIONS, CATEGORIES } from '@/lib/data';
import { useApp } from '@/context/app-context';
import type { Product, Recommendation } from '@/lib/types';
import { getPersonalizedRecommendations } from '@/ai/flows/personalized-recommendations-flow';
import { formatRupiah } from '@/lib/utils';
import Image from 'next/image';
import { getPlaceholderImageDetails } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomeView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isRecsLoading, setIsRecsLoading] = useState(true);

  const { addToCart, viewedProducts } = useApp();

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsRecsLoading(true);
      try {
        const viewedProductIds = viewedProducts.map(p => p.id);
        const result = await getPersonalizedRecommendations({
          viewedProductIds,
          allProducts: PRODUCTS,
        });

        if (result.recommendations && result.recommendations.length > 0) {
            setRecommendations(result.recommendations);
        } else {
            // Fallback to initial recommendations if AI returns none
            const fallbackRecs = PRODUCTS.filter(p => INITIAL_RECOMMENDATIONS.some(rec => rec.id === p.id));
            setRecommendations(fallbackRecs);
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
        // Fallback on error
        const fallbackRecs = PRODUCTS.filter(p => INITIAL_RECOMMENDATIONS.some(rec => rec.id === p.id));
        setRecommendations(fallbackRecs);
      } finally {
        setIsRecsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [viewedProducts]);

  const filteredProducts = useMemo(() => PRODUCTS.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [searchTerm, selectedCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20">
      <div className="text-center mb-10 mt-4">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">Apa yang ingin kamu buat?</h1>
        <p className="text-muted-foreground mb-8">Temukan aset digital terbaik untuk projectmu.</p>
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Cari icon, template, atau e-book..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-background border-2 h-14 rounded-2xl shadow-sm focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="flex overflow-x-auto gap-3 pb-4 mb-8 justify-start md:justify-center no-scrollbar">
         {CATEGORIES.map((cat) => (
           <Button
             key={cat} 
             onClick={() => setSelectedCategory(cat)}
             variant={selectedCategory === cat ? 'default' : 'secondary'}
             className={`rounded-full whitespace-nowrap text-sm font-medium transition-colors ${selectedCategory === cat ? 'shadow-lg shadow-primary/20' : ''}`}
           >
             {cat}
           </Button>
         ))}
      </div>

      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-xl font-bold flex items-center gap-2">
             <Zap size={20} className="fill-yellow-400 text-yellow-400" /> 
             {searchTerm ? `Hasil: "${searchTerm}"` : 'Populer'}
           </h2>
           {(searchTerm || selectedCategory !== 'Semua') && (
             <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setSelectedCategory('Semua'); }} className="text-destructive hover:text-destructive">
               <X size={14} className="mr-1"/> Reset Filter
             </Button>
           )}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-secondary/50 rounded-3xl border border-dashed">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-bold text-foreground">Produk tidak ditemukan</h3>
            <p className="text-muted-foreground text-sm mt-1">Coba kata kunci lain atau ganti kategori.</p>
          </div>
        )}
      </div>

      <div className="bg-secondary/50 rounded-3xl p-6 md:p-10 border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
           <div>
             <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Editor's Pick</div>
             <h2 className="text-2xl font-bold text-foreground">Rekomendasi Untukmu</h2>
             <p className="text-muted-foreground text-sm mt-1">Koleksi pilihan yang mungkin kamu butuhkan.</p>
           </div>
           <Button variant="secondary" className="text-xs py-2 px-4 h-fit bg-background rounded-lg">Lihat Koleksi Lengkap</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {isRecsLoading ? (
            <>
              <RecommendationSkeleton />
              <RecommendationSkeleton />
            </>
           ) : (
             recommendations.map((item) => <RecommendationCard key={item.id} item={item} addToCart={addToCart} />)
           )}
        </div>
      </div>
    </div>
  );
}

const RecommendationCard = ({ item, addToCart }: { item: Product; addToCart: (product: Product) => void; }) => {
    const imageDetails = getPlaceholderImageDetails(item.image);
    return (
        <div className="bg-background p-5 rounded-2xl shadow-sm border flex gap-5 hover:border-primary/50 transition-colors">
            <div className="w-24 h-24 bg-secondary rounded-xl shrink-0 overflow-hidden">
                <Image src={imageDetails.src} alt={item.name} data-ai-hint={imageDetails.hint} width={imageDetails.width} height={imageDetails.height} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col justify-between flex-1 py-1">
                <div>
                    <div className="flex justify-between items-start">
                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 mb-2">{item.category}</Badge>
                        <span className="text-xs text-muted-foreground">AI Pick</span>
                    </div>
                    <h3 className="font-bold text-foreground text-lg">{item.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{item.description}</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-foreground">{formatRupiah(item.price).replace(",00", "")}</span>
                    <Button variant="link" className="p-0 h-auto text-sm" onClick={() => addToCart(item)}>
                        + Keranjang
                    </Button>
                </div>
            </div>
        </div>
    )
}

const RecommendationSkeleton = () => (
  <div className="bg-background p-5 rounded-2xl shadow-sm border flex gap-5">
      <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
      <div className="flex flex-col justify-between flex-1 py-1">
          <div>
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="h-6 w-3/4 mb-1" />
              <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex items-center justify-between mt-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-5 w-20" />
          </div>
      </div>
  </div>
)

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Zap, X, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/product-card';
import { CATEGORIES } from '@/lib/data';
import { useApp } from '@/context/app-context';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { getPersonalizedRecommendations } from '@/ai/flows/personalized-recommendations-flow';
import { formatRupiah, getPlaceholderImageDetails } from '@/lib/utils';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomeView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isRecsLoading, setIsRecsLoading] = useState(true);

  const { addToCart, viewedProducts } = useApp();
  const db = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: dbProducts, loading: isProductsLoading } = useCollection(productsQuery);

  const products = (dbProducts as Product[]) || [];

  useEffect(() => {
    if (products.length === 0) return;

    const fetchRecommendations = async () => {
      setIsRecsLoading(true);
      try {
        const sanitizedProducts = products.map(p => ({
          ...p,
          id: String(p.id),
          createdAt: p.createdAt?.toDate ? p.createdAt.toDate().toISOString() : (p.createdAt || null),
          updatedAt: p.updatedAt?.toDate ? p.updatedAt.toDate().toISOString() : (p.updatedAt || null),
        }));

        const viewedProductIds = viewedProducts.map(p => String(p.id));
        
        const result = await getPersonalizedRecommendations({
          viewedProductIds,
          allProducts: sanitizedProducts as any,
        });

        if (result.recommendations && result.recommendations.length > 0) {
            setRecommendations(result.recommendations as Product[]);
        } else {
            setRecommendations(products.slice(0, 4));
        }
      } catch (error) {
        setRecommendations(products.slice(0, 4));
      } finally {
        setIsRecsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [viewedProducts, products]);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [searchTerm, selectedCategory, products]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20">
      <div className="text-center mb-10 mt-4">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 tracking-tight font-headline">Apa yang ingin kamu buat?</h1>
        <p className="text-muted-foreground mb-8 text-sm md:text-base">Temukan aset digital terbaik untuk project kreatifmu.</p>
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Cari icon, template, atau e-book..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border-none h-14 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-sm md:text-base"
          />
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 md:gap-3 pb-4 mb-10 justify-start md:justify-center no-scrollbar">
         {CATEGORIES.map((cat) => (
           <Button
             key={cat} 
             onClick={() => setSelectedCategory(cat)}
             variant={selectedCategory === cat ? 'default' : 'secondary'}
             className={`rounded-full whitespace-nowrap text-xs md:text-sm font-bold h-9 md:h-11 px-5 transition-all ${selectedCategory === cat ? 'shadow-lg shadow-primary/20' : 'bg-white hover:bg-slate-100'}`}
           >
             {cat}
           </Button>
         ))}
      </div>

      <div className="mb-16">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-xl font-bold flex items-center gap-2">
             <Zap size={22} className="fill-yellow-400 text-yellow-400" /> 
             {searchTerm ? `Hasil: "${searchTerm}"` : 'Populer Minggu Ini'}
           </h2>
           {(searchTerm || selectedCategory !== 'Semua') && (
             <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setSelectedCategory('Semua'); }} className="text-destructive hover:text-destructive font-bold text-xs">
               <X size={14} className="mr-1"/> Reset
             </Button>
           )}
        </div>

        {isProductsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="aspect-[3/4] rounded-3xl" />)}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <X size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Produk Tidak Ditemukan</h3>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto text-sm">Coba gunakan kata kunci lain atau pilih kategori yang berbeda.</p>
          </div>
        )}
      </div>

      {products.length > 0 && (
        <div className="bg-primary/5 rounded-[2.5rem] p-6 md:p-12 border border-primary/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
             <div>
               <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">
                 <Sparkles size={14} /> Editor's Choice
               </div>
               <h2 className="text-2xl md:text-3xl font-bold text-foreground">Rekomendasi Untukmu</h2>
               <p className="text-muted-foreground text-sm mt-2">Koleksi pilihan yang mungkin sesuai dengan minatmu.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
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
      )}
    </div>
  );
}

const RecommendationCard = ({ item, addToCart }: { item: Product; addToCart: (product: Product) => void; }) => {
    const isUrl = typeof item.image === 'string' && item.image.startsWith('http');
    const imageSrc = isUrl ? item.image : getPlaceholderImageDetails(item.image).src;

    return (
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group overflow-hidden">
            <div className="w-full sm:w-32 aspect-square sm:h-32 bg-slate-50 rounded-2xl shrink-0 overflow-hidden relative border border-slate-50">
                <Image src={imageSrc} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex flex-col justify-between flex-1 min-w-0">
                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none text-[9px] h-5 px-2 font-bold uppercase shrink-0">{item.category}</Badge>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest truncate">AI Recommendation</span>
                    </div>
                    <h3 className="font-bold text-foreground text-base sm:text-lg line-clamp-1 leading-tight">{item.name}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed h-8 sm:h-auto">{item.description}</p>
                </div>
                <div className="flex flex-row sm:flex-row items-center justify-between gap-2 mt-4 pt-2 border-t border-slate-50 sm:border-none">
                    <span className="font-bold text-primary text-sm sm:text-base whitespace-nowrap">{formatRupiah(item.price).replace(",00", "")}</span>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto text-[11px] sm:text-xs font-black text-primary hover:bg-transparent hover:text-primary/70 shrink-0" 
                      onClick={() => addToCart(item)}
                    >
                        + Keranjang
                    </Button>
                </div>
            </div>
        </div>
    )
}

const RecommendationSkeleton = () => (
  <div className="bg-white p-4 rounded-[2rem] border border-slate-100 flex flex-col sm:flex-row gap-4">
      <Skeleton className="w-full sm:w-32 aspect-square sm:h-32 rounded-2xl shrink-0" />
      <div className="flex flex-col justify-between flex-1 py-1">
          <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex items-center justify-between mt-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-20" />
          </div>
      </div>
  </div>
)
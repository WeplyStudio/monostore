
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles,
  ShoppingCart,
  Loader2,
  Star,
  MessageSquare,
  ArrowRight,
  AlertTriangle,
  Package,
  Zap,
  Clock,
  Plus,
  Minus
} from 'lucide-react';
import { formatRupiah, getPlaceholderImageDetails, formatCompactNumber, parseDescriptionToHtml } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { useRouter, useParams } from 'next/navigation';
import { getPersonalizedRecommendations } from '@/ai/flows/personalized-recommendations-flow';
import ProductCard from '@/components/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, getDocs, limit, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

export default function ProductDetailPage() {
  const { addToCart, addViewedProduct, viewedProducts } = useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const db = useFirestore();
  
  const id = params?.id as string;
  
  const productRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'products', id);
  }, [db, id]);

  const { data: product, loading: productLoading } = useDoc<Product>(productRef);
  
  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'products', id, 'reviews'), orderBy('createdAt', 'desc'), limit(5));
  }, [db, id]);
  
  const { data: reviews, loading: reviewsLoading } = useCollection<any>(reviewsQuery);

  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isRecsLoading, setIsRecsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      addViewedProduct(product);
    }
  }, [product, addViewedProduct]);

  useEffect(() => {
    if (!product?.flashSaleEnd) return;

    const timer = setInterval(() => {
      const end = new Date(product.flashSaleEnd).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('BERAKHIR');
        clearInterval(timer);
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}j ${m}m ${s}d`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [product?.flashSaleEnd]);

  useEffect(() => {
    if (!product || !db) return;

    const fetchRecommendations = async () => {
      setIsRecsLoading(true);
      try {
        const productsSnap = await getDocs(query(collection(db, 'products'), limit(30)));
        const sanitizedAllProducts = productsSnap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || '',
            price: d.price || 0,
            originalPrice: d.originalPrice || null,
            category: d.category || '',
            description: d.description || '',
            image: d.image || '',
            rating: d.rating ?? 0,
            reviews: d.reviews || 0,
            sold: d.sold || 0,
            stock: d.stock ?? 0,
            flashSaleStock: d.flashSaleStock || 0,
            flashSaleEnd: d.flashSaleEnd || null,
            isBestSeller: d.isBestSeller || false,
            features: d.features || [],
          };
        });

        const result = await getPersonalizedRecommendations({
          viewedProductIds: (viewedProducts || []).map(p => String(p.id)),
          currentProductId: String(product.id),
          allProducts: sanitizedAllProducts as any,
        });

        if (result?.recommendations?.length > 0) {
          setRecommendations(result.recommendations as Product[]);
        } else {
          const fallback = sanitizedAllProducts
            .filter(p => p.id !== id && p.category === product.category)
            .slice(0, 4);
          
          if (fallback.length > 0) {
            setRecommendations(fallback as any);
          } else {
            setRecommendations(sanitizedAllProducts.filter(p => p.id !== id).slice(0, 4) as any);
          }
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
        setRecommendations([]);
      } finally {
        setIsRecsLoading(false);
      }
    };

    fetchRecommendations();
  }, [product, viewedProducts, db, id]);

  if (productLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!product) return <div className="flex flex-col items-center justify-center min-h-screen"><h2 className="text-xl font-bold mb-4">Template tidak ditemukan</h2><Button onClick={() => router.push('/')}>Beranda</Button></div>;

  const isUrl = typeof product.image === 'string' && product.image.startsWith('http');
  const imageSrc = isUrl ? product.image : getPlaceholderImageDetails(product.image).src;
  const stock = product.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const isFlashSale = product.flashSaleEnd && new Date(product.flashSaleEnd).getTime() > Date.now();

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    router.push('/checkout');
  };

  const incrementQty = () => {
    if (quantity < stock) setQuantity(q => q + 1);
  };

  const decrementQty = () => {
    if (quantity > 1) setQuantity(q => q - 1);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button onClick={() => router.back()} variant="ghost" className="text-sm font-bold hover:bg-transparent px-0">
            <ArrowLeft size={18} className="mr-2" /> Kembali
          </Button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {isFlashSale && (
          <div className="mb-6 bg-red-600 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-white shadow-lg animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Zap size={24} className="fill-white" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest opacity-80">Flash Sale Sedang Berlangsung!</div>
                <div className="font-bold text-lg">Dapatkan harga spesial sebelum waktu habis.</div>
              </div>
            </div>
            <div className="bg-black/20 px-6 py-2 rounded-xl flex items-center gap-3 border border-white/10">
              <Clock size={18} />
              <div className="font-mono font-black text-xl tabular-nums">{timeLeft}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 p-4 relative">
              {isOutOfStock && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                  <div className="bg-destructive text-white px-6 py-2 rounded-2xl font-bold shadow-xl flex items-center gap-2"><Package size={20} /> STOK HABIS</div>
                </div>
              )}
              <div className="aspect-square relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden">
                <Image src={imageSrc} alt={product.name} fill className="object-cover" priority />
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-md font-bold uppercase text-[10px]">{product.category}</Badge>
                  {isFlashSale && <Badge className="bg-red-600 text-white rounded-md font-bold uppercase text-[10px]">Flash Sale</Badge>}
                </div>
                <h1 className="text-3xl font-bold text-[#212529] leading-tight">{product.name}</h1>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                    <Star size={14} className="fill-yellow-500 text-yellow-500" />
                    {product.rating} <span className="text-yellow-400 font-medium ml-1">({product.reviews} Review)</span>
                  </div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{formatCompactNumber(product.sold || 0)}+ Terjual</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Deskripsi</h3>
                <div 
                  className="text-sm text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: parseDescriptionToHtml(product.description) }}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Fitur Utama</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(product.features || []).map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                      <CheckCircle2 size={16} className="text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator className="opacity-50" />

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <MessageSquare size={20} className="text-primary" /> Ulasan
                  </h2>
                  {reviews?.length > 0 && (
                    <Link href={`/product/${id}/reviews`}>
                      <Button variant="ghost" className="text-xs font-bold text-primary gap-2">Semua <ArrowRight size={14} /></Button>
                    </Link>
                  )}
                </div>
                {reviews?.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((rev: any) => (
                      <div key={rev.id} className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">{rev.userName?.charAt(0)}</AvatarFallback></Avatar>
                            <div className="text-sm font-bold">{rev.userName}</div>
                          </div>
                          <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />)}</div>
                        </div>
                        <p className="text-xs text-gray-600 italic leading-relaxed">"{rev.comment}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed text-sm text-muted-foreground">Belum ada ulasan.</div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div>
                    {hasDiscount && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-muted-foreground line-through">{formatRupiah(product.originalPrice!)}</span>
                        <Badge className="bg-accent text-white rounded-md text-[10px]">DISKON {Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}%</Badge>
                      </div>
                    )}
                    <h2 className="text-3xl font-bold text-foreground">{formatRupiah(product.price)}</h2>
                    {stock <= 10 && stock > 0 && (
                      <div className="mt-2 text-destructive font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 animate-pulse">
                        <AlertTriangle size={14} /> Sisa {stock} stok lagi!
                      </div>
                    )}
                  </div>

                  <Separator className="opacity-50" />

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors" 
                          onClick={decrementQty}
                          disabled={isOutOfStock || quantity <= 1}
                        >
                          <Minus size={18} strokeWidth={2.5} />
                        </Button>
                        <div className="w-12 text-center font-bold text-lg text-slate-900">{quantity}</div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors" 
                          onClick={incrementQty}
                          disabled={isOutOfStock || quantity >= stock}
                        >
                          <Plus size={18} strokeWidth={2.5} />
                        </Button>
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Stok: {stock}
                      </div>
                    </div>

                    <Button onClick={() => addToCart(product, quantity)} variant="secondary" disabled={isOutOfStock} className="w-full h-12 rounded-xl font-bold">
                      <ShoppingCart size={18} className="mr-2" /> + Keranjang
                    </Button>
                    <Button onClick={handleBuyNow} disabled={isOutOfStock} className="w-full h-12 rounded-xl font-bold bg-primary text-white">
                      {isOutOfStock ? 'Stok Habis' : 'Beli Sekarang'}
                    </Button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <CheckCircle2 size={12} className="text-green-500" /> Pengiriman Instan
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <CheckCircle2 size={12} className="text-green-500" /> Lisensi Komersial
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="mt-20 space-y-8">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Sparkles size={24} className="text-primary fill-primary/20" /> Produk Serupa</h2>
          {isRecsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recommendations.length > 0 ? (
                recommendations.map(rec => <ProductCard key={rec.id} product={rec} />)
              ) : (
                <div className="col-span-full text-center py-10 text-muted-foreground text-sm">Belum ada produk serupa lainnya.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

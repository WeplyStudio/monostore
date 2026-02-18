
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Package
} from 'lucide-react';
import { formatRupiah, getPlaceholderImageDetails, formatCompactNumber } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { useRouter, useParams } from 'next/navigation';
import { getPersonalizedRecommendations } from '@/ai/flows/personalized-recommendations-flow';
import ProductCard from '@/components/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, getDocs, limit, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

export default function ProductDetailPage() {
  const { addToCart, addViewedProduct, viewedProducts, setView, setIsCartOpen, formData, handleInputChange } = useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const db = useFirestore();
  
  const id = params?.id as string;
  
  const productRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'products', id);
  }, [db, id]);

  const { data: firestoreProduct, loading: productLoading } = useDoc<any>(productRef);
  
  // Reviews Query - Limit to 5 for the main product page
  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'products', id, 'reviews'), orderBy('createdAt', 'desc'), limit(5));
  }, [db, id]);
  
  const { data: reviews, loading: reviewsLoading } = useCollection<any>(reviewsQuery);

  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isRecsLoading, setIsRecsLoading] = useState(true);

  const product = firestoreProduct;

  useEffect(() => {
    if (product) {
      addViewedProduct(product as Product);
    }
  }, [product, addViewedProduct]);

  useEffect(() => {
    if (!product || !db) return;

    const fetchRecommendations = async () => {
      setIsRecsLoading(true);
      try {
        const productsSnap = await getDocs(query(collection(db, 'products'), limit(20)));
        const allProducts = productsSnap.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: (doc.data() as any).createdAt?.toDate ? (doc.data() as any).createdAt.toDate().toISOString() : ((doc.data() as any).createdAt || null),
          updatedAt: (doc.data() as any).updatedAt?.toDate ? (doc.data() as any).updatedAt.toDate().toISOString() : ((doc.data() as any).updatedAt || null),
        }));

        const sanitizedCurrentProduct = {
          ...product,
          id: String(product.id),
          createdAt: product.createdAt?.toDate ? product.createdAt.toDate().toISOString() : (product.createdAt || null),
          updatedAt: product.updatedAt?.toDate ? product.updatedAt.toDate().toISOString() : (product.updatedAt || null),
        };

        const viewedProductIds = viewedProducts.map(p => String(p.id));

        const result = await getPersonalizedRecommendations({
          viewedProductIds,
          currentProductId: sanitizedCurrentProduct.id,
          allProducts: allProducts as any,
        });

        if (result && result.recommendations && result.recommendations.length > 0) {
          setRecommendations(result.recommendations as Product[]);
        } else {
          setRecommendations(allProducts.filter(p => p.id !== id).slice(0, 4) as Product[]);
        }
      } catch (error) {
        setRecommendations([]);
      } finally {
        setIsRecsLoading(false);
      }
    };

    fetchRecommendations();
  }, [product, viewedProducts, db, id]);

  if (productLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!product && !productLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-bold mb-4">Produk tidak ditemukan</h2>
        <Button onClick={() => router.push('/')}>Kembali ke Beranda</Button>
      </div>
    );
  }

  const isUrl = typeof product.image === 'string' && product.image.startsWith('http');
  const imageSrc = isUrl ? product.image : getPlaceholderImageDetails(product.image).src;
  const imageHint = isUrl ? "" : getPlaceholderImageDetails(product.image).hint;

  const stock = product.stock || 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 10;

  const handlingFee = 0;
  const totalPrice = (product.price || 0) + handlingFee;

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product as Product, 1);
    setView('checkout');
    setIsCartOpen(false);
    router.push('/');
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product as Product, 1);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button 
            onClick={() => router.back()} 
            variant="ghost" 
            className="text-sm font-bold hover:bg-transparent px-0"
          >
            <ArrowLeft size={18} className="mr-2" /> Kembali
          </Button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 p-4 relative">
              {isOutOfStock && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                  <div className="bg-destructive text-white px-6 py-2 rounded-2xl font-bold shadow-xl flex items-center gap-2">
                    <Package size={20} /> STOK HABIS
                  </div>
                </div>
              )}
              <div className="aspect-square relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden">
                <Image
                  src={imageSrc}
                  alt={product.name}
                  data-ai-hint={imageHint}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-[#212529] leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                    <Star size={14} className="fill-yellow-500 text-yellow-500" />
                    {product.rating} <span className="text-yellow-400 font-medium ml-1">({product.reviews} Review)</span>
                  </div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{formatCompactNumber(product.sold || 0)}+ Terjual</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Keunggulan & Fitur</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                  {(product.features || []).map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                      <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Deskripsi</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              <Separator className="opacity-50" />

              {/* Review Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={20} className="text-primary" />
                    <h2 className="text-xl font-bold">Ulasan Pengguna</h2>
                  </div>
                  {reviews && reviews.length > 0 && (
                    <Link href={`/product/${id}/reviews`}>
                      <Button variant="ghost" className="text-xs font-bold text-primary gap-2">
                        Lihat Semua <ArrowRight size={14} />
                      </Button>
                    </Link>
                  )}
                </div>

                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
                  </div>
                ) : reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {reviews.map((rev: any) => (
                        <div key={rev.id} className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border-2 border-primary/10">
                                <AvatarFallback className="bg-primary/5 text-primary font-bold">{rev.userName?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-bold">{rev.userName}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                  {rev.createdAt?.toDate ? rev.createdAt.toDate().toLocaleDateString('id-ID') : 'Baru saja'}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} size={12} className={s <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed italic">"{rev.comment}"</p>
                        </div>
                      ))}
                    </div>
                    
                    {product.reviews > 5 && (
                      <div className="text-center pt-2">
                         <Link href={`/product/${id}/reviews`}>
                           <Button variant="outline" className="rounded-2xl px-10 h-12 font-bold text-sm">
                             Lihat Semua {product.reviews} Ulasan
                           </Button>
                         </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white rounded-[2rem] border border-dashed border-gray-200">
                    <p className="text-sm text-muted-foreground">Belum ada ulasan untuk produk ini.</p>
                  </div>
                )}
              </div>

              <div className="space-y-6 pt-12">
                <div className="flex items-center gap-2">
                   <Sparkles size={20} className="text-primary fill-primary/20" />
                   <h2 className="text-xl font-bold">Produk Serupa Untukmu</h2>
                </div>
                
                {isRecsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="aspect-square w-full rounded-2xl" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {recommendations.map((rec) => (
                      <ProductCard key={rec.id} product={rec} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">
                      {formatRupiah(product.price)}
                    </h2>
                    {isLowStock && (
                      <div className="mt-2 text-destructive font-black text-[11px] uppercase tracking-widest flex items-center gap-2 animate-pulse">
                        <AlertTriangle size={14} /> Stok tersisa: {stock}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Lengkapi Data Pesanan</h3>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Email</label>
                        <Input 
                          name="email"
                          placeholder="email@kamu.com" 
                          value={formData.email}
                          onChange={handleInputChange}
                          className="bg-gray-50 border-none h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">WhatsApp</label>
                        <Input 
                          name="whatsapp"
                          placeholder="0812..." 
                          value={formData.whatsapp}
                          onChange={handleInputChange}
                          className="bg-gray-50 border-none h-12 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                      <span>Harga Produk</span>
                      <span>{formatRupiah(product.price)}</span>
                    </div>
                    <Separator className="my-3 opacity-50" />
                    <div className="flex justify-between text-lg font-bold text-foreground">
                      <span>Total</span>
                      <span>{formatRupiah(totalPrice)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={handleAddToCart}
                        variant="secondary" 
                        disabled={isOutOfStock}
                        className="h-14 rounded-2xl font-bold"
                      >
                        <ShoppingCart size={18} className="mr-2" />
                        + Keranjang
                      </Button>
                      <Button 
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                        className="bg-primary hover:bg-primary/90 text-white h-14 rounded-2xl font-bold"
                      >
                        {isOutOfStock ? 'Stok Habis' : 'Beli Sekarang'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

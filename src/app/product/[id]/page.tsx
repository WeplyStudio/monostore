
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  MessageCircle, 
  CheckCircle2, 
  Globe, 
  Github, 
  Info,
  ShieldCheck,
  Sparkles,
  ShoppingCart,
  Loader2
} from 'lucide-react';
import { formatRupiah, getPlaceholderImageDetails } from '@/lib/utils';
import { PRODUCTS } from '@/lib/data';
import type { Product } from '@/lib/types';
import { useRouter, useParams } from 'next/navigation';
import { getPersonalizedRecommendations } from '@/ai/flows/personalized-recommendations-flow';
import ProductCard from '@/components/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, limit } from 'firebase/firestore';

export default function ProductDetailPage() {
  const { addToCart, addViewedProduct, viewedProducts, setView, setIsCartOpen } = useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const db = useFirestore();
  
  const id = params?.id as string;
  
  // Ambil data produk dari Firestore
  const productRef = db && id ? doc(db, 'products', id) : null;
  const { data: firestoreProduct, loading: productLoading } = useDoc<any>(productRef);
  
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isRecsLoading, setIsRecsLoading] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');
  const [githubUser, setGithubUser] = useState('');

  // Gabungkan data statis dan dinamis (utamakan dinamis)
  const product = firestoreProduct || PRODUCTS.find(p => p.id.toString() === id);

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
        const viewedProductIds = viewedProducts.map(p => p.id);
        const result = await getPersonalizedRecommendations({
          viewedProductIds,
          currentProductId: product.id,
          allProducts: PRODUCTS, // Fallback to static for now
        });

        if (result && result.recommendations && result.recommendations.length > 0) {
          setRecommendations(result.recommendations as Product[]);
        } else {
          const fallbackRecs = PRODUCTS.filter(p => p.id.toString() !== id).slice(0, 4);
          setRecommendations(fallbackRecs as Product[]);
        }
      } catch (error) {
        const fallbackRecs = PRODUCTS.filter(p => p.id.toString() !== id).slice(0, 4);
        setRecommendations(fallbackRecs as Product[]);
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

  // Handle image source (URL vs placeholder ID)
  const isUrl = product.image?.startsWith('http');
  const imageSrc = isUrl ? product.image : getPlaceholderImageDetails(product.image).src;
  const imageHint = isUrl ? "" : getPlaceholderImageDetails(product.image).hint;

  const handlingFee = 2250;
  const totalPrice = (product.price || 0) + handlingFee;

  const handleBuyNow = () => {
    addToCart(product as Product, 1);
    setView('checkout');
    setIsCartOpen(false);
    router.push('/');
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
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="aspect-square relative w-full max-w-2xl mx-auto">
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

            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-[#212529] leading-tight">
                {product.name}
              </h1>

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
              <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {formatRupiah(product.price)}
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-800">Lengkapi Data Pesanan</h3>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">WhatsApp</label>
                        <Input 
                          placeholder="Masukkan WhatsApp" 
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="bg-gray-50 border-gray-100 h-11 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Username Github</label>
                        <Input 
                          placeholder="Masukkan Username Github" 
                          value={githubUser}
                          onChange={(e) => setGithubUser(e.target.value)}
                          className="bg-gray-50 border-gray-100 h-11 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                      <span>Harga Produk</span>
                      <span>{formatRupiah(product.price)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                      <span>Biaya Penanganan</span>
                      <span>{formatRupiah(handlingFee)}</span>
                    </div>
                    <Separator className="my-3 opacity-50" />
                    <div className="flex justify-between text-sm font-bold text-foreground">
                      <span>Total</span>
                      <span>{formatRupiah(totalPrice)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => addToCart(product as Product, 1)}
                        variant="outline" 
                        className="flex-1 border-primary text-primary hover:bg-primary/5 h-12 rounded-xl font-bold"
                      >
                        <ShoppingCart size={18} className="mr-2" />
                        Keranjang
                      </Button>
                      <Button 
                        onClick={handleBuyNow}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-bold"
                      >
                        Beli
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

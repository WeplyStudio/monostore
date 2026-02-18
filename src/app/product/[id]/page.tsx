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
  Sparkles
} from 'lucide-react';
import { formatRupiah, getPlaceholderImageDetails } from '@/lib/utils';
import { PRODUCTS, INITIAL_RECOMMENDATIONS } from '@/lib/data';
import type { Product } from '@/lib/types';
import { useRouter, useParams } from 'next/navigation';
import { getPersonalizedRecommendations } from '@/ai/flows/personalized-recommendations-flow';
import ProductCard from '@/components/product-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetailPage() {
  const { addToCart, addViewedProduct, viewedProducts } = useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [githubUser, setGithubUser] = useState('');
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isRecsLoading, setIsRecsLoading] = useState(true);
  
  const id = params?.id;

  useEffect(() => {
    if (!id) return;
    const productId = parseInt(id as string, 10);
    const foundProduct = PRODUCTS.find((p) => p.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
      addViewedProduct(foundProduct);
    } else {
      router.push('/');
    }
  }, [id, addViewedProduct, router]);

  useEffect(() => {
    if (!product) return;

    const fetchRecommendations = async () => {
      setIsRecsLoading(true);
      try {
        const viewedProductIds = viewedProducts.map(p => p.id);
        const result = await getPersonalizedRecommendations({
          viewedProductIds,
          currentProductId: product.id,
          allProducts: PRODUCTS,
        });

        if (result.recommendations && result.recommendations.length > 0) {
          setRecommendations(result.recommendations);
        } else {
          const fallbackRecs = PRODUCTS.filter(p => 
            p.id !== product.id && 
            INITIAL_RECOMMENDATIONS.some(rec => rec.id === p.id)
          ).slice(0, 4);
          setRecommendations(fallbackRecs);
        }
      } catch (error) {
        const fallbackRecs = PRODUCTS.filter(p => 
          p.id !== product.id && 
          INITIAL_RECOMMENDATIONS.some(rec => rec.id === p.id)
        ).slice(0, 4);
        setRecommendations(fallbackRecs);
      } finally {
        setIsRecsLoading(false);
      }
    };

    fetchRecommendations();
  }, [product, viewedProducts]);

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-secondary rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  const imageDetails = getPlaceholderImageDetails(product.image);
  const handlingFee = 2250;
  const totalPrice = product.price + handlingFee;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button 
            onClick={() => router.back()} 
            variant="ghost" 
            className="text-sm font-bold hover:bg-transparent px-0"
          >
            <ArrowLeft size={18} className="mr-2" /> Back
          </Button>
          
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span className="cursor-pointer hover:text-foreground text-foreground">Beranda</span>
            <span className="cursor-pointer hover:text-foreground">Produk</span>
            <span className="cursor-pointer hover:text-foreground">Kontak</span>
            <span className="cursor-pointer hover:text-foreground">Login</span>
            <div className="flex items-center gap-2 border-l pl-6">
              <div className="w-8 h-4 bg-gray-200 rounded-full relative">
                <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span>Light</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Main Product Image */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="aspect-square relative w-full max-w-2xl mx-auto">
                <Image
                  src={imageDetails.src}
                  alt={product.name}
                  data-ai-hint={imageDetails.hint}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-[#212529] leading-tight">
                {product.name}
              </h1>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Benefits & Features</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                      <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                    <span>Auto Download</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                    <span>Chatbot + Logic</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                    <span>Cloud Storage</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                    <span>Premium Support</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Requirements</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <Globe size={16} className="text-gray-400" />
                    <span>NodeJS {'>'}= 20 (Recommended v20.18.1)</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <Info size={16} className="text-gray-400" />
                    <span>FFMPEG installed</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <ShieldCheck size={16} className="text-gray-400" />
                    <span>Server CPU/RAM 1/1 GB</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Notes</h3>
                <ol className="list-decimal list-inside space-y-3 text-sm text-gray-600 leading-relaxed">
                  <li>Script premium sudah termasuk additional feature kecuali Payment Gateway.</li>
                  <li>Terbiasa/Familiar dengan command Linux/Windows/NPM sangat disarankan.</li>
                  <li>Lisensi akan digenerate secara otomatis setelah pembayaran.</li>
                </ol>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Rules</h3>
                <ul className="space-y-3 text-sm text-gray-600 leading-relaxed">
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Dilarang keras menyebarluaskan atau menjual kembali script ini tanpa izin.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary">•</span>
                    <span>Update gratis tersedia selama masa langganan aktif.</span>
                  </li>
                </ul>
              </div>

              {/* AI Product Recommendations Section */}
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

          {/* Checkout Card (Right Column) */}
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
                        <div className="relative">
                          <Input 
                            placeholder="Masukkan Username Github" 
                            value={githubUser}
                            onChange={(e) => setGithubUser(e.target.value)}
                            className="bg-gray-50 border-gray-100 h-11 rounded-lg"
                          />
                        </div>
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

                  <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    Stok Tersedia
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" className="bg-[#566270] hover:bg-[#4a5461] text-white px-4 h-12 rounded-xl">
                      <MessageCircle size={20} />
                    </Button>
                    <Button 
                      onClick={() => addToCart(product, 1)}
                      className="flex-1 bg-[#212529] hover:bg-black text-white h-12 rounded-xl font-bold"
                    >
                      Beli
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Social Icon (GitHub) */}
      <div className="fixed bottom-8 right-8 z-[60] flex items-center justify-center">
        <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 hover:rotate-12 transition-all duration-300 group">
          <Github size={28} />
          {/* Tooltip hint */}
          <div className="absolute right-full mr-4 bg-black text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest shadow-xl">
             Kunjungi Repo
          </div>
        </div>
      </div>
    </div>
  );
}
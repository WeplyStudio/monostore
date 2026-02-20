'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Zap, X, Sparkles, ShoppingBag, QrCode, Download, HelpCircle, AlertCircle, Headphones, MessageSquare, Mail, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/product-card';
import BannerCarousel from '@/components/banner-carousel';
import { CATEGORIES } from '@/lib/data';
import { useApp } from '@/context/app-context';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { getPersonalizedRecommendations } from '@/ai/flows/personalized-recommendations-flow';
import { formatRupiah, getPlaceholderImageDetails, parseDescriptionToHtml, stripDescriptionFormatting } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from '@/components/ui/progress';

export default function HomeView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isRecsLoading, setIsRecsLoading] = useState(true);

  const { addToCart, viewedProducts } = useApp();
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'settings', 'shop');
  }, [db]);

  const { data: settings } = useDoc<any>(settingsRef);
  const shopName = settings?.shopName || 'MonoStore';

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: dbProducts, loading: isProductsLoading } = useCollection(productsQuery);

  const products = (dbProducts as Product[]) || [];

  const flashSaleProducts = useMemo(() => {
    return products.filter(p => 
      p.flashSaleEnd && 
      new Date(p.flashSaleEnd).getTime() > Date.now() &&
      (p.flashSaleStock === undefined || p.flashSaleStock > 0)
    );
  }, [products]);

  useEffect(() => {
    if (products.length === 0) return;

    const fetchRecommendations = async () => {
      setIsRecsLoading(true);
      try {
        const sanitizedProducts = products.map(p => ({
          id: String(p.id),
          name: p.name || '',
          price: p.price || 0,
          originalPrice: p.originalPrice || null,
          category: p.category || '',
          description: p.description || '',
          image: p.image || '',
          rating: p.rating ?? 0,
          reviews: p.reviews || 0,
          sold: p.sold || 0,
          stock: p.stock ?? 0,
          flashSaleStock: p.flashSaleStock || 0,
          flashSaleEnd: p.flashSaleEnd || null,
          isBestSeller: p.isBestSeller || false,
          features: p.features || [],
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
        console.error("AI Recommendation Error:", error);
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

  const purchaseSteps = [
    {
      icon: <ShoppingBag className="text-primary" size={24} />,
      title: "Pilih Template",
      desc: "Temukan template website terbaik yang sesuai dengan kebutuhan bisnis atau proyekmu."
    },
    {
      icon: <QrCode className="text-primary" size={24} />,
      title: "Bayar Instan",
      desc: "Lakukan pembayaran mudah dan aman menggunakan QRIS dari aplikasi e-wallet mana pun."
    },
    {
      icon: <Download className="text-primary" size={24} />,
      title: "Akses Source Code",
      desc: "Dapatkan link unduhan source code secara instan di layar sukses dan dikirim ke email kamu."
    }
  ];

  const faqs = [
    {
      q: `Apa itu ${shopName}?`,
      a: `${shopName} adalah platform penyedia template website premium (React, Next.js, Tailwind) berkualitas tinggi untuk membantu developer dan pebisnis membangun web lebih cepat.`
    },
    {
      q: "Bagaimana cara mendapatkan source code setelah membeli?",
      a: "Setelah pembayaran QRIS terdeteksi otomatis, Anda akan diarahkan ke halaman sukses yang berisi tombol unduh. Selain itu, kami mengirimkan link akses ke email Anda."
    },
    {
      q: "Apakah template ini bisa dikustomisasi?",
      a: "Ya, tentu saja! Anda mendapatkan akses penuh ke source code. Anda bebas mengubah warna, konten, dan fungsionalitas sesuai kebutuhan."
    },
    {
      q: "Dapatkah saya menggunakan template ini untuk proyek klien?",
      a: "Ya! Lisensi kami mengizinkan penggunaan template untuk proyek pribadi maupun komersial milik klien Anda."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20">
      
      {!searchTerm && <BannerCarousel />}

      <div className="text-center mb-10 mt-12 animate-fadeIn">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 tracking-tight font-headline">Pilih Template Website Impianmu</h1>
        <p className="text-muted-foreground mb-8 text-sm md:text-base">Koleksi template website premium yang siap pakai untuk mempercepat bisnis Anda.</p>
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Cari template (misal: SaaS, E-Commerce)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border-none h-14 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-sm md:text-base outline-none"
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

      <div className="mb-20">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-xl font-bold flex items-center gap-2">
             <Zap size={22} className="fill-yellow-400 text-yellow-400" /> 
             {searchTerm ? `Hasil: "${searchTerm}"` : 'Template Terpopuler'}
           </h2>
           {(searchTerm || selectedCategory !== 'Semua') && (
             <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setSelectedCategory('Semua'); }} className="text-destructive hover:text-destructive font-bold text-xs">
               <X size={14} className="mr-1"/> Reset
             </Button>
           )}
        </div>

        {isProductsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <X size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Template Tidak Ditemukan</h3>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto text-sm">Coba gunakan kata kunci lain atau pilih kategori yang berbeda.</p>
          </div>
        )}
      </div>

      {!searchTerm && flashSaleProducts.length > 0 && (
        <FlashSaleSection products={flashSaleProducts} />
      )}

      {products.length > 0 && !searchTerm && (
        <div className="bg-primary/5 rounded-2xl p-6 md:p-12 border border-primary/10 mb-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
             <div>
               <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">
                 <SafeIcon name="Sparkles" size={14} /> Editor's Choice
               </div>
               <h2 className="text-2xl md:text-3xl font-bold text-foreground font-headline">Rekomendasi Untukmu</h2>
               <p className="text-muted-foreground text-sm mt-2">Pilihan template terbaik yang mungkin sesuai dengan minatmu.</p>
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

      {!searchTerm && (
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-headline mb-4">Proses Pembelian</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">Hanya butuh beberapa detik untuk mendapatkan source code template impianmu.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {purchaseSteps.map((step, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-50 text-center space-y-4 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk-Free Guarantee Section */}
      {!searchTerm && (
        <div className="mb-20 bg-white rounded-[2.5rem] p-8 md:p-16 border border-slate-100 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest border border-green-100">
                <ShieldCheck size={16} /> Risk-Free Guarantee
              </div>
              <h2 className="text-4xl md:text-5xl font-bold font-headline leading-[1.1] tracking-tight text-foreground">
                Mulai Proyek Anda, <br />
                <span className="text-primary">Tanpa Keraguan.</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Kami memahami pentingnya source code yang bersih untuk proyek Anda. Itulah mengapa kami memberikan jaminan penuh untuk setiap template yang Anda beli di {shopName}.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button className="h-14 px-10 rounded-2xl font-bold text-lg shadow-2xl shadow-primary/20 hover:-translate-y-1 transition-transform">
                  Mulai Sekarang
                </Button>
                <div className="flex items-center gap-4 px-6 py-3 rounded-2xl border border-slate-100 bg-white shadow-sm">
                   <div className="flex -space-x-3">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 overflow-hidden relative shadow-sm">
                          <img src={`https://picsum.photos/seed/${i+100}/40/40`} alt="user profile" className="w-full h-full object-cover" />
                        </div>
                      ))}
                   </div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] leading-tight">
                      Dipercaya oleh <br/><span className="text-foreground">2,000+ Developer</span>
                   </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: <ShieldCheck className="text-green-500" size={24} />, title: "Garansi Source Code", desc: "Jika file error atau tidak sesuai, kami bantu perbaiki instan." },
                { icon: <Headphones className="text-blue-500" size={24} />, title: "Support Teknis", desc: "Tim kami siap membantu kendala deployment Anda." },
                { icon: <RefreshCw className="text-purple-500" size={24} />, title: "Update Lifetime", desc: "Akses selamanya ke setiap update versi terbaru template." },
                { icon: <Zap className="text-orange-500" size={24} />, title: "Lisensi Komersial", desc: "Template bebas digunakan untuk proyek komersial klien Anda." },
              ].map((item, idx) => (
                <div key={idx} className="p-6 bg-[#F8F9FA] rounded-[2rem] border border-white space-y-4 hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-base mb-1">{item.title}</h4>
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!searchTerm && (
        <div className="max-w-3xl mx-auto mb-20">
          <div className="flex items-center justify-center gap-3 mb-10">
            <HelpCircle size={32} className="text-primary" />
            <h2 className="text-3xl font-bold font-headline">Tanya Jawab</h2>
          </div>
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-50">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-gray-50 last:border-0 py-2">
                  <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline hover:text-primary transition-colors py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed pb-6">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      )}

      {!searchTerm && (
        <div className="mb-20">
          <div className="bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 shadow-2xl shadow-primary/20 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-4">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <Headphones size={32} />
                <h2 className="text-3xl font-bold font-headline">Butuh Bantuan Setup?</h2>
              </div>
              <p className="text-primary-foreground/80 max-w-md text-sm md:text-base">
                Tim dukungan kami siap membantu Anda melakukan deployment template atau menjawab pertanyaan teknis lainnya.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Button 
                variant="secondary" 
                className="h-14 px-8 rounded-2xl font-bold text-primary hover:bg-white"
                onClick={() => window.open('https://wa.me/6288808943176', '_blank')}
              >
                <MessageSquare size={20} className="mr-2" />
                WhatsApp Admin
              </Button>
              <Button 
                variant="outline" 
                className="h-14 px-8 rounded-2xl font-bold bg-transparent border-white/20 hover:bg-white/10 text-white"
                onClick={() => window.location.href = 'mailto:hello@itsjason.my.id'}
              >
                <Mail size={20} className="mr-2" />
                Kirim Email
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const FlashSaleSection = ({ products }: { products: Product[] }) => {
  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });

  useEffect(() => {
    const endTimes = products.map(p => new Date(p.flashSaleEnd).getTime());
    const target = Math.min(...endTimes);

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(timer);
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft({
          h: h.toString().padStart(2, '0'),
          m: m.toString().padStart(2, '0'),
          s: s.toString().padStart(2, '0')
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [products]);

  return (
    <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-slate-100 mb-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        <h2 className="text-2xl font-black text-[#212529] tracking-tight">Crazy Flash Sale</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-10 h-10 bg-[#333] text-white flex items-center justify-center rounded-lg font-bold text-lg">{timeLeft.h}</div>
            <div className="w-10 h-10 bg-[#333] text-white flex items-center justify-center rounded-lg font-bold text-lg">{timeLeft.m}</div>
            <div className="w-10 h-10 bg-[#333] text-white flex items-center justify-center rounded-lg font-bold text-lg">{timeLeft.s}</div>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden md:block" />
          <div className="text-slate-300 font-bold text-xl hidden md:block">19:00</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {products.map(product => {
          const fsStock = product.flashSaleStock || 0;
          const soldCount = product.sold || 0;
          const progressValue = fsStock > 0 
            ? Math.min(100, (soldCount / (soldCount + fsStock)) * 100) 
            : 100;

          return (
            <Link key={product.id} href={`/product/${product.id}`} className="group space-y-3">
              <div className="aspect-square relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                <Image 
                  src={product.image.startsWith('http') ? product.image : getPlaceholderImageDetails(product.image).src} 
                  alt={product.name} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-500" 
                />
                {product.originalPrice && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="relative h-5 w-full bg-red-100 rounded-full overflow-hidden flex items-center px-3">
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500" 
                    style={{ width: `${progressValue}%` }}
                  />
                  <span className="relative z-10 text-[9px] font-black text-white uppercase flex items-center gap-1">
                    {soldCount} Terjual <Zap size={10} className="fill-yellow-400 text-yellow-400" />
                  </span>
                </div>
                <div className="text-lg font-black text-red-600">
                  {formatRupiah(product.price).replace(",00", "")}
                </div>
                <div className="text-[10px] text-slate-400 line-through">
                  {product.originalPrice ? formatRupiah(product.originalPrice).replace(",00", "") : ''}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const RecommendationCard = ({ item, addToCart }: { item: Product; addToCart: (product: Product) => void; }) => {
    const isUrl = typeof item.image === 'string' && item.image.startsWith('http');
    const imageSrc = isUrl ? item.image : getPlaceholderImageDetails(item.image).src;
    const stock = item.stock ?? 0;
    const isOutOfStock = stock <= 0;

    return (
        <Link href={`/product/${item.id}`} className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group overflow-hidden relative ${isOutOfStock ? 'opacity-75' : ''}`}>
            <div className="w-full sm:w-32 aspect-square sm:h-32 bg-slate-50 rounded-xl shrink-0 overflow-hidden relative border border-slate-50">
                <Image src={imageSrc} alt={item.name} fill className={`object-cover group-hover:scale-110 transition-transform duration-500 ${isOutOfStock ? 'grayscale' : ''}`} />
            </div>
            <div className="flex flex-col justify-between flex-1 min-w-0">
                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none text-[9px] h-5 px-2 font-bold uppercase shrink-0">{item.category}</Badge>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest truncate">AI Recommendation</span>
                    </div>
                    <h3 className="font-bold text-foreground text-base sm:text-lg line-clamp-1 leading-tight">{item.name}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed h-8 sm:h-auto overflow-hidden font-normal">
                      {stripDescriptionFormatting(item.description)}
                    </p>
                </div>
                <div className="flex flex-row sm:flex-row items-center justify-between gap-2 mt-4 pt-2 border-t border-slate-50 sm:border-none">
                    <span className={`font-bold text-sm sm:text-base whitespace-nowrap ${isOutOfStock ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                      {formatRupiah(item.price).replace(",00", "")}
                    </span>
                    {!isOutOfStock ? (
                      <Button 
                        variant="ghost" 
                        className="p-0 h-auto text-[11px] sm:text-xs font-black text-primary hover:bg-transparent hover:text-primary/70 shrink-0" 
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(item);
                        }}
                      >
                          + Keranjang
                      </Button>
                    ) : (
                      <span className="text-[10px] font-bold text-destructive uppercase">Stok Habis</span>
                    )}
                </div>
            </div>
        </Link>
    )
}

const RecommendationSkeleton = () => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4">
      <Skeleton className="w-full sm:w-32 aspect-square sm:h-32 rounded-xl shrink-0" />
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

function SafeIcon({ name, size, className }: { name: string, size?: number, className?: string }) {
  const Icon = require('lucide-react')[name];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
}

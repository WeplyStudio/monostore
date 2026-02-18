
'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Star, 
  MessageSquare, 
  Loader2,
  Filter,
  ChevronDown
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

type SortOption = 'terbaru' | 'terlama' | 'tertinggi' | 'terendah';

export default function AllReviewsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const db = useFirestore();
  const id = params?.id as string;
  
  const [sortBy, setSortBy] = useState<SortOption>('terbaru');

  const productRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'products', id);
  }, [db, id]);

  const { data: product, loading: productLoading } = useDoc<any>(productRef);
  
  // Base reviews query - we'll handle sorting in memory for smoother UI interaction
  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'products', id, 'reviews'), orderBy('createdAt', 'desc'));
  }, [db, id]);
  
  const { data: reviews, loading: reviewsLoading } = useCollection<any>(reviewsQuery);

  const sortedReviews = useMemo(() => {
    if (!reviews) return [];
    
    const sorted = [...reviews];
    switch (sortBy) {
      case 'terbaru':
        return sorted.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      case 'terlama':
        return sorted.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      case 'tertinggi':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'terendah':
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted;
    }
  }, [reviews, sortBy]);

  if (productLoading || reviewsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-bold mb-4">Produk tidak ditemukan</h2>
        <Button onClick={() => router.push('/')}>Kembali ke Beranda</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button 
            onClick={() => router.back()} 
            variant="ghost" 
            className="text-sm font-bold hover:bg-transparent px-0"
          >
            <ArrowLeft size={18} className="mr-2" /> Kembali
          </Button>
          <div className="flex flex-col items-center">
             <h1 className="text-sm font-bold truncate max-w-[200px]">{product.name}</h1>
             <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Semua Ulasan</p>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-20">
        
        {/* Header Summary */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
            <div className="text-center md:border-r border-gray-100 md:pr-12">
                <div className="text-5xl font-black text-foreground mb-2">{product.rating}</div>
                <div className="flex gap-1 justify-center mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={18} className={s <= Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                    ))}
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{product.reviews} Total Ulasan</div>
            </div>
            
            <div className="flex-1 w-full space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare size={20} className="text-primary" />
                        <h2 className="text-xl font-bold">Ulasan Pengguna</h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-400" />
                        <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                            <SelectTrigger className="w-[160px] h-10 rounded-xl bg-slate-50 border-none font-bold text-xs">
                                <SelectValue placeholder="Urutkan" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-xl">
                                <SelectItem value="terbaru">Terbaru</SelectItem>
                                <SelectItem value="terlama">Terlama</SelectItem>
                                <SelectItem value="tertinggi">Rating Tertinggi</SelectItem>
                                <SelectItem value="terendah">Rating Terendah</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full cursor-pointer hover:bg-blue-100 transition-colors">Semua</Badge>
                    <Badge variant="outline" className="text-gray-400 font-bold px-3 py-1 rounded-full hover:bg-slate-50 transition-colors">Foto</Badge>
                    <Badge variant="outline" className="text-gray-400 font-bold px-3 py-1 rounded-full hover:bg-slate-50 transition-colors">5 Bintang</Badge>
                    <Badge variant="outline" className="text-gray-400 font-bold px-3 py-1 rounded-full hover:bg-slate-50 transition-colors">4 Bintang</Badge>
                </div>
            </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
            {sortedReviews.length > 0 ? (
                sortedReviews.map((rev: any) => (
                    <div key={rev.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-primary/10">
                                    <AvatarFallback className="bg-primary/5 text-primary font-bold text-lg">{rev.userName?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-bold text-base">{rev.userName}</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                        {rev.createdAt?.toDate ? rev.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Baru saja'}
                                        <span className="w-1 h-1 rounded-full bg-gray-200" />
                                        <span>Pembeli Terverifikasi</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} size={14} className={s <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-100"} />
                                ))}
                            </div>
                        </div>
                        <p className="text-sm md:text-base text-gray-600 leading-relaxed italic border-l-4 border-primary/10 pl-4 py-1">
                          "{rev.comment}"
                        </p>
                    </div>
                ))
            ) : (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                    <MessageSquare size={48} className="mx-auto text-gray-100 mb-4" />
                    <p className="text-sm text-muted-foreground font-bold">Belum ada ulasan untuk ditampilkan.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

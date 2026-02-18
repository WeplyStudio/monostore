
"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Download, Star, Loader2, Send } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function SuccessView() {
  const { setView, formData, lastOrder } = useApp();
  const db = useFirestore();
  const { toast } = useToast();
  const [reviewedItems, setReviewedItems] = useState<Record<string, boolean>>({});
  const [submittingReview, setSubmittingReview] = useState<string | null>(null);

  const handleDownload = (url: string) => {
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      alert("Konten: " + url);
    }
  };

  const handleReviewSubmit = async (productId: string, rating: number, comment: string) => {
    if (!db || !productId || !rating || !comment) return;
    
    setSubmittingReview(productId);
    try {
      const productRef = doc(db, 'products', productId);
      const reviewsRef = collection(db, 'products', productId, 'reviews');
      
      // 1. Tambah Review
      await addDoc(reviewsRef, {
        userName: formData.name || 'User',
        rating,
        comment,
        createdAt: serverTimestamp()
      });

      // 2. Update Rating Produk secara Otomatis
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const productData = productSnap.data();
        const currentRating = productData.rating || 0;
        const currentReviews = productData.reviews || 0;
        
        const newReviewsCount = currentReviews + 1;
        const newRating = ((currentRating * currentReviews) + rating) / newReviewsCount;
        
        await updateDoc(productRef, {
          rating: Number(newRating.toFixed(1)),
          reviews: newReviewsCount
        });
      }

      setReviewedItems(prev => ({ ...prev, [productId]: true }));
      toast({ title: "Terima kasih!", description: "Rating dan review Anda telah disimpan." });
    } catch (error) {
      console.error("Review Error:", error);
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menyimpan review." });
    } finally {
      setSubmittingReview(null);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center py-20 bg-[#F8F9FA]">
      <div className="w-24 h-24 bg-primary text-primary-foreground rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/20 animate-bounce">
        <Check size={48} strokeWidth={3} />
      </div>
      <h2 className="text-3xl font-bold mb-3 text-foreground font-headline">Yeay, Berhasil!</h2>
      <p className="text-muted-foreground mb-10 max-w-md leading-relaxed">
        Transaksi sukses. Kami telah mengirimkan invoice ke{' '}
        <span className="text-foreground font-bold underline decoration-wavy decoration-border">{formData.email}</span>.
      </p>

      {lastOrder && lastOrder.items && (
        <div className="w-full max-w-xl space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 text-left">Aset Digital Anda</h3>
            <div className="space-y-4">
              {lastOrder.items.map((item: any, idx: number) => (
                <div key={idx} className="space-y-4 p-5 bg-[#F8F9FA] rounded-[2rem] border border-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="font-bold text-base">{item.name}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Siap diunduh</div>
                    </div>
                    {item.deliveryContent ? (
                      <Button size="sm" onClick={() => handleDownload(item.deliveryContent)} className="rounded-xl h-10 px-5 font-bold">
                        <Download size={16} className="mr-2" />
                        Unduh
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">Menunggu Link</span>
                    )}
                  </div>

                  {!reviewedItems[item.productId] ? (
                    <ReviewForm 
                      onReview={(rating, comment) => handleReviewSubmit(item.productId, rating, comment)} 
                      isSubmitting={submittingReview === item.productId}
                    />
                  ) : (
                    <div className="bg-green-50 text-green-600 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                      <Check size={14} /> Review Berhasil Dikirim
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <Button onClick={() => setView('home')} variant="ghost" className="rounded-xl px-8 font-bold text-gray-400">
            Kembali ke Beranda
          </Button>
        </div>
      )}
    </div>
  );
}

function ReviewForm({ onReview, isSubmitting }: { onReview: (rating: number, comment: string) => void, isSubmitting: boolean }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  return (
    <div className="pt-4 border-t border-gray-100 space-y-4">
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Beri Rating</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)} className="focus:outline-none transition-transform active:scale-90">
              <Star size={24} className={s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Textarea 
          placeholder="Tuliskan pengalaman Anda..." 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="bg-white border-none rounded-2xl text-sm min-h-[80px] focus-visible:ring-primary/10"
        />
        <Button 
          onClick={() => onReview(rating, comment)} 
          disabled={isSubmitting || !comment.trim()}
          className="w-full rounded-2xl h-11 font-bold"
        >
          {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
          Kirim Review
        </Button>
      </div>
    </div>
  );
}

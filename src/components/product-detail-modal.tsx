"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/app-context';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, ShoppingBag, Share2, Plus, Minus, X } from 'lucide-react';
import { formatRupiah, getPlaceholderImageDetails } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function ProductDetailModal() {
  const { selectedProduct, setSelectedProduct, addToCart } = useApp();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (selectedProduct) {
      setQty(1);
    }
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const handleIncrement = () => setQty(prev => prev + 1);
  const handleDecrement = () => setQty(prev => (prev > 1 ? prev - 1 : 1));

  const imageDetails = getPlaceholderImageDetails(selectedProduct.image);
  const logoPlaceholder = getPlaceholderImageDetails('logo-placeholder');

  return (
    <Dialog open={!!selectedProduct} onOpenChange={(isOpen) => !isOpen && setSelectedProduct(null)}>
      <DialogContent className="max-w-4xl p-0 !rounded-3xl">
        <div className="grid md:grid-cols-2">
          {/* Left: Image */}
          <div className="w-full md:w-full bg-secondary p-8 flex items-center justify-center relative min-h-[300px] md:min-h-[500px] rounded-l-3xl">
             <Image 
                src={imageDetails.src} 
                alt={selectedProduct.name} 
                data-ai-hint={imageDetails.hint}
                width={imageDetails.width}
                height={imageDetails.height}
                className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-3xl shadow-lg"
             />
             <div className="absolute top-6 left-6 flex flex-col gap-2">
               {selectedProduct.isBestSeller && (
                 <Badge className="bg-primary text-primary-foreground text-xs font-bold w-fit flex items-center gap-1 shadow-lg">
                   <TrendingUp size={12}/> Best Seller
                 </Badge>
               )}
               <Badge variant="secondary" className="backdrop-blur text-foreground text-xs font-bold w-fit">
                 {selectedProduct.category}
               </Badge>
             </div>
          </div>

          {/* Right: Info */}
          <div className="w-full md:w-full p-8 flex flex-col">
            <div className="mb-auto">
              <div className="flex items-center gap-2 mb-2">
                 <div className="flex text-yellow-400">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} size={14} className={i < Math.floor(selectedProduct.rating) ? "fill-current" : "text-gray-300"} />
                   ))}
                 </div>
                 <span className="text-sm text-muted-foreground font-medium">({selectedProduct.reviews} Reviews)</span>
                 <span className="text-gray-300">•</span>
                 <span className="text-sm text-muted-foreground">{selectedProduct.sold}+ Terjual</span>
              </div>
              
              <DialogTitle className="text-3xl font-bold text-foreground mb-4 leading-tight">{selectedProduct.name}</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed mb-6">{selectedProduct.description}</DialogDescription>
              
              <Separator className="my-6" />

              <div className="mb-6">
                 <h3 className="text-2xl font-bold text-foreground">
                    {formatRupiah(selectedProduct.price * qty)}
                 </h3>
                 {qty > 1 && <p className="text-sm text-muted-foreground mt-1">({formatRupiah(selectedProduct.price)} each)</p>}
              </div>

              <div className="mb-8">
                  <h4 className="text-sm font-bold text-foreground uppercase mb-3">Jumlah (Licence)</h4>
                  <div className="flex items-center justify-between p-1 bg-secondary rounded-xl border border-border/50 max-w-[160px]">
                      <Button onClick={handleDecrement} size="icon" variant="ghost" className="rounded-lg text-muted-foreground hover:text-foreground">
                          <Minus size={18} />
                      </Button>
                      <span className="font-bold text-lg text-foreground w-8 text-center">{qty}</span>
                      <Button onClick={handleIncrement} size="icon" className="rounded-lg bg-background text-foreground hover:bg-background/80 shadow-sm">
                          <Plus size={18} />
                      </Button>
                  </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4 pt-6 border-t">
               <Button variant="outline" size="icon" className="px-3" onClick={() => alert("Share feature simulation")}>
                 <Share2 size={18}/>
               </Button>
               <Button 
                 onClick={() => addToCart(selectedProduct, qty)} 
                 className="flex-1 rounded-xl shadow-lg shadow-primary/20"
               >
                 <ShoppingBag size={18} /> Tambah ke Keranjang ({qty})
               </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

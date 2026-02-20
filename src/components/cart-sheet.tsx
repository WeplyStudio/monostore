"use client";

import Image from 'next/image';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { formatRupiah, getPlaceholderImageDetails } from '@/lib/utils';
import type { CartItem } from '@/lib/types';

export default function CartSheet() {
  const { isCartOpen, setIsCartOpen, cart, removeFromCart, cartTotal, totalItems, setView } = useApp();

  const handleCheckout = () => {
    setIsCartOpen(false);
    setView('checkout');
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>Keranjang ({totalItems})</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="px-6 py-4">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground text-sm py-24">
                <p>Keranjang kosong.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => <CartItemCard key={item.id} item={item} onRemove={removeFromCart} />)}
              </div>
            )}
          </div>
        </ScrollArea>
        {cart.length > 0 && (
          <SheetFooter className="bg-secondary/50 p-6 sm:flex-col sm:space-x-0">
            <div className="flex justify-between font-bold mb-4 text-lg">
              <span>Total</span>
              <span>{formatRupiah(cartTotal)}</span>
            </div>
            <Button onClick={handleCheckout} className="w-full rounded-xl shadow-lg shadow-primary/20">
              Checkout
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CartItemCard({ item, onRemove }: { item: CartItem, onRemove: (id: string | number) => void }) {
  const isUrl = typeof item.image === 'string' && item.image.startsWith('http');
  const imageSrc = isUrl ? item.image : getPlaceholderImageDetails(item.image).src;
  const imageHint = !isUrl ? getPlaceholderImageDetails(item.image).hint : '';

  return (
    <div className="flex gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border group">
      <div className="w-16 h-16 bg-secondary rounded-lg shrink-0 relative overflow-hidden">
        <Image src={imageSrc} alt={item.name} data-ai-hint={imageHint} fill className="object-cover" />
        {item.quantity > 1 && (
          <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm ring-2 ring-background">
            {item.quantity}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
          <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground hover:text-destructive" onClick={() => onRemove(item.id)}>
            <Trash2 size={14} />
            <span className="sr-only">Remove item</span>
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mb-1">{item.category}</div>
        <div className="flex justify-between items-end">
          <div className="font-bold text-sm">{formatRupiah(item.price * item.quantity).replace(",00", "")}</div>
          {item.quantity > 1 && <div className="text-xs text-muted-foreground">@{formatRupiah(item.price).replace(",00", "")}</div>}
        </div>
      </div>
    </div>
  );
}
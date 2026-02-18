
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BannerCarousel() {
  const db = useFirestore();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const bannersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'banners'), orderBy('order', 'asc'), limit(10));
  }, [db]);

  const { data: banners, loading } = useCollection<any>(bannersQuery);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    // Auto-slide logic
    const intervalId = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000); // Slide every 5 seconds

    return () => {
      emblaApi.off('select', onSelect);
      clearInterval(intervalId);
    };
  }, [emblaApi, onSelect]);

  if (loading) {
    return (
      <div className="w-full aspect-[21/9] md:aspect-[3/1] rounded-[2.5rem] overflow-hidden mb-10">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative group mb-10 animate-fadeIn">
      <div className="overflow-hidden rounded-[2.5rem] shadow-xl" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner: any) => (
            <div key={banner.id} className="flex-[0_0_100%] min-w-0 relative aspect-[21/9] md:aspect-[3/1]">
              <a 
                href={banner.link || '#'} 
                target={banner.link?.startsWith('http') ? '_blank' : '_self'}
                className={banner.link ? 'cursor-pointer' : 'cursor-default'}
              >
                <Image
                  src={banner.image}
                  alt={banner.title || 'Promo Banner'}
                  fill
                  className="object-cover"
                  priority
                />
                {banner.title && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 md:p-12">
                    <h2 className="text-white text-xl md:text-4xl font-bold font-headline drop-shadow-md">
                      {banner.title}
                    </h2>
                  </div>
                )}
              </a>
            </div>
          ))}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-white/20 backdrop-blur-md text-white border-none hover:bg-white/40"
            onClick={scrollPrev}
          >
            <ChevronLeft size={24} />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-white/20 backdrop-blur-md text-white border-none hover:bg-white/40"
            onClick={scrollNext}
          >
            <ChevronRight size={24} />
          </Button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_: any, index: number) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${selectedIndex === index ? 'w-8 bg-white' : 'bg-white/40'}`}
                onClick={() => emblaApi?.scrollTo(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

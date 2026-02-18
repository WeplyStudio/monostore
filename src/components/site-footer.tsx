"use client";

import { Instagram, Twitter, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-background pt-12 pb-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold font-headline">M</div>
              <span className="font-bold text-lg tracking-tight">
                mono<span className="text-muted-foreground">store.</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-left">Premium digital assets for modern creators.</p>
          </div>

          <div className="flex gap-2 text-muted-foreground">
            <Button variant="ghost" size="icon" asChild>
              <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href="#" aria-label="Website"><Globe size={20} /></a>
            </Button>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50 text-center text-xs text-muted-foreground">
          <p>&copy; {year} MonoStore Digital Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

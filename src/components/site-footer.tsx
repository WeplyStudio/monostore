
"use client";

import { useState, useEffect } from 'react';
import { Instagram, Twitter, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/app-context';

export default function SiteFooter() {
  const [mounted, setMounted] = useState(false);
  const { settings, isDataLoading } = useApp();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentYear = new Date().getFullYear();
  const shopName = settings?.shopName || 'MonoStore';

  return (
    <footer className="border-t border-border/50 bg-background pt-12 pb-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              {!mounted || isDataLoading ? (
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              ) : (
                <span className="font-bold text-xl tracking-tight">
                  {shopName.toLowerCase()}<span className="text-primary">.</span>
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-left">Template website premium untuk bisnis dan kreator modern.</p>
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
          <p>&copy; <span suppressHydrationWarning>{mounted ? currentYear : '2025'}</span> {shopName} Digital Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { Product, CartItem, Voucher } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';

type AppContextType = {
  view: string;
  setView: (view: string) => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (id: number | string) => void;
  cartTotal: number;
  cartSubtotal: number;
  discountTotal: number;
  totalItems: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  formData: any;
  setFormData: (data: any) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetCart: () => void;
  viewedProducts: Product[];
  addViewedProduct: (product: Product) => void;
  lastOrder: any;
  setLastOrder: (order: any) => void;
  paymentData: any;
  setPaymentData: (data: any) => void;
  activeVoucher: Voucher | null;
  applyVoucher: (voucher: Voucher) => void;
  removeVoucher: () => void;
  isInitialLoading: boolean;
  setIsInitialLoading: (loading: boolean) => void;
  loadingProgress: number;
  settings: any;
  dbProducts: Product[];
  isDataLoading: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [view, setView] = useState('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [viewedProducts, setViewedProducts] = useState<Product[]>([]);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [activeVoucher, setActiveVoucher] = useState<Voucher | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { toast } = useToast();
  const db = useFirestore();

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    whatsapp: '',
  });

  // Fetch critical data globally
  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'settings', 'shop');
  }, [db]);

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: settings, loading: settingsLoading } = useDoc<any>(settingsRef);
  const { data: dbProducts, loading: productsLoading } = useCollection<Product>(productsQuery);

  const isDataLoading = settingsLoading || productsLoading;

  // Real progress logic synced with data loading
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    if (isInitialLoading) {
      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          // Slowly climb to 95% if data is still loading
          if (isDataLoading) {
            if (prev < 90) return prev + 1;
            if (prev < 95) return prev + 0.5;
            return prev;
          }
          // Quickly finish to 100% when data is ready
          if (prev < 100) return prev + 5;
          return 100;
        });
      }, 50);
    }

    return () => clearInterval(progressInterval);
  }, [isDataLoading, isInitialLoading]);

  // Hide splash screen only when progress is 100 and data is ready
  useEffect(() => {
    if (loadingProgress >= 100 && !isDataLoading) {
      const timeout = setTimeout(() => {
        setIsInitialLoading(false);
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [loadingProgress, isDataLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const addViewedProduct = useCallback((product: Product) => {
    if (product && !viewedProducts.find(p => p.id === product.id)) {
        setViewedProducts(prev => [...prev, product]);
    }
  }, [viewedProducts]);

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
    toast({
      title: `${product.name} ditambahkan`,
      description: `Jumlah: ${quantity}`,
    })
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string | number) => {
    setCart(cart.filter(item => item.id !== id));
  };
  
  const resetCart = () => {
    setCart([]);
    setActiveVoucher(null);
  }

  const applyVoucher = (voucher: Voucher) => {
    setActiveVoucher(voucher);
    toast({ title: "Voucher Berhasil!", description: `Diskon diterapkan: ${voucher.code}` });
  };

  const removeVoucher = () => {
    setActiveVoucher(null);
  };

  const cartSubtotal = useMemo(() => cart.reduce((total, item) => total + (item.price * item.quantity), 0), [cart]);
  
  const discountTotal = useMemo(() => {
    if (!activeVoucher) return 0;
    if (cartSubtotal < activeVoucher.minPurchase) return 0;

    if (activeVoucher.type === 'percentage') {
      return (cartSubtotal * activeVoucher.value) / 100;
    } else {
      return activeVoucher.value;
    }
  }, [activeVoucher, cartSubtotal]);

  const cartTotal = Math.max(0, cartSubtotal - discountTotal);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const value = {
    view,
    setView,
    cart,
    addToCart,
    removeFromCart,
    cartTotal,
    cartSubtotal,
    discountTotal,
    totalItems,
    isCartOpen,
    setIsCartOpen,
    formData,
    setFormData,
    handleInputChange,
    resetCart,
    viewedProducts,
    addViewedProduct,
    lastOrder,
    setLastOrder,
    paymentData,
    setPaymentData,
    activeVoucher,
    applyVoucher,
    removeVoucher,
    isInitialLoading,
    setIsInitialLoading,
    loadingProgress,
    settings,
    dbProducts,
    isDataLoading
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};


"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { Product, CartItem, Voucher, Bundle, PaymentKey } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, where, getDocs, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';

type AppContextType = {
  view: string;
  setView: (view: string) => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (id: number | string) => void;
  cartTotal: number;
  cartSubtotal: number;
  discountTotal: number;
  bundleDiscountTotal: number;
  totalItems: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  formData: any;
  setFormData: (data: any) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetCart: () => void;
  lastOrder: any;
  setLastOrder: (order: any) => void;
  paymentData: any;
  setPaymentData: (data: any) => void;
  activeVoucher: Voucher | null;
  applyVoucher: (voucher: Voucher) => void;
  removeVoucher: () => void;
  isInitialLoading: boolean;
  loadingProgress: number;
  settings: any;
  activePaymentKey: PaymentKey | null;
  setActivePaymentKey: (key: PaymentKey | null) => void;
  fetchPaymentKey: (keyString: string) => Promise<PaymentKey | null>;
  generateNewPaymentKey: () => Promise<PaymentKey>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [view, setView] = useState('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [activeVoucher, setActiveVoucher] = useState<Voucher | null>(null);
  const [activePaymentKey, setActivePaymentKey] = useState<PaymentKey | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { toast } = useToast();
  const db = useFirestore();

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    whatsapp: '',
  });

  // Persist Payment Key
  useEffect(() => {
    const savedKey = localStorage.getItem('mono_payment_key');
    if (savedKey && db) {
      fetchPaymentKey(savedKey).then(k => {
        if (k) setActivePaymentKey(k);
      });
    }
  }, [db]);

  useEffect(() => {
    if (activePaymentKey) {
      localStorage.setItem('mono_payment_key', activePaymentKey.key);
    } else {
      localStorage.removeItem('mono_payment_key');
    }
  }, [activePaymentKey]);

  const fetchPaymentKey = async (keyString: string) => {
    if (!db) return null;
    const q = query(collection(db, 'payment_keys'), where('key', '==', keyString.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const data = snap.docs[0].data();
    return { ...data, id: snap.docs[0].id } as PaymentKey;
  };

  const generateNewPaymentKey = async () => {
    if (!db) throw new Error("Firestore not initialized");
    const randomKey = `MONO-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const payload = {
      key: randomKey,
      balance: 0,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'payment_keys'), payload);
    const newKey = { ...payload, id: docRef.id } as any;
    setActivePaymentKey(newKey);
    return newKey;
  };

  // Global Sync
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'shop') : null, [db]);
  const bundlesQuery = useMemoFirebase(() => db ? query(collection(db, 'bundles'), where('isActive', '==', true)) : null, [db]);

  const { data: settings, loading: settingsLoading } = useDoc<any>(settingsRef);
  const { data: bundles, loading: bundlesLoading } = useCollection<Bundle>(bundlesQuery);

  const isDataLoading = settingsLoading || bundlesLoading;

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    if (isInitialLoading) {
      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (isDataLoading) {
            if (prev < 90) return prev + 1;
            return prev;
          }
          if (prev < 100) return prev + 5;
          return 100;
        });
      }, 50);
    }
    return () => clearInterval(progressInterval);
  }, [isDataLoading, isInitialLoading]);

  useEffect(() => {
    if (loadingProgress >= 100 && !isDataLoading) {
      setTimeout(() => setIsInitialLoading(false), 400);
    }
  }, [loadingProgress, isDataLoading]);

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      return [...prev, { ...product, quantity }];
    });
    toast({ title: `${product.name} ditambahkan` });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string | number) => setCart(cart.filter(i => i.id !== id));
  const resetCart = () => { setCart([]); setActiveVoucher(null); };

  const applyVoucher = (voucher: Voucher) => {
    setActiveVoucher(voucher);
    toast({ title: "Voucher Berhasil!", description: voucher.code });
  };

  const cartSubtotal = useMemo(() => cart.reduce((total, item) => total + (item.price * item.quantity), 0), [cart]);
  const bundleDiscountTotal = useMemo(() => {
    if (!bundles) return 0;
    let total = 0;
    const pids = cart.map(i => i.id);
    bundles.forEach(b => {
      if (b.productIds.every(pid => pids.includes(pid))) {
        const items = cart.filter(i => b.productIds.includes(i.id));
        const price = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        total += (price * (b.discountPercentage / 100));
      }
    });
    return total;
  }, [cart, bundles]);

  const discountTotal = useMemo(() => {
    if (!activeVoucher || cartSubtotal < activeVoucher.minPurchase) return 0;
    return activeVoucher.type === 'percentage' ? (cartSubtotal * activeVoucher.value) / 100 : activeVoucher.value;
  }, [activeVoucher, cartSubtotal]);

  const cartTotal = Math.max(0, cartSubtotal - bundleDiscountTotal - discountTotal);
  const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <AppContext.Provider value={{
      view, setView, cart, addToCart, removeFromCart, cartTotal, cartSubtotal,
      discountTotal, bundleDiscountTotal, totalItems, isCartOpen, setIsCartOpen,
      formData, setFormData, handleInputChange: (e) => setFormData({...formData, [e.target.name]: e.target.value}),
      resetCart, lastOrder, setLastOrder, paymentData, setPaymentData,
      activeVoucher, applyVoucher, removeVoucher: () => setActiveVoucher(null),
      isInitialLoading, loadingProgress, settings, activePaymentKey, setActivePaymentKey,
      fetchPaymentKey, generateNewPaymentKey
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

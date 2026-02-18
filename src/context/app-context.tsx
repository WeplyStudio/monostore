
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Product, CartItem } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"

type AppContextType = {
  view: string;
  setView: (view: string) => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (id: number | string) => void;
  cartTotal: number;
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
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [view, setView] = useState('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [viewedProducts, setViewedProducts] = useState<Product[]>([]);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    whatsapp: '',
    githubUser: '',
    cardNumber: '',
    exp: '',
    cvc: ''
  });

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
      title: `${product.name} ditambahkan ke keranjang`,
      description: `Jumlah: ${quantity}`,
    })
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string | number) => {
    setCart(cart.filter(item => item.id !== id));
  };
  
  const resetCart = () => {
    setCart([]);
  }

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const value = {
    view,
    setView,
    cart,
    addToCart,
    removeFromCart,
    cartTotal,
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
    setPaymentData
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

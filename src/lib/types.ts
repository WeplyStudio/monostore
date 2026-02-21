
export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  rating: number;
  reviews: number;
  sold: number;
  stock: number;
  flashSaleStock?: number;
  isBestSeller: boolean;
  description: string;
  features: string[];
  image: string;
  imageHint?: string;
  deliveryContent?: string;
  flashSaleEnd?: string | any;
  createdAt?: any;
  updatedAt?: any;
};

export type PaymentKey = {
  id: string;
  key: string;
  email: string;
  balance: number;
  is2SVEnabled?: boolean;
  createdAt: any;
};

export type WalletTransaction = {
  id: string;
  paymentKeyId: string;
  amount: number;
  type: 'topup' | 'purchase';
  description: string;
  createdAt: any;
};

export type Bundle = {
  id: string;
  name: string;
  productIds: string[];
  discountPercentage: number;
  isActive: boolean;
  createdAt?: any;
};

export type Voucher = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
  isActive: boolean;
  expiryDate?: any;
};

export type CartItem = Product & {
  quantity: number;
};

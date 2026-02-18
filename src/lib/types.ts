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

export type Voucher = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
  isActive: boolean;
  expiryDate?: any;
};

export type Recommendation = {
    id: string;
    name: string;
    price: number;
    category: string;
    desc: string;
    image: string;
    imageHint?: string;
};

export type CartItem = Product & {
  quantity: number;
};
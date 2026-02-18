export type Product = {
  id: string; // Changed to string for Firestore ID compatibility
  name: string;
  price: number;
  category: string;
  rating: number;
  reviews: number;
  sold: number;
  isBestSeller: boolean;
  description: string;
  features: string[];
  image: string;
  imageHint?: string;
  deliveryContent?: string; // Menambahkan link/file produk digital
  createdAt?: any;
  updatedAt?: any;
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

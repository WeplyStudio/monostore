export type Product = {
  id: number;
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
};

export type Recommendation = {
    id: number;
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

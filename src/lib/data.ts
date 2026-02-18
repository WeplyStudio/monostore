import type { Product, Recommendation } from '@/lib/types';

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Minimalist Icons v2",
    price: 150000,
    category: "Icons",
    rating: 4.8,
    reviews: 124,
    sold: 1200,
    stock: 50,
    isBestSeller: true,
    description: "Koleksi 200+ ikon vektor minimalis yang dirancang pixel-perfect. Cocok untuk desain UI aplikasi modern.",
    features: ["200+ Icons", "SVG & PNG", "File Figma", "Update Gratis"],
    image: "1",
    imageHint: "minimalist icons"
  },
  {
    id: "2",
    name: "Notion Life OS",
    price: 249000,
    category: "Productivity",
    rating: 5.0,
    reviews: 89,
    sold: 850,
    stock: 100,
    isBestSeller: true,
    description: "Sistem manajemen hidup lengkap di Notion. Atur tugas, kebiasaan, keuangan, dan tujuan jangka panjang dalam satu tempat.",
    features: ["Dashboard Utama", "Habit Tracker", "Finance Tracker", "Mobile Friendly"],
    image: "2",
    imageHint: "notion template"
  },
  {
    id: "3",
    name: "Moody Lightroom",
    price: 99000,
    category: "Photography",
    rating: 4.5,
    reviews: 45,
    sold: 400,
    stock: 200,
    isBestSeller: false,
    description: "10 preset Lightroom profesional untuk memberikan nuansa cinematic, moody, dan elegan pada foto Anda.",
    features: ["10 File XMP", "DNG Mobile", "Panduan Instalasi"],
    image: "3",
    imageHint: "moody photography"
  },
  {
    id: "4",
    name: "Figma Design Sys",
    price: 499000,
    category: "Design",
    rating: 4.9,
    reviews: 210,
    sold: 2100,
    stock: 30,
    isBestSeller: true,
    description: "Sistem desain skala besar untuk Figma. Mempercepat alur kerja UI/UX Anda dengan ribuan komponen siap pakai.",
    features: ["Auto Layout", "Variables", "Dark Mode Ready", "2000+ Komponen"],
    image: "4",
    imageHint: "design system"
  },
  {
    id: "5",
    name: "React Starter Pro",
    price: 350000,
    category: "Development",
    rating: 4.7,
    reviews: 32,
    sold: 320,
    stock: 15,
    isBestSeller: false,
    description: "Boilerplate React.js premium dengan konfigurasi modern. Sudah termasuk Tailwind CSS dan Redux.",
    features: ["TypeScript", "Vite", "Jest Testing", "SEO Optimized"],
    image: "5",
    imageHint: "react code"
  },
  {
    id: "6",
    name: "Mastery CSS Book",
    price: 120000,
    category: "Education",
    rating: 4.6,
    reviews: 67,
    sold: 550,
    stock: 500,
    isBestSeller: false,
    description: "E-book panduan lengkap menguasai CSS dari dasar hingga teknik tingkat lanjut seperti Grid dan Flexbox.",
    features: ["PDF & EPUB", "Source Code", "Studi Kasus"],
    image: "6",
    imageHint: "css book"
  },
  {
    id: "7",
    name: "3D Blender Assets",
    price: 299000,
    category: "3D Model",
    rating: 4.8,
    reviews: 15,
    sold: 150,
    stock: 40,
    isBestSeller: false,
    description: "Paket aset 3D low-poly untuk game atau ilustrasi. Berisi berbagai objek lingkungan dan karakter.",
    features: ["File .blend", "FBX & OBJ", "Termasuk Tekstur"],
    image: "7",
    imageHint: "3d assets"
  },
  {
    id: "8",
    name: "Procreate Brushes",
    price: 85000,
    category: "Illustration",
    rating: 4.9,
    reviews: 156,
    sold: 900,
    stock: 300,
    isBestSeller: true,
    description: "Set brush Procreate untuk ilustrator digital. Mencakup brush tekstur, inking, sketsa, dan gouache.",
    features: ["20 Brushes", "High Res", "Pressure Sensitive"],
    image: "8",
    imageHint: "procreate brushes"
  }
];

export const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "101",
    name: "Ultimate Font Bundle",
    price: 450000,
    category: "Typography",
    desc: "Koleksi 50 font sans-serif premium untuk desain profesional.",
    image: "9",
    imageHint: "font typography"
  },
  {
    id: "102",
    name: "SaaS Dashboard UI",
    price: 320000,
    category: "UI Kit",
    desc: "Template dashboard siap pakai untuk aplikasi SaaS Anda.",
    image: "10",
    imageHint: "dashboard ui"
  }
];

export const CATEGORIES = ['Semua', 'Icons', 'Productivity', 'Design', 'Development', 'Photography', '3D Model', 'Education', 'Illustration'];

import type { Product, Recommendation } from '@/lib/types';

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Modern Landing Page React",
    price: 450000,
    category: "Landing Page",
    rating: 4.9,
    reviews: 124,
    sold: 1200,
    stock: 50,
    isBestSeller: true,
    description: "Template landing page modern menggunakan React dan Tailwind CSS. Sangat cepat, SEO friendly, dan mudah dikustomisasi.",
    features: ["Responsive Design", "Dark Mode", "Figma File included", "Clean Code"],
    image: "1",
    imageHint: "landing page react"
  },
  {
    id: "2",
    name: "SaaS Dashboard Next.js",
    price: 899000,
    category: "SaaS",
    rating: 5.0,
    reviews: 89,
    sold: 850,
    stock: 100,
    isBestSeller: true,
    description: "Template dashboard SaaS lengkap dengan autentikasi, integrasi database, dan chart interaktif.",
    features: ["Next.js 15", "App Router", "Stripe Ready", "Admin Panel"],
    image: "2",
    imageHint: "saas dashboard"
  },
  {
    id: "3",
    name: "Portfolio Template Tailwind",
    price: 199000,
    category: "Portfolio",
    rating: 4.7,
    reviews: 45,
    sold: 400,
    stock: 200,
    isBestSeller: false,
    description: "Tunjukkan karya terbaik Anda dengan template portfolio yang elegan dan minimalis.",
    features: ["Easy Setup", "Animated Scroll", "Contact Form", "Mobile First"],
    image: "3",
    imageHint: "portfolio website"
  },
  {
    id: "4",
    name: "E-Commerce Web Template",
    price: 1250000,
    category: "E-Commerce",
    rating: 4.9,
    reviews: 210,
    sold: 2100,
    stock: 30,
    isBestSeller: true,
    description: "Solusi toko online profesional dengan fitur keranjang, checkout, dan manajemen produk.",
    features: ["Shopping Cart", "Product Search", "Inventory Sync", "Payment Ready"],
    image: "4",
    imageHint: "ecommerce web"
  },
  {
    id: "5",
    name: "Company Profile Template",
    price: 350000,
    category: "Business",
    rating: 4.8,
    reviews: 32,
    sold: 320,
    stock: 15,
    isBestSeller: false,
    description: "Template profil perusahaan yang profesional untuk membangun kepercayaan klien Anda.",
    features: ["Multi Page", "Service Layout", "Team Section", "Google Maps"],
    image: "5",
    imageHint: "company profile"
  },
  {
    id: "6",
    name: "Personal Blog Template",
    price: 150000,
    category: "Blog",
    rating: 4.6,
    reviews: 67,
    sold: 550,
    stock: 500,
    isBestSeller: false,
    description: "Bagikan tulisan Anda dengan template blog yang nyaman dibaca dan dioptimalkan untuk SEO.",
    features: ["Markdown Support", "Category Filter", "Newsletter Box", "Fast Loading"],
    image: "6",
    imageHint: "blog website"
  },
  {
    id: "7",
    name: "Real Estate Web Template",
    price: 750000,
    category: "Business",
    rating: 4.8,
    reviews: 15,
    sold: 150,
    stock: 40,
    isBestSeller: false,
    description: "Template website properti dengan fitur filter lokasi, harga, dan tipe properti.",
    features: ["Property Listing", "Agent Profile", "Lead Form", "Map View"],
    image: "7",
    imageHint: "real estate web"
  },
  {
    id: "8",
    name: "App Showcase Landing Page",
    price: 299000,
    category: "Landing Page",
    rating: 4.9,
    reviews: 156,
    sold: 900,
    stock: 300,
    isBestSeller: true,
    description: "Promosikan aplikasi mobile Anda dengan landing page yang menarik dan konversi tinggi.",
    features: ["Feature List", "Device Mockups", "Store Links", "Testimonials"],
    image: "8",
    imageHint: "app showcase"
  }
];

export const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "101",
    name: "Course Platform Template",
    price: 950000,
    category: "Education",
    desc: "Bangun platform belajar online Anda sendiri dengan template LMS yang lengkap.",
    image: "9",
    imageHint: "education web"
  },
  {
    id: "102",
    name: "Agency Web Template",
    price: 420000,
    category: "Business",
    desc: "Template website agensi kreatif dengan desain yang bold dan berani.",
    image: "10",
    imageHint: "agency website"
  }
];

export const CATEGORIES = ['Semua', 'Landing Page', 'SaaS', 'Portfolio', 'E-Commerce', 'Business', 'Blog', 'Education'];

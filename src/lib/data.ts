import type { Product, Recommendation } from '@/lib/types';

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Minimalist Icons v2",
    price: 150000,
    category: "Icons",
    rating: 4.8,
    reviews: 124,
    sold: 1200,
    isBestSeller: true,
    description: "A collection of 200+ pixel-perfect minimalist vector icons. Perfect for modern application UI design.",
    features: ["200+ Icons", "SVG & PNG", "Figma File", "Free Update"],
    image: "1",
    imageHint: "minimalist icons"
  },
  {
    id: 2,
    name: "Notion Life OS",
    price: 249000,
    category: "Productivity",
    rating: 5.0,
    reviews: 89,
    sold: 850,
    isBestSeller: true,
    description: "A complete life management system in Notion. Organize tasks, habits, finances, and long-term goals.",
    features: ["Main Dashboard", "Habit Tracker", "Finance Tracker", "Mobile Friendly"],
    image: "2",
    imageHint: "notion template"
  },
  {
    id: 3,
    name: "Moody Lightroom",
    price: 99000,
    category: "Photography",
    rating: 4.5,
    reviews: 45,
    sold: 400,
    isBestSeller: false,
    description: "10 professional Lightroom presets to give your photos a cinematic, moody, and elegant feel.",
    features: ["10 XMP Files", "DNG Mobile", "Installation Guide"],
    image: "3",
    imageHint: "moody photography"
  },
  {
    id: 4,
    name: "Figma Design Sys",
    price: 499000,
    category: "Design",
    rating: 4.9,
    reviews: 210,
    sold: 2100,
    isBestSeller: true,
    description: "A large-scale design system for Figma. Speed up your UI/UX workflow with thousands of components.",
    features: ["Auto Layout", "Variables", "Dark Mode Ready", "2000+ Components"],
    image: "4",
    imageHint: "design system"
  },
  {
    id: 5,
    name: "React Starter Pro",
    price: 350000,
    category: "Development",
    rating: 4.7,
    reviews: 32,
    sold: 320,
    isBestSeller: false,
    description: "A premium React.js boilerplate with a modern setup. Includes Tailwind CSS and Redux.",
    features: ["TypeScript", "Vite", "Jest Testing", "SEO Optimized"],
    image: "5",
    imageHint: "react code"
  },
  {
    id: 6,
    name: "Mastery CSS Book",
    price: 120000,
    category: "Education",
    rating: 4.6,
    reviews: 67,
    sold: 550,
    isBestSeller: false,
    description: "A complete e-book guide to mastering CSS from basics to advanced techniques like Grid and Flexbox.",
    features: ["PDF & EPUB", "Source Code", "Case Studies"],
    image: "6",
    imageHint: "css book"
  },
  {
    id: 7,
    name: "3D Blender Assets",
    price: 299000,
    category: "3D Model",
    rating: 4.8,
    reviews: 15,
    sold: 150,
    isBestSeller: false,
    description: "A pack of low-poly 3D assets for games or illustrations. Contains various environment and character objects.",
    features: [".blend files", "FBX & OBJ", "Texture included"],
    image: "7",
    imageHint: "3d assets"
  },
  {
    id: 8,
    name: "Procreate Brushes",
    price: 85000,
    category: "Illustration",
    rating: 4.9,
    reviews: 156,
    sold: 900,
    isBestSeller: true,
    description: "A set of Procreate brushes for digital illustrators. Includes texture, inking, sketching, and gouache brushes.",
    features: ["20 Brushes", "High Res", "Pressure Sensitive"],
    image: "8",
    imageHint: "procreate brushes"
  }
];

export const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 101,
    name: "Ultimate Font Bundle",
    price: 450000,
    category: "Typography",
    desc: "Bundle of 50 premium sans-serif fonts.",
    image: "9",
    imageHint: "font typography"
  },
  {
    id: 102,
    name: "SaaS Dashboard UI",
    price: 320000,
    category: "UI Kit",
    desc: "Ready-to-use dashboard template.",
    image: "10",
    imageHint: "dashboard ui"
  }
];

export const CATEGORIES = ['Semua', 'Icons', 'Productivity', 'Design', 'Development', 'Photography', '3D Model', 'Education', 'Illustration'];

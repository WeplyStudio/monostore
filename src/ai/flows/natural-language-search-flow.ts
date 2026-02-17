'use server';
/**
 * @fileOverview A Genkit flow for natural language product search.
 *
 * - naturalLanguageProductSearch - A function that handles natural language product search.
 * - NaturalLanguageSearchInput - The input type for the naturalLanguageProductSearch function.
 * - NaturalLanguageSearchOutput - The return type for the naturalLanguageProductSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// NOTE: In a real application, this product data would typically be fetched from a database or API.
// For this example, it's hardcoded based on the provided PRODUCTS array in App.js.
const PRODUCTS = [
  {
    id: 1,
    name: "Minimalist Icons v2",
    price: 150000,
    category: "Icons",
    rating: 4.8,
    reviews: 124,
    sold: 1200,
    isBestSeller: true,
    description: "Koleksi 200+ ikon vektor minimalis yang dirancang pixel-perfect. Cocok untuk desain UI aplikasi modern.",
    features: ["200+ Icons", "SVG & PNG", "Figma File", "Free Update"],
    image: "/api/placeholder/400/400"
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
    description: "Sistem manajemen hidup lengkap di Notion. Atur tugas, kebiasaan, keuangan, dan tujuan jangka panjang.",
    features: ["Dashboard Utama", "Habit Tracker", "Finance Tracker", "Mobile Friendly"],
    image: "/api/placeholder/400/400"
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
    description: "10 Preset Lightroom profesional untuk memberikan nuansa cinematic, moody, dan elegan pada foto Anda.",
    features: ["10 XMP Files", "DNG Mobile", "Panduan Instalasi"],
    image: "/api/placeholder/400/400"
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
    description: "Sistem desain skala besar untuk Figma. Mempercepat alur kerja UI/UX Anda dengan ribuan komponen.",
    features: ["Auto Layout", "Variables", "Dark Mode Ready", "2000+ Components"],
    image: "/api/placeholder/400/400"
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
    description: "Boilerplate React.js premium dengan konfigurasi modern. Sudah termasuk Tailwind CSS dan Redux.",
    features: ["TypeScript", "Vite", "Jest Testing", "SEO Optimized"],
    image: "/api/placeholder/400/400"
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
    description: "E-book panduan lengkap menguasai CSS dari dasar hingga teknik tingkat lanjut seperti Grid dan Flexbox.",
    features: ["PDF & EPUB", "Source Code", "Studi Kasus"],
    image: "/api/placeholder/400/400"
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
    description: "Paket aset 3D low-poly untuk game atau ilustrasi. Berisi berbagai objek lingkungan dan karakter.",
    features: [".blend files", "FBX & OBJ", "Texture included"],
    image: "/api/placeholder/400/400"
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
    description: "Set brush Procreate untuk ilustrator digital. Mencakup brush tekstur, inking, sketsa, dan gouache.",
    features: ["20 Brushes", "High Res", "Pressure Sensitive"],
    image: "/api/placeholder/400/400"
  }
];

// Define ProductSchema based on the structure of PRODUCTS
const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  category: z.string(),
  rating: z.number(),
  reviews: z.number(),
  sold: z.number(),
  isBestSeller: z.boolean(),
  description: z.string(),
  features: z.array(z.string()).optional(),
  image: z.string(),
});

const NaturalLanguageSearchInputSchema = z.object({
  query: z.string().describe('The natural language query describing desired products.'),
});
export type NaturalLanguageSearchInput = z.infer<typeof NaturalLanguageSearchInputSchema>;

const NaturalLanguageSearchOutputSchema = z.object({
  products: z.array(ProductSchema).describe('A list of products that best match the natural language query, ordered by relevance.'),
});
export type NaturalLanguageSearchOutput = z.infer<typeof NaturalLanguageSearchOutputSchema>;

const naturalLanguageSearchPrompt = ai.definePrompt({
  name: 'naturalLanguageSearchPrompt',
  input: {schema: NaturalLanguageSearchInputSchema},
  output: {schema: NaturalLanguageSearchOutputSchema},
  prompt: `You are a highly intelligent product search assistant. Your task is to analyze a user's natural language query and identify the most relevant products from a provided list.

Here is the user's query:
Query: "{{{query}}}"

Here is a JSON array of all available digital products. Each product has an 'id', 'name', 'price', 'category', 'rating', 'reviews', 'sold', 'isBestSeller', 'description', and optional 'features'.
Available Products:
{{{allProductsJson}}}

Based on the user's query, return a JSON array of product objects that are most relevant. Only include products that directly match the user's intent. If no products are relevant, return an empty array. Order the products by relevance, with the most relevant first.`,
});

export async function naturalLanguageProductSearch(input: NaturalLanguageSearchInput): Promise<NaturalLanguageSearchOutput> {
  return naturalLanguageSearchFlow(input);
}

const naturalLanguageSearchFlow = ai.defineFlow(
  {
    name: 'naturalLanguageSearchFlow',
    inputSchema: NaturalLanguageSearchInputSchema,
    outputSchema: NaturalLanguageSearchOutputSchema,
  },
  async (input) => {
    // Stringify the PRODUCTS array to pass it as context to the prompt
    const allProductsJson = JSON.stringify(PRODUCTS, null, 2); // Pretty print for better readability in prompt, though not strictly necessary for LLM

    const {output} = await naturalLanguageSearchPrompt({
      query: input.query,
      allProductsJson: allProductsJson,
    });

    return output!;
  }
);

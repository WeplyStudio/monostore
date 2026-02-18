'use server';

/**
 * @fileOverview A Genkit flow for generating personalized product recommendations.
 *
 * - getPersonalizedRecommendations - A function that handles the personalized product recommendation process.
 * - ProductRecommendationInput - The input type for the getPersonalizedRecommendations function.
 * - ProductRecommendationOutput - The return type for the getPersonalizedRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for a single product. ID is now string to support Firestore IDs.
const ProductDataSchema = z.object({
  id: z.string().describe("The unique identifier of the product."),
  name: z.string(),
  price: z.number(),
  category: z.string(),
  rating: z.number().optional(),
  reviews: z.number().optional(),
  sold: z.number().optional(),
  isBestSeller: z.boolean().optional(),
  description: z.string(),
  features: z.array(z.string()).optional(),
  image: z.string(),
});

// Input schema for the recommendation flow
const ProductRecommendationInputSchema = z.object({
  viewedProductIds: z.array(z.string()).describe("A list of product IDs the user has previously viewed."),
  currentProductId: z.string().optional().describe("The ID of the product the user is currently viewing."),
  allProducts: z.array(ProductDataSchema).describe("A list of all available products in the store."),
});

export type ProductRecommendationInput = z.infer<typeof ProductRecommendationInputSchema>;

// Intermediate output schema for the prompt
const PromptOutputSchema = z.object({
  recommendedProductIds: z.array(
    z.string().describe("The ID of a recommended product.")
  ).max(5).describe("A list of up to 5 product IDs recommended for the user.")
});

// Final output schema for the flow
const ProductRecommendationOutputSchema = z.object({
  recommendations: z.array(ProductDataSchema).describe("A list of up to 5 product recommendations with full details.")
});

export type ProductRecommendationOutput = z.infer<typeof ProductRecommendationOutputSchema>;

// Define the prompt for the recommendation engine
const personalizedRecommendationPrompt = ai.definePrompt({
  name: 'personalizedRecommendationPrompt',
  input: { schema: ProductRecommendationInputSchema },
  output: { schema: PromptOutputSchema },
  prompt: `You are an expert product recommendation system for an e-commerce store called MonoStore.
Your goal is to suggest relevant and interesting digital products to a user based on their history.

User's previously viewed product IDs: {{#if viewedProductIds}}{{{viewedProductIdsJson}}}{{else}}None{{/if}}
User's currently viewed product ID: {{#if currentProductId}}{{{currentProductId}}}{{else}}None{{/if}}

Available products:
[\n{{#each allProducts}}\n  {"id": "{{this.id}}", "name": "{{this.name}}", "category": "{{this.category}}", "description": "{{this.description}}"}\n  {{#unless @last}},{{/unless}}\n{{/each}}\n]

Please recommend up to 5 unique product IDs.
Do not recommend products already in viewedProductIds or the currentProductId.
`
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: ProductRecommendationInputSchema,
    outputSchema: ProductRecommendationOutputSchema,
  },
  async (input) => {
    try {
      const { viewedProductIds, currentProductId, allProducts } = input;

      const { output: promptOutput } = await personalizedRecommendationPrompt({
        viewedProductIds,
        currentProductId,
        allProducts,
        viewedProductIdsJson: JSON.stringify(viewedProductIds),
      });

      if (!promptOutput || !promptOutput.recommendedProductIds) {
        return { recommendations: [] };
      }

      const recommendedIds = promptOutput.recommendedProductIds;
      const recommendations = allProducts.filter(product =>
        recommendedIds.includes(product.id)
      );

      return { recommendations };
    } catch (error) {
      return { recommendations: [] };
    }
  }
);

export async function getPersonalizedRecommendations(
  input: ProductRecommendationInput
): Promise<ProductRecommendationOutput> {
  return personalizedRecommendationsFlow(input);
}

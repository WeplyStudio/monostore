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

// Schema for a single product from the main PRODUCTS list provided by the user
const ProductDataSchema = z.object({
  id: z.number(),
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
  viewedProductIds: z.array(z.number()).describe("A list of product IDs the user has previously viewed."),
  currentProductId: z.number().optional().describe("The ID of the product the user is currently viewing."),
  allProducts: z.array(ProductDataSchema).describe("A list of all available products in the store."),
});

export type ProductRecommendationInput = z.infer<typeof ProductRecommendationInputSchema>;

// Intermediate output schema for the prompt (just the recommended IDs)
const PromptOutputSchema = z.object({
  recommendedProductIds: z.array(
    z.number().describe("The ID of a recommended product.")
  ).max(5).describe("A list of up to 5 product IDs recommended for the user. These IDs must exist in the provided allProducts list and not be in the viewedProductIds or currentProductId.")
});

// Final output schema for the flow (full product objects)
const ProductRecommendationOutputSchema = z.object({
  recommendations: z.array(ProductDataSchema).describe("A list of up to 5 product recommendations with full details.")
});

export type ProductRecommendationOutput = z.infer<typeof ProductRecommendationOutputSchema>;

// Define the prompt for the recommendation engine
const personalizedRecommendationPrompt = ai.definePrompt({
  name: 'personalizedRecommendationPrompt',
  input: { schema: ProductRecommendationInputSchema },
  output: { schema: PromptOutputSchema },
  prompt: `You are an expert product recommendation system for an e-commerce store called MonoStore, which sells digital assets. Your goal is to suggest relevant and interesting products to a user based on their viewing history and current product of interest.

User's previously viewed product IDs: {{#if viewedProductIds}}{{{viewedProductIdsJson}}}{{else}}None{{/if}}
User's currently viewed product ID: {{#if currentProductId}}{{{currentProductId}}}{{else}}None{{/if}}

Here is a list of all available products in the store. Each product object includes its 'id', 'name', 'category', and 'description'.
[\n{{#each allProducts}}\n  {"id": {{this.id}}, "name": "{{this.name}}", "category": "{{this.category}}", "description": "{{this.description}}"}\n  {{#unless @last}},{{/unless}}\n{{/each}}\n]

Please recommend up to 5 unique product IDs from the provided list that the user might be interested in.
Crucially, *do not recommend any products that are already in the \`viewedProductIds\` list or is the \`currentProductId\`*.
Ensure your recommendations are diverse yet relevant to the user's apparent interests.

Output your recommendations strictly as a JSON object containing a \`recommendedProductIds\` array of numbers. For example:
{"recommendedProductIds": [101, 103, 105]}
`
});

// Define the Genkit flow
const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: ProductRecommendationInputSchema,
    outputSchema: ProductRecommendationOutputSchema,
  },
  async (input) => {
    try {
      const { viewedProductIds, currentProductId, allProducts } = input;

      // Call the prompt to get recommended product IDs
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

      // Filter allProducts to get the full details of the recommended products
      const recommendations = allProducts.filter(product =>
        recommendedIds.includes(product.id)
      );

      // Ensure the output matches the schema, even if some IDs weren't found
      return { recommendations };
    } catch (error) {
      // Gracefully handle API errors (like quota exhaustion) by returning no recommendations
      // This allows the client side to use its fallback logic without crashing.
      return { recommendations: [] };
    }
  }
);

/**
 * Generates personalized product recommendations based on user interaction history.
 *
 * @param input - An object containing the user's viewed product IDs, optionally the current product ID, and a list of all available products.
 * @returns An object containing an array of recommended product details.
 */
export async function getPersonalizedRecommendations(
  input: ProductRecommendationInput
): Promise<ProductRecommendationOutput> {
  return personalizedRecommendationsFlow(input);
}

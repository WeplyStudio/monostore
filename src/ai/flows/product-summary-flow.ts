'use server';
/**
 * @fileOverview A Genkit flow for generating a concise summary of a product's description.
 *
 * - summarizeProduct - A function that handles the product summary generation process.
 * - ProductSummaryInput - The input type for the summarizeProduct function.
 * - ProductSummaryOutput - The return type for the summarizeProduct function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductSummaryInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productCategory: z.string().describe('The category of the product.'),
  productDescription: z.string().describe('The detailed description of the product.'),
});
export type ProductSummaryInput = z.infer<typeof ProductSummaryInputSchema>;

const ProductSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary highlighting the product\'s main benefits and potential applications.'),
});
export type ProductSummaryOutput = z.infer<typeof ProductSummaryOutputSchema>;

export async function summarizeProduct(input: ProductSummaryInput): Promise<ProductSummaryOutput> {
  return productSummaryFlow(input);
}

const productSummaryPrompt = ai.definePrompt({
  name: 'productSummaryPrompt',
  input: {schema: ProductSummaryInputSchema},
  output: {schema: ProductSummaryOutputSchema},
  prompt: `You are an AI assistant that summarizes product descriptions for customers. Your goal is to provide a concise summary, highlighting the product's main benefits and potential applications, in a single paragraph.\n\nProduct Name: {{{productName}}}\nCategory: {{{productCategory}}}\nDescription: {{{productDescription}}}\n\nPlease provide a summary focusing on benefits and applications:`,
});

const productSummaryFlow = ai.defineFlow(
  {
    name: 'productSummaryFlow',
    inputSchema: ProductSummaryInputSchema,
    outputSchema: ProductSummaryOutputSchema,
  },
  async (input) => {
    const {output} = await productSummaryPrompt(input);
    return output!;
  }
);

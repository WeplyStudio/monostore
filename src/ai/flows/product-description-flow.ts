
'use server';
/**
 * @fileOverview A Genkit flow for generating AI product descriptions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productCategory: z.string().describe('The category of the product.'),
});
export type ProductDescriptionInput = z.infer<typeof ProductDescriptionInputSchema>;

const ProductDescriptionOutputSchema = z.object({
  description: z.string().describe('A high-converting product description including features and benefits.'),
});
export type ProductDescriptionOutput = z.infer<typeof ProductDescriptionOutputSchema>;

export async function generateProductDescription(input: ProductDescriptionInput): Promise<ProductDescriptionOutput> {
  return productDescriptionFlow(input);
}

const productDescriptionPrompt = ai.definePrompt({
  name: 'productDescriptionPrompt',
  input: {schema: ProductDescriptionInputSchema},
  output: {schema: ProductDescriptionOutputSchema},
  prompt: `You are an expert copywriter for a digital products store. Your goal is to write a high-converting, professional description for a new digital product.

Product Name: {{{productName}}}
Category: {{{productCategory}}}

Requirements:
1. Write 2-3 paragraphs.
2. Highlight main benefits and potential use cases.
3. Use professional and persuasive tone.
4. Use custom formatting: *text* for bold, _text_ for italic, and <b>TITLE<b> for large titles.
5. Focus on how this helps the customer save time or build better software.`,
});

const productDescriptionFlow = ai.defineFlow(
  {
    name: 'productDescriptionFlow',
    inputSchema: ProductDescriptionInputSchema,
    outputSchema: ProductDescriptionOutputSchema,
  },
  async (input) => {
    const {output} = await productDescriptionPrompt(input);
    return output!;
  }
);

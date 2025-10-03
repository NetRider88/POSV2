'use server';

/**
 * @fileOverview A flow to generate API requests based on a scenario description.
 *
 * - generateApiRequest - A function that generates a valid API request for a specific scenario.
 * - GenerateApiRequestInput - The input type for the generateApiRequest function.
 * - GenerateApiRequestOutput - The return type for the generateApiRequest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateApiRequestInputSchema = z.object({
  scenarioDescription: z
    .string()
    .describe('A description of the scenario for which to generate an API request.'),
});
export type GenerateApiRequestInput = z.infer<typeof GenerateApiRequestInputSchema>;

const GenerateApiRequestOutputSchema = z
  .string()
  .describe('A valid API request, with parameters, for the specified scenario.');
export type GenerateApiRequestOutput = z.infer<typeof GenerateApiRequestOutputSchema>;

export async function generateApiRequest(
  input: GenerateApiRequestInput
): Promise<GenerateApiRequestOutput> {
  return generateApiRequestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateApiRequestPrompt',
  input: {schema: GenerateApiRequestInputSchema},
  output: {format: 'json'},
  prompt: `You are an API request generator for the Talabat POS integration.

  Based on the scenario description provided, generate a valid API request, including the correct parameters, to test the specified scenario against the Talabat POSMW endpoints.

  Scenario Description: {{{scenarioDescription}}}

  Ensure that the generated API request is a valid JSON. The entire output should be the JSON object itself.
  Do not include any wrapping text, explanations, or code fences like \`\`\`json. Only output the raw JSON.
  `,
});

const generateApiRequestFlow = ai.defineFlow(
  {
    name: 'generateApiRequestFlow',
    inputSchema: GenerateApiRequestInputSchema,
    outputSchema: GenerateApiRequestOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // The output from the LLM is a JSON object. We need to stringify it to send it to the client.
    return JSON.stringify(output);
  }
);

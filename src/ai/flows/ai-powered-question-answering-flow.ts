'use server';
/**
 * @fileOverview This file defines a Genkit flow for AI-powered question answering
 * using Retrieval Augmented Generation (RAG). It takes a user's question and
 * relevant document context as input, and returns an AI-generated answer
 * with supporting citations. Supports English only.
 *
 * - answerQuestion - A function that handles the AI-powered question answering process.
 * - AIPoweredQuestionAnsweringInput - The input type for the answerQuestion function.
 * - AIPoweredQuestionAnsweringOutput - The return type for the answerQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIPoweredQuestionAnsweringInputSchema = z.object({
  question: z.string().describe('The user\'s question about the indexed documents.'),
  documentContext: z.string().describe('Relevant sections from indexed documents that the AI should use to answer the question.'),
});
export type AIPoweredQuestionAnsweringInput = z.infer<typeof AIPoweredQuestionAnsweringInputSchema>;

const AIPoweredQuestionAnsweringOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the question, based on the provided document context.'),
  citations: z.array(z.string()).describe('A list of text snippets from the document context that directly support the answer.'),
});
export type AIPoweredQuestionAnsweringOutput = z.infer<typeof AIPoweredQuestionAnsweringOutputSchema>;

export async function answerQuestion(input: AIPoweredQuestionAnsweringInput): Promise<AIPoweredQuestionAnsweringOutput> {
  return aiPoweredQuestionAnsweringFlow(input);
}

const aiPoweredQuestionAnsweringPrompt = ai.definePrompt({
  name: 'aiPoweredQuestionAnsweringPrompt',
  input: {schema: AIPoweredQuestionAnsweringInputSchema},
  output: {schema: AIPoweredQuestionAnsweringOutputSchema},
  prompt: `You are an AI assistant tasked with answering questions based *only* on the provided document context.
If the answer cannot be found in the document context, state that you don't have enough information.
Provide a concise answer and include direct citations from the document context to support your answer.

LANGUAGE SUPPORT: You must support only English. Always respond in English.

Document Context:
{{documentContext}}

Question: {{question}}`,
});

const aiPoweredQuestionAnsweringFlow = ai.defineFlow(
  {
    name: 'aiPoweredQuestionAnsweringFlow',
    inputSchema: AIPoweredQuestionAnsweringInputSchema,
    outputSchema: AIPoweredQuestionAnsweringOutputSchema,
  },
  async (input) => {
    const {output} = await aiPoweredQuestionAnsweringPrompt(input);
    return output!;
  }
);

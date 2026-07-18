'use server';
/**
 * @fileOverview A Genkit flow to answer user queries using provided documents and generate citations.
 * Supports English only.
 *
 * - sourceCitationForAIAnswers - A function that handles answering questions with source citations.
 * - SourceCitationForAIAnswersInput - The input type for the sourceCitationForAIAnswers function.
 * - SourceCitationForAIAnswersOutput - The return type for the sourceCitationForAIAnswers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const DocumentSnippetSchema = z.object({
  id: z.string().describe('Unique identifier for the document or document chunk.'),
  title: z.string().describe('The title of the document.'),
  content: z.string().describe('The textual content of the document or chunk.'),
  sourceSection: z.string().optional().describe('The specific section, page, or line number within the document where this content is found.'),
});

const SourceCitationForAIAnswersInputSchema = z.object({
  query: z.string().describe('The user\'s question that needs to be answered.'),
  documents: z.array(DocumentSnippetSchema).describe('An array of relevant document snippets to use as context for answering the query.'),
});
export type SourceCitationForAIAnswersInput = z.infer<typeof SourceCitationForAIAnswersInputSchema>;

// Output Schema
const CitationSchema = z.object({
  documentId: z.string().describe('The ID of the cited document.'),
  documentTitle: z.string().describe('The title of the cited document.'),
  section: z.string().optional().describe('The specific section or page number cited.'),
  textSnippet: z.string().describe('The exact text snippet from the document that supports the answer.'),
});

const SourceCitationForAIAnswersOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the query.'),
  citations: z.array(CitationSchema).describe('A list of citations to the source documents.'),
});
export type SourceCitationForAIAnswersOutput = z.infer<typeof SourceCitationForAIAnswersOutputSchema>;

// Prompt Definition
const prompt = ai.definePrompt({
  name: 'sourceCitationForAIAnswersPrompt',
  input: {schema: SourceCitationForAIAnswersInputSchema},
  output: {schema: SourceCitationForAIAnswersOutputSchema},
  prompt: `You are an expert documentation assistant. Your goal is to answer user queries truthfully and comprehensively based ONLY on the provided document snippets.

LANGUAGE SUPPORT:
You MUST respond ONLY in English. 

CRITICAL INSTRUCTION: Your 'answer' field MUST NOT contain any citations, source markers, footnotes, or references like "[SOURCE: ...]", "[1]", "(Doc 1)", or "Document: ...". The 'answer' should be pure, natural human-readable text. All attribution information must be provided EXCLUSIVELY in the 'citations' array. This is extremely important.

---
Query: {{{query}}}

---
Relevant Documents:
{{#each documents}}
### Document Title: {{{title}}} (ID: {{{id}}})
{{#if sourceSection}}Section/Page: {{{sourceSection}}}
{{/if}}
Content:
"""
{{{content}}}
"""
---
{{/each}}

Please provide your answer in English and then fill the structured citations array based on the excerpts used.`,
});

// Flow Definition
const sourceCitationForAIAnswersFlow = ai.defineFlow(
  {
    name: 'sourceCitationForAIAnswersFlow',
    inputSchema: SourceCitationForAIAnswersInputSchema,
    outputSchema: SourceCitationForAIAnswersOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

// Wrapper Function
export async function sourceCitationForAIAnswers(input: SourceCitationForAIAnswersInput): Promise<SourceCitationForAIAnswersOutput> {
  return sourceCitationForAIAnswersFlow(input);
}

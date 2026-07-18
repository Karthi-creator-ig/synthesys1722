'use server';
/**
 * @fileOverview A Genkit flow for processing documents (text or PDF) for RAG indexing.
 * Optimized for English-only extraction and summary.
 *
 * - processDocumentForIndexing - A function that handles the document processing and chunking.
 * - DocumentUploadAndIndexingInput - The input type for the processDocumentForIndexing function.
 * - DocumentUploadAndIndexingOutput - The return type for the processDocumentForIndexing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentUploadAndIndexingInputSchema = z.object({
  documentContent: z.string().optional().describe('The raw text content of the document.'),
  fileDataUri: z.string().optional().describe('The data URI of a file (PDF, Image, etc.) to process.'),
});
export type DocumentUploadAndIndexingInput = z.infer<typeof DocumentUploadAndIndexingInputSchema>;

const DocumentUploadAndIndexingOutputSchema = z.object({
  cleanedText: z.string().describe('The meaningful human-readable text extracted from the input.'),
  documentSummary: z.string().describe('A concise AI-generated summary of the entire document.'),
  chunks: z.array(z.string()).describe('An array of text chunks derived from the content, ready for vector indexing.'),
});
export type DocumentUploadAndIndexingOutput = z.infer<typeof DocumentUploadAndIndexingOutputSchema>;

function chunkText(text: string, chunkSize: number = 1000, overlap: number = 100): string[] {
  const chunks: string[] = [];
  if (!text) return chunks;

  const normalizedText = text.replace(/\s+/g, ' ').trim();
  const sentences = normalizedText.split(/(?<=[.?!])\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= chunkSize) {
      currentChunk += (currentChunk.length > 0 ? ' ' : '') + sentence;
    } else {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 20);
}

const documentProcessorPrompt = ai.definePrompt({
  name: 'documentProcessorPrompt',
  input: {
    schema: DocumentUploadAndIndexingInputSchema,
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A concise summary of the content in English.'),
      cleanedText: z.string().describe('The extracted human-readable text content in English.'),
    }),
  },
  prompt: `You are an expert document analyzer. 
Your task is to extract all meaningful human-readable text from the provided source.

LANGUAGE SUPPORT: You MUST support ONLY English. If the source is in another language, translate the core meaning to English.

{{#if fileDataUri}}
I have provided a document file for you to analyze. Please extract the text: {{media url=fileDataUri}}
{{else}}
{{#if documentContent}}
I have provided some raw text content:
"""
{{{documentContent}}}
"""
{{/if}}
{{/if}}

Please:
1. Extract and return the full human-readable text content in English.
2. Provide a concise summary (max 200 words) of the document in English.

Please provide the results in the requested JSON structure.`,
});

export async function processDocumentForIndexing(input: DocumentUploadAndIndexingInput): Promise<DocumentUploadAndIndexingOutput> {
  return documentUploadAndIndexingFlow(input);
}

const documentUploadAndIndexingFlow = ai.defineFlow(
  {
    name: 'documentUploadAndIndexingFlow',
    inputSchema: DocumentUploadAndIndexingInputSchema,
    outputSchema: DocumentUploadAndIndexingOutputSchema,
  },
  async (input) => {
    const { output } = await documentProcessorPrompt(input);

    if (!output || !output.cleanedText) {
      throw new Error('The AI could not extract meaningful text from this document. Please try a different file format.');
    }

    const chunks = chunkText(output.cleanedText);

    return {
      cleanedText: output.cleanedText,
      documentSummary: output.summary,
      chunks: chunks,
    };
  }
);

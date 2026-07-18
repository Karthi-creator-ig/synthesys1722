'use server';

import { processDocumentForIndexing, DocumentUploadAndIndexingInput } from '@/ai/flows/document-upload-and-indexing';
import { sourceCitationForAIAnswers, SourceCitationForAIAnswersInput } from '@/ai/flows/source-citation-for-ai-answers';

/**
 * Helper to retry AI operations with exponential backoff when hitting rate limits (429).
 * Increased retries and delay for a smoother free-tier experience.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 3000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error.message || "";
    // Check for standard Gemini rate limit indicators
    const isQuota = 
      errorMsg.includes('429') || 
      errorMsg.includes('quota') || 
      errorMsg.includes('RESOURCE_EXHAUSTED') ||
      errorMsg.includes('Too Many Requests');
    
    if (isQuota && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function indexDocumentAction(input: DocumentUploadAndIndexingInput) {
  try {
    const result = await withRetry(() => processDocumentForIndexing(input));
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Indexing error:', error);
    const errorMsg = error.message || "";
    const isQuota = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED');
    
    return { 
      success: false, 
      error: isQuota 
        ? "AI Rate Limit Reached. The free tier allows 15 requests per minute. Please wait 60 seconds for the 'minute' limit to reset." 
        : (error.message || 'Failed to index document')
    };
  }
}

export async function askQuestionAction(input: SourceCitationForAIAnswersInput) {
  try {
    const result = await withRetry(() => sourceCitationForAIAnswers(input));
    return { success: true, data: result };
  } catch (error: any) {
    console.error('QA error:', error);
    const errorMsg = error.message || "";
    const isQuota = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED');

    return { 
      success: false, 
      error: isQuota 
        ? "AI is currently busy (Free Tier Rate Limit). Please wait 30-60 seconds and try your question again." 
        : (error.message || 'Failed to get answer')
    };
  }
}

export type Document = {
  id: string;
  title: string;
  content: string;
  fileDataUri?: string; // Original base64 data for PDF/media processing
  category: string;
  summary?: string;
  chunks?: string[];
  status: 'indexed' | 'processing' | 'error';
  lastUpdated: Date;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  citations?: Array<{
    documentId: string;
    documentTitle: string;
    section?: string;
    textSnippet: string;
  }>;
};

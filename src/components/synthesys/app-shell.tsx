'use client';

import { useState, useEffect } from 'react';
import { DocumentSidebar } from './document-sidebar';
import { ChatView } from './chat-view';
import { EditorView } from './editor-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Document } from './types';
import { MessageSquare, FileEdit, Loader2 } from 'lucide-react';

const INITIAL_DOCS: Document[] = [
  {
    id: 'welcome-doc',
    title: 'Welcome to Synthesys',
    content: `# What is Synthesys?
Synthesys is an AI-powered documentation assistant built with **Next.js 15** and **Google Genkit**. It uses a technique called **RAG (Retrieval Augmented Generation)** to provide expert answers grounded in your specific documents.

## How it's Built
- **AI Model**: Driven by **Gemini 2.5 Flash**, offering native PDF extraction and fast reasoning.
- **Logic**: Built using **Genkit Flows** for robust document processing and citation generation.
- **UI**: Styled with **Tailwind CSS** and **Shadcn UI** for a professional, responsive experience.

## Getting Started
1. **Upload**: Use the "Upload File" button in the sidebar to add your PDFs or Text files.
2. **Index**: Click "Save & Index" in the editor to let the AI process the document.
3. **Chat**: Switch to the "Expert Chat" tab and ask questions about your documents!`,
    category: 'General',
    status: 'indexed',
    summary: 'A detailed overview of the Synthesys platform, its tech stack (Next.js, Genkit, Gemini), and how to get started.',
    chunks: [
      'Synthesys is an AI-powered documentation assistant built with Next.js 15 and Google Genkit.',
      'It uses RAG (Retrieval Augmented Generation) to provide expert answers grounded in your documents.',
      'The AI Model is Gemini 2.5 Flash, which handles native PDF extraction.',
      'To use it, upload a file, index it in the editor, and then chat with the Expert Assistant.'
    ],
    lastUpdated: new Date()
  }
];

export function SynthesysApp() {
  const [mounted, setMounted] = useState(false);
  const [documents, setDocuments] = useState<Document[]>(INITIAL_DOCS);
  const [activeView, setActiveView] = useState<'chat' | 'editor'>('chat');
  const [selectedDoc, setSelectedDoc] = useState<Document | undefined>(INITIAL_DOCS[0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSaveDoc = (doc: Document) => {
    setDocuments(prev => {
      const exists = prev.find(d => d.id === doc.id);
      if (exists) {
        return prev.map(d => d.id === doc.id ? doc : d);
      }
      return [...prev, doc];
    });
    setSelectedDoc(doc);
  };

  const handleDeleteDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (selectedDoc?.id === id) {
      setSelectedDoc(undefined);
    }
  };

  const handleNewDoc = () => {
    setSelectedDoc(undefined);
    setActiveView('editor');
  };

  const handleUploadDocument = (title: string, dataUri: string) => {
    const newDoc: Document = {
      id: `uploaded-${Date.now()}`,
      title,
      content: '', 
      fileDataUri: dataUri,
      category: 'Internal',
      status: 'processing',
      lastUpdated: new Date()
    };
    setDocuments(prev => [...prev, newDoc]);
    setSelectedDoc(newDoc);
    setActiveView('editor');
  };

  if (!mounted) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden" suppressHydrationWarning>
      <DocumentSidebar
        documents={documents}
        selectedDocId={selectedDoc?.id}
        onSelectDocument={(doc) => {
          setSelectedDoc(doc);
          setActiveView('editor');
        }}
        onNewDocument={handleNewDoc}
        onDeleteDocument={handleDeleteDoc}
        onUploadDocument={handleUploadDocument}
      />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 py-2 bg-white border-b flex items-center justify-between shrink-0">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="chat" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Expert Chat
              </TabsTrigger>
              <TabsTrigger value="editor" className="gap-2">
                <FileEdit className="h-4 w-4" />
                Editor
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {activeView === 'editor' && selectedDoc && (
                <span className="font-medium text-primary">Editing: {selectedDoc.title}</span>
              )}
            </div>
          </div>

          <div className="flex-1 relative min-h-0 overflow-hidden">
            <TabsContent value="chat" className="absolute inset-0 m-0 p-0 border-none data-[state=active]:flex flex-col h-full min-h-0">
              <ChatView documents={documents} />
            </TabsContent>
            <TabsContent value="editor" className="absolute inset-0 m-0 p-0 border-none data-[state=active]:flex flex-col h-full min-h-0">
              <EditorView document={selectedDoc} onSave={handleSaveDoc} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

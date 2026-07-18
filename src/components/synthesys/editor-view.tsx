'use client';

import { useState, useEffect } from 'react';
import { Save, FileText, CheckCircle2, RotateCcw, AlertCircle, BookOpen, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Document } from './types';
import { indexDocumentAction } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EditorViewProps {
  document?: Document;
  onSave: (doc: Document) => void;
}

export function EditorView({ document, onSave }: EditorViewProps) {
  const [title, setTitle] = useState(document?.title || 'Untitled Document');
  const [content, setContent] = useState(document?.content || '');
  const [indexing, setIndexing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (document) {
      setTitle(document.title || 'Untitled Document');
      setContent(document.content || '');
      
      // Auto-trigger indexing only for newly uploaded processing docs
      if (document.status === 'processing' && !indexing) {
        handleSave();
      }
    } else {
      setTitle('Untitled Document');
      setContent('');
    }
  }, [document?.id]);

  const handleSave = async () => {
    const isProcessingUpload = document?.status === 'processing' && document.fileDataUri;
    
    if (!isProcessingUpload && (!title.trim() && !content.trim())) {
      toast({
        title: "Incomplete document",
        description: "Please provide either a title or content.",
        variant: "destructive"
      });
      return;
    }

    if (indexing) return;

    setIndexing(true);
    setProgress(10);

    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 5, 95));
    }, 800);

    try {
      const result = await indexDocumentAction({ 
        documentContent: document?.fileDataUri ? undefined : content,
        fileDataUri: document?.fileDataUri 
      });
      
      clearInterval(interval);
      setProgress(100);

      if (result.success && result.data) {
        const finalContent = result.data.cleanedText;
        
        const newDoc: Document = {
          id: document?.id || Date.now().toString(),
          title,
          content: finalContent,
          fileDataUri: undefined,
          category: 'Internal',
          summary: result.data.documentSummary,
          chunks: result.data.chunks,
          status: 'indexed',
          lastUpdated: new Date(),
        };
        onSave(newDoc);
        setContent(finalContent);
        toast({
          title: "Knowledge Extracted",
          description: "Document content has been processed and indexed.",
        });
      } else {
        clearInterval(interval);
        setProgress(0);
        
        const errorMsg = result.error || "Failed to index document";
        const isQuota = errorMsg.includes('Rate Limit') || errorMsg.includes('429') || errorMsg.includes('quota');
        
        if (document) {
          onSave({ ...document, status: 'error' });
        }

        toast({
          title: isQuota ? "AI Quota Limit Reached" : "Indexing Failed",
          description: errorMsg,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      clearInterval(interval);
      setProgress(0);
      
      if (document) {
        onSave({ ...document, status: 'error' });
      }

      toast({
        title: "Processing Error",
        description: "An unexpected error occurred. Please wait a moment and try again.",
        variant: "destructive"
      });
    } finally {
      setIndexing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden" suppressHydrationWarning>
      <div className="p-4 border-b flex items-center justify-between gap-4 shrink-0">
        <div className="flex-1 max-w-xl">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto placeholder:opacity-50"
            placeholder="Document Title"
            suppressHydrationWarning
          />
        </div>
        <div className="flex items-center gap-3">
          {document?.status === 'indexed' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1 items-center px-2 py-1">
              <CheckCircle2 size={12} />
              Synced to AI
            </Badge>
          )}
          {document?.status === 'error' && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex gap-1 items-center px-2 py-1">
              <AlertCircle size={12} />
              Index Failed
            </Badge>
          )}
          <Button onClick={handleSave} disabled={indexing} className="gap-2" suppressHydrationWarning>
            {indexing ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                Indexing...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save & Index
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        {indexing && (
          <div className="absolute top-0 left-0 right-0 z-10">
            <Progress value={progress} className="h-1 rounded-none bg-transparent" />
          </div>
        )}
        <div className="flex h-full divide-x">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b bg-muted/30 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">
              <FileText size={12} />
              Editor (Markdown)
            </div>
            
            {document?.status === 'error' && (
              <div className="px-8 pt-4">
                <Alert variant="destructive">
                  <Info className="h-4 w-4" />
                  <AlertTitle>AI Quota Notice</AlertTitle>
                  <AlertDescription>
                    The free tier limits (RPM) usually reset every 60 seconds. Please wait one minute and click "Save & Index" again to complete extraction.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex-1 p-0 overflow-hidden relative">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="absolute inset-0 p-8 border-none shadow-none focus-visible:ring-0 text-base leading-relaxed resize-none font-doc w-full h-full"
                placeholder="Start writing or upload a file. The AI will extract knowledge once saved."
                suppressHydrationWarning
              />
            </div>
          </div>
          
          <div className="w-1/3 bg-background/50 flex flex-col min-h-0 overflow-y-auto">
            <div className="p-3 border-b bg-muted/30 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sticky top-0 bg-muted/30 z-10">
              <AlertCircle size={12} />
              AI Insights
            </div>
            <div className="p-6 space-y-6">
              {document?.summary ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-500">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-primary">Generated Summary</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground font-doc">
                      {document.summary}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-primary">Extraction Stats</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white rounded-lg border shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Chunks</p>
                        <p className="text-lg font-bold">{document.chunks?.length || 0}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Vector Status</p>
                        <p className="text-lg font-bold text-green-600">Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center space-y-2 opacity-40">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                  <p className="text-xs">Index this document to see AI-generated insights and summaries.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Quote, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { askQuestionAction } from '@/app/actions';
import { Message, Document } from './types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ChatViewProps {
  documents: Document[];
}

export function ChatView({ documents }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am Synthesys, your documentation assistant. You can ask me questions about your indexed documents in English.',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const docSnippets = documents
        .filter(d => d.status === 'indexed')
        .flatMap(doc => {
          return (doc.chunks || [doc.content]).map((content, idx) => ({
            id: `${doc.id}-chunk-${idx}`,
            title: doc.title,
            content: content,
            sourceSection: `Document: ${doc.title}`
          }));
        });

      if (docSnippets.length === 0) {
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          text: "I don't have any indexed documents to search from. Please upload or create a document and click 'Save & Index' first!",
        }]);
        return;
      }

      const response = await askQuestionAction({
        query: input,
        documents: docSnippets,
      });

      if (response.success && response.data) {
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          text: response.data.answer,
          citations: response.data.citations,
        }]);
      } else {
        const errorMsg = response.error || "Failed to process";
        const isQuota = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED');
        
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          text: isQuota 
            ? "The AI is currently receiving too many requests (Free Tier Limit). Please wait about 30 seconds and try again."
            : "I encountered an error while processing your request.",
        }]);

        if (isQuota) {
          toast({
            title: "AI Rate Limit",
            description: "Gemini Free Tier limit reached. Please pause for a moment.",
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      const errorMsg = error.message || "";
      const isQuotaError = errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED');
      
      const errorText = isQuotaError 
        ? "The AI is currently busy. Please wait 30 seconds and try again. (Free Tier Limit Reached)"
        : 'Sorry, I encountered an error while processing your request.';

      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        text: errorText,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative min-h-0" suppressHydrationWarning>
      <ScrollArea className="flex-1" viewportRef={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-6 p-6 pb-32">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                m.role === 'user' ? "flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                m.role === 'assistant' ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
              )}>
                {m.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className={cn("space-y-4 max-w-[85%]", m.role === 'user' ? "items-end" : "items-start")}>
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed shadow-sm border whitespace-pre-wrap",
                  m.role === 'assistant' ? "bg-card border-border text-foreground" : "bg-primary text-primary-foreground border-transparent"
                )}>
                  {m.text}
                </div>
                
                {m.citations && m.citations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Sources</p>
                    <div className="grid grid-cols-1 gap-2">
                      {m.citations.map((cite, i) => (
                        <Card key={i} className="p-3 bg-accent/5 border-accent/20 hover:bg-accent/10 transition-colors">
                          <div className="flex items-start gap-3">
                            <Quote className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-accent flex items-center gap-1.5">
                                {cite.documentTitle}
                                <ExternalLink size={10} />
                              </p>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 italic leading-relaxed">
                                "{cite.textSnippet}"
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-12">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            placeholder="Ask about your documents..."
            className="h-12 bg-card shadow-lg border-primary/20 focus-visible:ring-primary"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            suppressHydrationWarning
          />
          <Button 
            size="icon" 
            className="h-12 w-12 shrink-0 shadow-lg bg-primary hover:bg-primary/90"
            onClick={handleSend}
            disabled={loading}
            suppressHydrationWarning
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

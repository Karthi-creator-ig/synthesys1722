'use client';

import { useRef } from 'react';
import { FileText, Plus, Search, Trash2, BookOpen, Clock, Folder, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Document } from './types';
import { cn } from '@/lib/utils';

interface DocumentSidebarProps {
  documents: Document[];
  onSelectDocument: (doc: Document) => void;
  onNewDocument: () => void;
  onDeleteDocument: (id: string) => void;
  onUploadDocument: (title: string, content: string) => void;
  selectedDocId?: string;
}

export function DocumentSidebar({
  documents,
  onSelectDocument,
  onNewDocument,
  onDeleteDocument,
  onUploadDocument,
  selectedDocId
}: DocumentSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      const title = file.name.replace(/\.[^/.]+$/, "");
      onUploadDocument(title, dataUri);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    // Use readAsDataURL to send the file as media to Gemini for proper extraction
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-64">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-headline font-bold text-lg tracking-tight">Synthesys</span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <Button onClick={onNewDocument} className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" />
          New Document
        </Button>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".txt,.md,.markdown,.pdf"
          onChange={handleFileChange}
        />
        <Button 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          className="w-full justify-start gap-2 bg-white/50 hover:bg-white border-dashed"
        >
          <Upload className="h-4 w-4" />
          Upload File
        </Button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search index..." className="pl-8 h-9 text-sm bg-background/50" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
              <Folder className="h-3 w-3" />
              Internal Docs
            </h3>
            <div className="space-y-1">
              {documents.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-2">No documents yet.</p>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={cn(
                      "group flex items-center justify-between gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm",
                      selectedDocId === doc.id 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "hover:bg-sidebar-accent text-sidebar-foreground"
                    )}
                    onClick={() => onSelectDocument(doc)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 shrink-0 opacity-70" />
                      <span className="truncate">{doc.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDocument(doc.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Last sync: Just now</span>
        </div>
      </div>
    </div>
  );
}

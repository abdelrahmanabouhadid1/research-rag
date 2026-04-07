"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Document } from "@/lib/api";

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => void;
}

export default function DocumentList({ documents, onDelete }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No documents uploaded yet.
      </p>
    );
  }

  return (
    <ScrollArea className="max-h-[300px]">
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{doc.filename}</p>
              <Badge variant="secondary" className="text-xs">
                {doc.num_chunks} chunks
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 text-destructive hover:text-destructive"
              onClick={() => onDelete(doc.id)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

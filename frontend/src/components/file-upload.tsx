"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadDocument, type Document } from "@/lib/api";

interface FileUploadProps {
  onUploaded: (doc: Document) => void;
}

export default function FileUpload({ onUploaded }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const doc = await uploadDocument(file);
        onUploaded(doc);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setUploading(false);
      }
    },
    [onUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <Card
      className={`border-2 border-dashed p-6 text-center transition-colors ${
        dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {uploading ? "Uploading..." : "Drag & drop a file here"}
        </p>
        <p className="text-xs text-muted-foreground">PDF, TXT, or DOCX</p>
        {!uploading && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".pdf,.txt,.docx";
              input.onchange = () => {
                const file = input.files?.[0];
                if (file) handleFile(file);
              };
              input.click();
            }}
          >
            Browse files
          </Button>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </Card>
  );
}

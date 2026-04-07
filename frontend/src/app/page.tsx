"use client";

import { useEffect, useState, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import FileUpload from "@/components/file-upload";
import DocumentList from "@/components/document-list";
import Chat from "@/components/chat";
import { listDocuments, deleteDocument, type Document } from "@/lib/api";

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);

  const fetchDocs = useCallback(async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch {
      // backend might not be running yet
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUploaded = (doc: Document) => {
    setDocuments((prev) => [...prev, doc]);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-80 border-r flex flex-col p-4 gap-4">
        <h1 className="text-lg font-semibold">Research RAG</h1>
        <Separator />
        <FileUpload onUploaded={handleUploaded} />
        <Separator />
        <h2 className="text-sm font-medium">Documents</h2>
        <DocumentList documents={documents} onDelete={handleDelete} />
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col">
        <Chat />
      </main>
    </div>
  );
}

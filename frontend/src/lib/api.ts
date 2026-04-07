const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Document {
  id: string;
  filename: string;
  num_chunks: number;
}

export interface AskResponse {
  answer: string;
  sources: string[];
}

export async function uploadDocument(file: File): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Upload failed");
  }

  return res.json();
}

export async function listDocuments(): Promise<Document[]> {
  const res = await fetch(`${API_URL}/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/documents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete document");
}

export async function askQuestion(question: string): Promise<AskResponse> {
  const res = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to get answer");
  }

  return res.json();
}

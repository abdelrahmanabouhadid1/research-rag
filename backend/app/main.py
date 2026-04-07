import os
import uuid
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.document_loader import load_document
from app.rag import add_document, delete_document, ask

load_dotenv()

app = FastAPI(title="Research RAG")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

documents_store: dict[str, dict] = {}


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str
    sources: list[str]


@app.get("/documents")
def list_documents():
    return list(documents_store.values())


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    suffix = Path(file.filename).suffix.lower()
    if suffix not in (".pdf", ".txt", ".docx"):
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {suffix}")

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        text = load_document(tmp_path)
    finally:
        os.unlink(tmp_path)

    if not text.strip():
        raise HTTPException(status_code=400, detail="Document appears to be empty")

    doc_id = str(uuid.uuid4())
    num_chunks = add_document(doc_id, file.filename, text)

    documents_store[doc_id] = {
        "id": doc_id,
        "filename": file.filename,
        "num_chunks": num_chunks,
    }

    return {"id": doc_id, "filename": file.filename, "num_chunks": num_chunks}


@app.delete("/documents/{doc_id}")
def remove_document(doc_id: str):
    if doc_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")

    delete_document(doc_id)
    del documents_store[doc_id]
    return {"status": "deleted"}


@app.post("/ask", response_model=AskResponse)
def ask_question(req: AskRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    result = ask(req.question)
    return result

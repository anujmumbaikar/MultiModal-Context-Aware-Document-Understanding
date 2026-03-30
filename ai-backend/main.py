from ingestion import ingest_file_to_vector_db
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from openai import OpenAI
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import uuid
import requests
import glob as file_glob
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
client = OpenAI()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

embedding_model = OpenAIEmbeddings(
    model="text-embedding-3-large"
)

class ChatRequest(BaseModel):
    query: str
    project_id: str

class UploadRequest(BaseModel):
    project_id: str

class DeleteDocumentRequest(BaseModel):
    project_id: str
    document_name: str

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploaded_files")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_project_upload_dir(project_id: str) -> str:
    """Get upload directory for a specific project."""
    project_dir = os.path.join(UPLOAD_DIR, project_id)
    os.makedirs(project_dir, exist_ok=True)
    return project_dir

def create_ingestion_job(project_id: str, filename: str) -> str | None:
    """Create an IngestionJob in Postgres via Next.js API and return its id."""
    nextjs_url = os.getenv("NEXTJS_URL", "http://localhost:3000")
    try:
        res = requests.post(
            f"{nextjs_url}/api/projects/{project_id}/jobs",
            json={"filename": filename},
            timeout=10,
        )
        return res.json().get("id")
    except Exception as e:
        print(f"Warning: failed to create ingestion job: {e}")
        return None


def get_vector_db_for_project(project_id: str) -> QdrantVectorStore:
    """Get or create vector store for a specific project."""
    collection_name = f"project_{project_id}"
    return QdrantVectorStore.from_existing_collection(
        embedding=embedding_model,
        url="http://localhost:6333",
        collection_name=collection_name,
    )

@app.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project_id: str = None
):
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")

    file_id = str(uuid.uuid4())
    project_upload_dir = get_project_upload_dir(project_id)
    file_path = f"{project_upload_dir}/{file_id}_{file.filename}"

    content = await file.read()
    file_size = len(content)
    file_type = file.content_type or "application/octet-stream"

    with open(file_path, "wb") as f:
        f.write(content)

    job_id = create_ingestion_job(project_id, file.filename or "unknown")
    background_tasks.add_task(ingest_file_to_vector_db, file_path, project_id, file_size, file_type, job_id)

    return {
        "message": "File uploaded, processing started",
        "file_id": file_id,
        "project_id": project_id,
        "job_id": job_id,
    }


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    query = request.query
    project_id = request.project_id

    vector_db = get_vector_db_for_project(project_id)
    search_results = vector_db.similarity_search(query, k=6)

    context = "\n\n\n".join([
        f"""
            Page Content:
            {res.page_content}

            Metadata:
            Type: {res.metadata.get("type")}
            Filename: {res.metadata.get("filename")}
            Caption: {res.metadata.get("caption")}
            Page Number: {res.metadata.get("page_number")}
            """
        for res in search_results
    ])

    SYSTEM_PROMPT = f"""
        You are a context-aware AI assistant for document understanding.

            The context may include text, tables, and image descriptions.

            Guidelines:
            - Use only the provided context to answer
            - If the context includes tables, summarize key insights
            - If the context includes image descriptions, explain them clearly
            - Do not hallucinate or add external knowledge
            - If answer is missing, say: "Answer not found in the document"

            Answer clearly and in a structured way.

            Context:
            {context}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": query}
        ],
    )

    return {
        "answer": response.choices[0].message.content
    }


@app.get("/files/{project_id}/{document_name:path}")
async def serve_document(project_id: str, document_name: str):
    """Serve an uploaded document file for in-browser viewing."""
    # Sanitize to prevent path traversal
    project_id = os.path.basename(project_id)
    document_name = os.path.basename(document_name)

    project_dir = get_project_upload_dir(project_id)

    # Files are stored as {uuid}_{original_filename}
    matches = file_glob.glob(os.path.join(project_dir, f"*_{document_name}"))

    if not matches:
        exact = os.path.join(project_dir, document_name)
        if os.path.exists(exact):
            return FileResponse(exact, content_disposition_type="inline")
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(matches[0], content_disposition_type="inline")


@app.delete("/documents/{document_id}/delete")
async def delete_document_from_vector_db(document_id: str, request: DeleteDocumentRequest):
    """Delete document embeddings from Qdrant vector database."""
    try:
        from qdrant_client.http.models import Filter, FieldCondition, MatchValue

        collection_name = f"project_{request.project_id}"

        qdrant = QdrantClient(url="http://localhost:6333")

        # Delete points where metadata.filename matches the document name
        qdrant.delete(
            collection_name=collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="metadata.filename",
                        match=MatchValue(value=request.document_name),
                    )
                ]
            ),
            wait=True,
        )

        return {"message": "Document embeddings deleted from vector DB", "document_id": document_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete from vector DB: {str(e)}")

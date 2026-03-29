from ingestion import ingest_file_to_vector_db
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from openai import OpenAI
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, BackgroundTasks, HTTPException
from pydantic import BaseModel
import os
import uuid
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

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploaded_files")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_project_upload_dir(project_id: str) -> str:
    """Get upload directory for a specific project."""
    project_dir = os.path.join(UPLOAD_DIR, project_id)
    os.makedirs(project_dir, exist_ok=True)
    return project_dir

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

    background_tasks.add_task(ingest_file_to_vector_db, file_path, project_id, file_size, file_type)

    return {
        "message": "File uploaded, processing started",
        "file_id": file_id,
        "project_id": project_id
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
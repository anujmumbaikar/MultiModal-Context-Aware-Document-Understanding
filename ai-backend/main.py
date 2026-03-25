from ingestion import ingest_file_to_vector_db
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from openai import OpenAI
from dotenv import load_dotenv
from fastapi import FastAPI , File, UploadFile, BackgroundTasks
from pydantic import BaseModel
import os
import uuid

load_dotenv()
client = OpenAI()
app = FastAPI()

embedding_model = OpenAIEmbeddings(
    model="text-embedding-3-large"
)

class ChatRequest(BaseModel):
    query: str

UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

vector_db = QdrantVectorStore.from_existing_collection(
    embedding=embedding_model,
    url="http://localhost:6333",
    collection_name="multimodal_collection",
)

@app.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    file_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_DIR}/{file_id}_{file.filename}"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    background_tasks.add_task(ingest_file_to_vector_db, file_path)

    return {
        "message": "File uploaded, processing started",
        "file_id": file_id
    }


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):

    query = request.query

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
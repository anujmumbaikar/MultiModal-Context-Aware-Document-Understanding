# ingestion.py

from langchain_qdrant import QdrantVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document
from dotenv import load_dotenv
from chunking import get_all_chunks
import os
import requests

load_dotenv()

embedding_model = OpenAIEmbeddings(
    model="text-embedding-3-large"
)

def prepare_chunks_for_ingestion(chunks):
    processed_chunks = []

    for idx, chunk in enumerate(chunks):
        if not chunk.get("content"):
            print(f"Skipping chunk at index {idx} due to missing content.")
            continue

        processed_chunks.append({
            "content": chunk["content"],
            "content_type": chunk.get("content_type", "unknown"),
            "page_number": chunk.get("page_number", None),
            "filename": chunk.get("filename", "unknown"),
            "caption": chunk.get("caption", None)
        })

    return processed_chunks


def convert_to_documents(chunks):
    docs = []

    for chunk in chunks:
        docs.append(
            Document(
                page_content=chunk["content"],
                metadata={
                    "type": chunk["content_type"],
                    "filename": chunk["filename"],
                    "page_number": chunk.get("page_number"),
                    "caption": chunk.get("caption")
                }
            )
        )

    return docs


def store_in_qdrant(docs, project_id: str):
    collection_name = f"project_{project_id}"
    vector_store = QdrantVectorStore.from_documents(
        documents=docs,
        embedding=embedding_model,
        url="http://localhost:6333",
        collection_name=collection_name,
    )
    return vector_store


def notify_ingest_complete(project_id: str, filename: str, file_type: str, file_size: int, total_chunks: int, total_pages: int):
    nextjs_url = os.getenv("NEXTJS_URL", "http://localhost:3000")
    try:
        requests.post(
            f"{nextjs_url}/api/projects/{project_id}/ingest-complete",
            json={
                "filename": filename,
                "fileType": file_type,
                "fileSize": file_size,
                "chunks": total_chunks,
                "pages": total_pages,
            },
            timeout=10,
        )
        print(f"Notified Next.js of ingestion completion for project {project_id}")
    except Exception as e:
        print(f"Warning: failed to notify Next.js backend: {e}")


def ingest_file_to_vector_db(file_path, project_id: str = None, file_size: int = 0, file_type: str = "unknown"):
    if not project_id:
        project_id = "default"

    print(f"Starting ingestion for the document")
    chunks = get_all_chunks(file_path)
    processed_chunks = prepare_chunks_for_ingestion(chunks)
    print(f"Prepared {len(processed_chunks)} chunks for ingestion into vector database")

    # derive stats
    total_chunks = len(processed_chunks)
    page_numbers = [c.get("page_number") for c in processed_chunks if c.get("page_number")]
    total_pages = max(page_numbers) if page_numbers else 0
    filename = os.path.basename(file_path)

    docs = convert_to_documents(processed_chunks)
    print(f"Converted chunks to {len(docs)} documents for vector database ingestion")
    store_in_qdrant(docs, project_id)
    print(f"Ingestion completed for file: {file_path} into project_{project_id}")

    notify_ingest_complete(project_id, filename, file_type, file_size, total_chunks, total_pages)

    
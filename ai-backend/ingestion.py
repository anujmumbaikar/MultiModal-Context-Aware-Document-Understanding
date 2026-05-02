# ingestion.py
from langchain_qdrant import QdrantVectorStore, RetrievalMode, FastEmbedSparse
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document
from dotenv import load_dotenv
from chunking import get_all_chunks
import os
import requests

load_dotenv()

QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

embedding_model = OpenAIEmbeddings(model="text-embedding-3-large")
sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")


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


QDRANT_URL = "https://9219ef2c-5862-409f-93ef-f0808298aad3.eu-west-2-0.aws.cloud.qdrant.io"


def store_in_qdrant(docs, project_id: str):
    collection_name = f"project_{project_id}"
    print(f"[Qdrant] Uploading {len(docs)} chunks to '{collection_name}'...")
    vector_store = QdrantVectorStore.from_documents(
        documents=docs,
        embedding=embedding_model,
        sparse_embedding=sparse_embeddings,
        retrieval_mode=RetrievalMode.HYBRID,
        url=QDRANT_URL,
        collection_name=collection_name,
        api_key=QDRANT_API_KEY,
        timeout=300,
    )
    print(f"[Qdrant] Done — {len(docs)} chunks stored.")
    return vector_store


def update_stage(project_id: str, job_id: str, stage: str, status: str, message: str = None, level: str = "info"):
    """Update ingestion job stage status in Postgres via Next.js API."""
    if not job_id:
        return
    nextjs_url = os.getenv("NEXTJS_URL", "http://localhost:3000")
    try:
        requests.patch(
            f"{nextjs_url}/api/projects/{project_id}/jobs/{job_id}",
            json={"stage": stage, "status": status, "message": message, "level": level},
            timeout=10,
        )
        print(f"[{job_id}] {stage} → {status}")
    except Exception as e:
        print(f"Warning: failed to update stage {stage}: {e}")


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


def ingest_file_to_vector_db(
    file_path,
    project_id: str = None,
    file_size: int = 0,
    file_type: str = "unknown",
    job_id: str = None,
    process_images: bool = False,
    process_tables: bool = False,
):
    if not project_id:
        project_id = "default"

    _basename = os.path.basename(file_path)
    filename = _basename.split("_", 1)[1] if "_" in _basename else _basename

    print(f"\n{'='*60}")
    print(f"[Ingest] Starting: {filename}")
    print(f"[Ingest] images={process_images}  tables={process_tables}")
    print(f"{'='*60}")

    # Stage 1: upload_received
    update_stage(project_id, job_id, "upload_received", "completed", "File received and saved to disk")

    # Stage 2: chunking
    update_stage(project_id, job_id, "chunking", "running", "Extracting and chunking document content...")
    chunks = get_all_chunks(file_path, process_images=process_images, process_tables=process_tables)
    processed_chunks = prepare_chunks_for_ingestion(chunks)
    total_chunks = len(processed_chunks)
    page_numbers = [c.get("page_number") for c in processed_chunks if c.get("page_number")]
    total_pages = max(page_numbers) if page_numbers else 0
    update_stage(project_id, job_id, "chunking", "completed", f"Created {total_chunks} chunks across {total_pages} pages")

    # Stage 3: embeddings + vector storage
    update_stage(project_id, job_id, "embeddings", "running", "Generating vector embeddings...")
    docs = convert_to_documents(processed_chunks)
    store_in_qdrant(docs, project_id)
    update_stage(project_id, job_id, "embeddings", "completed", f"Embedded {len(docs)} chunks")

    # Stage 4: vector_storage
    update_stage(project_id, job_id, "vector_storage", "running", "Indexing in Qdrant...")
    update_stage(project_id, job_id, "vector_storage", "completed", "Indexed in Qdrant vector store")

    # Stage 5: ready
    update_stage(project_id, job_id, "ready", "completed", "Document is ready for querying!")

    notify_ingest_complete(project_id, filename, file_type, file_size, total_chunks, total_pages)

    print(f"\n[Ingest] Complete — {filename} ({total_chunks} chunks, {total_pages} pages)")

import json
import mimetypes
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from unstructured_client import UnstructuredClient
from unstructured_client.models.operations import CreateJobRequest, DownloadJobOutputRequest
from unstructured_client.models.shared import BodyCreateJob, InputFiles
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

openai_client = OpenAI()
unstructured_client = UnstructuredClient(api_key_auth=os.getenv("UNSTRUCTURED_API_KEY"))

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "unstructured_output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # Unstructured API limit: 20 MB

TEXT_ELEMENT_TYPES = {
    "Title", "NarrativeText", "Text", "ListItem",
    "UncategorizedText", "Header", "Footer", "EmailAddress",
}



# upload → create job → poll → download
def partition_via_api(file_path: str) -> list[dict]:
    """
    Sends a file to the Unstructured on-demand Jobs API with the
    'hi_res_and_enrichment' workflow template.
    Blocks until the job completes, then returns the list of elements.
    """
    filename = os.path.basename(file_path)
    content_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"

    file_size = os.path.getsize(file_path)
    if file_size > MAX_FILE_SIZE_BYTES:
        raise ValueError(
            f"File '{filename}' is {file_size / (1024*1024):.1f} MB, "
            f"which exceeds the Unstructured API limit of {MAX_FILE_SIZE_BYTES // (1024*1024)} MB."
        )

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    # --- Create job ---
    print(f"[Unstructured API] Creating job for: {filename}")
    create_resp = unstructured_client.jobs.create_job(
        request=CreateJobRequest(
            body_create_job=BodyCreateJob(
                request_data=json.dumps({"template_id": "hi_res_and_enrichment"}),
                input_files=[
                    InputFiles(
                        content=file_bytes,
                        file_name=filename,
                        content_type=content_type,
                    )
                ],
            )
        )
    )

    job_id = create_resp.job_information.id
    file_ids = create_resp.job_information.input_file_ids
    print(f"[Unstructured API] Job created: {job_id}  (files: {file_ids})")

    # --- Poll until COMPLETED / FAILED ---
    while True:
        poll_resp = unstructured_client.jobs.get_job(request={"job_id": job_id})
        status = poll_resp.job_information.status
        print(f"[Unstructured API] Job status: {status}")
        if status in ("SCHEDULED", "IN_PROGRESS"):
            time.sleep(10)
        else:
            break

    if status != "COMPLETED":
        raise RuntimeError(
            f"[Unstructured API] Job {job_id} ended with status: {status}"
        )

    all_elements: list[dict] = []
    for file_id in file_ids:
        dl_resp = unstructured_client.jobs.download_job_output(
            request=DownloadJobOutputRequest(job_id=job_id, file_id=file_id)
        )
        elements = dl_resp.any if isinstance(dl_resp.any, list) else []

        # Cache locally for inspection / replay
        cache_path = os.path.join(OUTPUT_DIR, f"{job_id}_{file_id}.json")
        with open(cache_path, "w") as out:
            json.dump(elements, out, indent=2)
        print(f"[Unstructured API] Cached output → {cache_path}")

        all_elements.extend(elements)

    print(f"[Unstructured API] Total elements downloaded: {len(all_elements)}")
    return all_elements

def process_images_with_caption(
    raw_elements: list[dict], use_openai: bool = True
) -> list[dict]:
    processed = []

    for idx, elem in enumerate(raw_elements):
        if elem.get("type") != "Image":
            continue

        # The FigureCaption element usually immediately follows the Image element
        caption = "No caption found"
        if (
            idx + 1 < len(raw_elements)
            and raw_elements[idx + 1].get("type") == "FigureCaption"
        ):
            caption = raw_elements[idx + 1].get("text") or "No caption found"

        metadata = elem.get("metadata", {})
        image_base64 = metadata.get("image_base64", "")

        image_data = {
            "caption": caption,
            "image_text": elem.get("text", ""),
            "base64": image_base64,
            "page_number": metadata.get("page_number"),
            "content": elem.get("text", "") or caption,
            "content_type": "image",
            "filename": metadata.get("filename", ""),
        }

        if use_openai and image_base64:
            prompt = (
                f"Generate and describe the image in detail. "
                f"The caption of image is {caption} and the image text is {image_data['image_text']}. "
                f"Directly analyze the image and provide a detailed description without any additional text. "
                f"max characters should be 100-150 words."
            )
            resp = openai_client.chat.completions.create(
                model="gpt-4.1",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_base64}"
                                },
                            },
                        ],
                    }
                ],
            )
            image_data["content"] = resp.choices[0].message.content
        elif not image_base64:
            # No base64 available – fall back to caption + element text
            image_data["content"] = f"{caption}. {elem.get('text', '')}".strip(". ")

        processed.append(image_data)

    return processed


def process_tables_with_description(
    raw_elements: list[dict], use_openai: bool = True
) -> list[dict]:
    processed = []

    for elem in raw_elements:
        if elem.get("type") != "Table":
            continue

        metadata = elem.get("metadata", {})
        table_html = metadata.get("text_as_html", "")

        table_data = {
            "table_as_html": table_html,
            "table_text": elem.get("text", ""),
            "content": elem.get("text", ""),
            "content_type": "table",
            "filename": metadata.get("filename", ""),
            "page_number": metadata.get("page_number"),
        }

        if use_openai and table_html:
            prompt = (
                f"Generate and describe the table in detailed description of its contents, "
                f"including the structure, key data points, notable trends or insights. "
                f"The table is {table_html}. "
                f"Directly analyze the table and provide a detailed description without any additional text. "
                f"max characters should be 100-150 words."
            )
            resp = openai_client.chat.completions.create(
                model="gpt-4.1",
                messages=[{"role": "user", "content": prompt}],
            )
            table_data["content"] = resp.choices[0].message.content

        processed.append(table_data)

    return processed


def process_text_chunks(raw_elements: list[dict]) -> list[dict]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )
    processed = []

    for elem in raw_elements:
        if elem.get("type") not in TEXT_ELEMENT_TYPES:
            continue
        text = (elem.get("text") or "").strip()
        if not text:
            continue

        metadata = elem.get("metadata", {})
        filename = metadata.get("filename", "")
        page_number = metadata.get("page_number")

        sub_texts = splitter.split_text(text) if len(text) > 1000 else [text]
        for chunk in sub_texts:
            processed.append({
                "content": chunk,
                "content_type": "text",
                "filename": filename,
                "page_number": page_number,
            })

    return processed

def get_all_chunks(file_path: str) -> list[dict]:
    print("Sending file to Unstructured API for processing...")
    raw_elements = partition_via_api(file_path)
    print(f"Received {len(raw_elements)} raw elements from API")

    print("Image processing started")
    images = process_images_with_caption(raw_elements)

    print("Table processing started")
    tables = process_tables_with_description(raw_elements)

    print("Text processing started")
    texts = process_text_chunks(raw_elements)

    print("Processing completed for all chunk types")
    print(
        f"Total {len(images)} images, {len(tables)} tables "
        f"and {len(texts)} text chunks processed from the document"
    )

    return images + tables + texts

import base64
from openai import OpenAI
from dotenv import load_dotenv
from unstructured.documents.elements import Text,Element,FigureCaption,Image,Table,CompositeElement
load_dotenv()

client = OpenAI()

def process_images_with_caption(raw_chunks,use_openai=True):
    processed_image = []
    for idx, chunk in enumerate(raw_chunks):
        if isinstance(chunk, Image):
            # the next element after the image will be figure caption
            if idx + 1 < len(raw_chunks) and isinstance(raw_chunks[idx + 1], FigureCaption):
                caption = raw_chunks[idx + 1].text
            else:
                caption = "No caption found"

            image_data = {
                # "index": idx, no need of index , when we will put into vector database 
                # we can take anything which we feel it is best for retrival
                "caption": caption if caption else "No caption found",
                "image_text": chunk.text,
                "base64": chunk.metadata.image_base64,
                "content":chunk.text,
                "content_type": "image",
                "filename": chunk.metadata.filename
            }
            if use_openai:
                prompt = f"""
                Generate and describe the image in detail. 
                The caption of image is {image_data['caption']} and the image text is {image_data['image_text']}
                Directly analyze the image and provide a detailed description without any additional text.

                """
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:image/png;base64,{image_data['base64']}"},
                                },
                            ],
                        }
                    ],
                )
                image_data["content"] = response.choices[0].message.content
            processed_image.append(image_data)
    return processed_image



def process_tables_with_description(raw_chunks,use_openai=True):
    processed_tables = []
    for idx , element in enumerate(raw_chunks):
        if isinstance(element, Table):
            table_data = {
                "table_as_html":element.metadata.text_as_html,
                "table_text": element.text,
                "content": element.text,
                "content_type": "table",
                "filename": element.metadata.filename
            }
            if use_openai:
                prompt = f"""
                    Generate and describe the table in detailed descriptiton of its contents , includding the strucutre, 
                    key data points , notable treands or insights 
                    The table is {table_data['table_as_html']}
                    Directly analyze the table and provide a detailed description without any additional text.
                    """
                response = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[
                            {
                                "role": "user",
                                "content": prompt,
                            }
                        ],
                    )
                table_data["content"] = response.choices[0].message.content
            processed_tables.append(table_data)
    return processed_tables


def create_semantic_chunks(text_chunks):
    processed_texts_chunks = []
    for idx , chunk in enumerate(text_chunks):
        if isinstance(chunk, CompositeElement):
            chunk_data = {
                "content": chunk.text,
                "content_type": "text",
                "filename": chunk.metadata.filename
            }
            processed_texts_chunks.append(chunk_data) 
    return processed_texts_chunks


if __name__ == "__main__":
    from unstructured.partition.pdf import partition_pdf
    file_path = 'OLAP_and_OLTP.pdf'

    raw_chunks = partition_pdf(
        filename=file_path,
        strategy="hi_res",
        infer_table_structure=True,
        extract_image_block_types=["figure", "table",'Image'],
        extract_image_block_to_payload=True,
        chunking_strategy=None,
    )
    # processed_images = process_images_with_caption(raw_chunks)
    # for image in processed_images:
    #     print(image)
    processed_tables = process_tables_with_description(raw_chunks)
    for table in processed_tables:
        print(table) 

    
    text_chunks = partition_pdf(
        filename=file_path,
        strategy="hi_res",
        chunking_strategy="by_title",
        max_characters=2000,
        combine_text_under_n_chars=500,
        new_after_n_chars=1500
    )
    semantic_chunks = create_semantic_chunks(text_chunks)
    for chunk in semantic_chunks:
        print(chunk)
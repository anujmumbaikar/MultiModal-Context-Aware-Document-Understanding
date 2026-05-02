from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import FastEmbedSparse

embedding_model = OpenAIEmbeddings(model="text-embedding-3-large")
sparse_embeddings = FastEmbedSparse(model_name="Qdrant/bm25")

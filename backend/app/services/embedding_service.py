# backend/app/services/embedding_service.py

import google.generativeai as genai
from typing import List
import os

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set.")
genai.configure(api_key=api_key)

class EmbeddingService:
    def __init__(self):
        self.model_name = 'models/text-embedding-004'

    async def embed_document(self, doc: str) -> List[float]:
        """Embeds a single document."""
        result = await genai.embed_content_async(
            model=self.model_name,
            content=doc,
            task_type="RETRIEVAL_DOCUMENT"
        )
        return result['embedding']

    async def embed_query(self, query: str) -> List[float]:
        """Embeds a query for similarity search."""
        result = await genai.embed_content_async(
            model=self.model_name,
            content=query,
            task_type="RETRIEVAL_QUERY"
        )
        return result['embedding']

embedding_service = EmbeddingService()

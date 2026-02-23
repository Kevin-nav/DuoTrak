# backend/app/services/embedding_service.py

import os
from typing import List

from google import genai
from google.genai import types

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set.")
client = genai.Client(api_key=api_key)

class EmbeddingService:
    def __init__(self):
        self.model_name = "text-embedding-004"

    @staticmethod
    def _extract_embedding_values(response: object) -> List[float]:
        embeddings = getattr(response, "embeddings", None) or []
        if not embeddings:
            raise ValueError("No embeddings returned from Gemini embedding API.")

        first = embeddings[0]
        values = getattr(first, "values", None)
        if values is None:
            raise ValueError("Embedding response missing 'values'.")
        return list(values)

    async def embed_document(self, doc: str) -> List[float]:
        """Embeds a single document."""
        response = await client.aio.models.embed_content(
            model=self.model_name,
            contents=doc,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
        )
        return self._extract_embedding_values(response)

    async def embed_query(self, query: str) -> List[float]:
        """Embeds a query for similarity search."""
        response = await client.aio.models.embed_content(
            model=self.model_name,
            contents=query,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
        )
        return self._extract_embedding_values(response)

embedding_service = EmbeddingService()

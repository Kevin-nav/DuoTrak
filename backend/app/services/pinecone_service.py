# backend/app/services/pinecone_service.py

import os
from pinecone import Pinecone, ServerlessSpec
from typing import List, Dict, Any

class PineconeService:
    def __init__(self):
        self.api_key = os.environ.get("PINECONE_API_KEY")
        self.index_name = os.environ.get("PINECONE_INDEX_NAME", "duotrak-user-model-data")
        
        if not self.api_key:
            raise ValueError("PINECONE_API_KEY environment variable is not set.")
            
        self.pc = Pinecone(api_key=self.api_key)
        
        if self.index_name not in self.pc.list_indexes().names():
            # Using a valid dimension for llama-text-embed-v2
            self.pc.create_index(
                name=self.index_name, 
                dimension=768, 
                metric="cosine",
                spec=ServerlessSpec(cloud='aws', region='us-west-2')
            )
            
        self.index = self.pc.Index(self.index_name)

    def upsert_behavioral_snapshot(self, user_id: str, vector: List[float], metadata: Dict[str, Any]):
        """Upserts a user's behavioral snapshot vector into the Pinecone index."""
        self.index.upsert(
            vectors=[
                {
                    "id": f"{user_id}-{metadata.get('week_id', 'snapshot')}",
                    "values": vector,
                    "metadata": {"user_id": user_id, **metadata}
                }
            ]
        )

    def query_relevant_snapshots(self, user_id: str, query_vector: List[float], top_k: int = 3) -> List[Dict[str, Any]]:
        """Queries for the most relevant behavioral snapshots for a user using a text query."""
        results = self.index.query(
            vector=query_vector,
            filter={"user_id": {"$eq": user_id}},
            top_k=top_k,
            include_metadata=True
        )
        return [match['metadata'] for match in results['matches']]

pinecone_service = PineconeService()

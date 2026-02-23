# backend/tests/test_pinecone_service.py

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
import time
import uuid
from app.services.pinecone_service import PineconeService
from app.services.embedding_service import EmbeddingService
import asyncio
from app.core.config import settings

@pytest.fixture(scope="module")
def pinecone_service():
    """Initializes the PineconeService for testing."""
    return PineconeService(
        api_key=settings.PINECONE_API_KEY,
        environment="aws",
        index_name=settings.PINECONE_INDEX_NAME,
    )

@pytest.mark.live
async def test_upsert_and_query(pinecone_service: PineconeService):
    """
    Tests the full lifecycle of upserting a document and querying it back.
    This is a live test and requires a connection to Pinecone.
    """
    embedding_service = EmbeddingService()

    # 1. Define test data
    user_id = f"test-user-{uuid.uuid4()}"
    snapshot_doc = "This user is a Marathoner who excels at long-term fitness goals."
    metadata = {"archetype": "Marathoner", "test_run_id": str(uuid.uuid4()), "text": snapshot_doc}
    query_text = "What is this user's history with fitness?"

    # 2. Embed the document
    vector = await embedding_service.embed_document(snapshot_doc)

    # 3. Upsert the data to Pinecone
    print(f"\nUpserting document for user {user_id}...")
    pinecone_service.upsert_behavioral_snapshot(user_id, vector, metadata)

    # 4. Wait for the index to update
    print("Waiting 10 seconds for Pinecone index to update...")
    await asyncio.sleep(10)

    # 5. Query the data back
    print(f"Querying for relevant documents for user {user_id}...")
    query_vector = await embedding_service.embed_query(query_text)
    results = pinecone_service.query_relevant_snapshots(user_id, query_vector, top_k=1)

    # 6. Assert the results
    print(f"Received results: {results}")
    assert isinstance(results, list), "Result should be a list"
    assert len(results) > 0, "Should have received at least one result"
    
    retrieved_metadata = results[0]
    assert retrieved_metadata["user_id"] == user_id
    assert retrieved_metadata["archetype"] == metadata["archetype"]
    assert retrieved_metadata["text"] == snapshot_doc
    assert retrieved_metadata["test_run_id"] == metadata["test_run_id"]

    print("✅ Pinecone upsert and query test successful!")

# backend/app/services/pinecone_service.py
from pinecone import Pinecone, ServerlessSpec
import asyncio
import json
import hashlib
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
import numpy as np

from app.core.config import settings
from app.services.gemini_config import GeminiModelConfig

logger = logging.getLogger(__name__)

class PineconeService:
    """Duotrak's long-term memory system using Pinecone vector database."""
    
    def __init__(self, api_key: str, environment: str, index_name: str = "duotrak-goals"):
        self.api_key = api_key
        self.environment = environment
        self.index_name = index_name
        self.pc = None
        self.index = None
        
    async def initialize(self):
        """Initialize Pinecone connection and ensure index exists."""
        try:
            self.pc = Pinecone(api_key=self.api_key)
            
            existing_indexes = [idx['name'] for idx in self.pc.list_indexes()]
            
            if self.index_name not in existing_indexes:
                logger.info(f"🔧 Creating Pinecone index: {self.index_name}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=768,  # Standard embedding dimension for many models
                    metric='cosine',
                    spec=ServerlessSpec(cloud='aws', region='us-west-2')
                )
                await asyncio.sleep(10)
            
            self.index = self.pc.Index(self.index_name)
            logger.info(f"📚 Connected to Duotrak memory: {self.index_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Pinecone: {str(e)}")
            raise
    
    def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector from text content."""
        # THIS IS A PLACEHOLDER. In production, use a real embedding model.
        text_hash = hashlib.md5(text.encode()).hexdigest()
        np.random.seed(int(text_hash[:8], 16))
        return np.random.rand(768).tolist()
    
    async def get_user_context(
        self, 
        user_id: str, 
        limit: int = 15,
        include_partner_dynamics: bool = True
    ) -> Dict[str, Any]:
        """Retrieve comprehensive user context for goal planning."""
        try:
            query_vector = self._generate_embedding(f"user_profile_{user_id}")
            
            query_response = await asyncio.to_thread(
                self.index.query,
                vector=query_vector,
                filter={"user_id": user_id},
                top_k=limit,
                include_metadata=True
            )
            
            if not query_response.matches:
                return {"user_id": user_id, "historical_goals": [], "learning_confidence": 0.0}
            
            # Process historical data
            historical_goals, partner_dynamics = [], {}
            success_patterns, failure_patterns = [], []
            
            for match in query_response.matches:
                metadata = match.metadata
                interaction_type = metadata.get("interaction_type", "")
                
                if interaction_type == "goal_creation":
                    historical_goals.append(metadata)
                    if metadata.get("success_score", 0) >= 8:
                        success_patterns.extend(metadata.get("success_factors", []))
                    else:
                        failure_patterns.extend(metadata.get("failure_reasons", []))
                
                elif interaction_type == "goal_feedback" and include_partner_dynamics:
                    feedback = metadata.get("feedback_data", {})
                    if feedback.get("partner_integration_score", 0) >= 8:
                        partner_dynamics.setdefault("effective", []).append(feedback.get("partner_strategy"))
                    elif feedback.get("partner_integration_score", 0) <= 4:
                        partner_dynamics.setdefault("ineffective", []).append(feedback.get("partner_strategy"))

            recent_goals = [g for g in historical_goals if self._is_recent(g.get("timestamp"))]
            confidence = min(len(recent_goals) / 5.0, 1.0)
            
            return {
                "user_id": user_id,
                "historical_goals": historical_goals[-10:],
                "behavioral_patterns": {
                    "total_goals": len(historical_goals),
                    "avg_success_score": np.mean([g.get("success_score", 0) for g in historical_goals]) if historical_goals else 0,
                },
                "partner_dynamics": partner_dynamics,
                "success_factors": list(set(success_patterns))[:5],
                "risk_factors": list(set(failure_patterns))[:5],
                "learning_confidence": confidence
            }
            
        except Exception as e:
            logger.error(f"Error retrieving user context: {str(e)}")
            return {"user_id": user_id, "historical_goals": [], "learning_confidence": 0.0}
    
    async def store_interaction(self, user_id: str, session_id: str, interaction_type: str, data: Dict[str, Any]):
        """Store user interaction for continuous learning."""
        try:
            interaction_id = f"{user_id}_{session_id}_{interaction_type}_{int(datetime.now().timestamp())}"
            text_content = json.dumps(data, default=str)
            embedding = self._generate_embedding(text_content)
            
            metadata = {"user_id": user_id, "session_id": session_id, "interaction_type": interaction_type, "timestamp": datetime.now().isoformat(), **data}
            
            await asyncio.to_thread(self.index.upsert, vectors=[(interaction_id, embedding, metadata)])
            logger.info(f"Stored interaction {interaction_id} for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error storing interaction: {str(e)}")
            raise
    
    async def store_goal_feedback(self, session_id: str, user_id: str, feedback_data: Dict[str, Any]):
        await self.store_interaction(user_id, session_id, "goal_feedback", {"feedback_data": feedback_data})
    
    async def get_comprehensive_user_profile(self, user_id: str) -> Dict[str, Any]:
        context = await self.get_user_context(user_id, limit=25)
        archetype = self._determine_archetype(context)
        
        return {
            "archetype": archetype,
            "success_patterns": context.get("success_factors", []),
            "risk_factors": context.get("risk_factors", []),
            "partner_dynamics": context.get("partner_dynamics", {}),
            "history_summary": {
                "total_goals": context.get("behavioral_patterns", {}).get("total_goals", 0),
                "success_rate": context.get("behavioral_patterns", {}).get("avg_success_score", 0) / 10,
            },
            "confidence_score": context.get("learning_confidence", 0.0)
        }
    
    def _is_recent(self, timestamp_str: str, days: int = 90) -> bool:
        try:
            return datetime.now() - datetime.fromisoformat(timestamp_str) <= timedelta(days=days)
        except:
            return False

    def _determine_archetype(self, context: Dict[str, Any]) -> str:
        patterns = context.get("behavioral_patterns", {})
        total_goals = patterns.get("total_goals", 0)
        avg_success = patterns.get("avg_success_score", 0)
        
        if total_goals == 0: return "Newcomer"
        if avg_success >= 8: return "Achiever"
        if avg_success >= 6: return "Steady Climber"
        if total_goals > 5: return "Persistent Learner"
        return "Getting Started"
    
    async def close(self):
        logger.info("Pinecone service closed")

    async def get_historical_snapshots(self, user_id: str, weeks: int) -> List[Dict[str, Any]]:
        """Retrieves the most recent behavioral snapshots for a user."""
        try:
            # A simple query to get the latest snapshots. A real implementation might use a more complex query.
            query_vector = self._generate_embedding(f"user_snapshots_{user_id}")
            
            query_response = await asyncio.to_thread(
                self.index.query,
                vector=query_vector,
                filter={"user_id": user_id, "interaction_type": "behavioral_snapshot"},
                top_k=weeks,
                include_metadata=True
            )
            
            return [match.metadata for match in query_response.matches]
        except Exception as e:
            logger.error(f"Error retrieving historical snapshots for user {user_id}: {e}")
            return []

    async def upsert_behavioral_snapshot(self, user_id: str, vector: List[float], snapshot: 'BehavioralSnapshot'):
        """Upserts a new behavioral snapshot into Pinecone."""
        try:
            snapshot_id = f"{user_id}_snapshot_{int(datetime.now().timestamp())}"
            metadata = {
                "user_id": user_id,
                "interaction_type": "behavioral_snapshot",
                "timestamp": datetime.now().isoformat(),
                **snapshot.dict()
            }
            
            await asyncio.to_thread(self.index.upsert, vectors=[(snapshot_id, vector, metadata)])
            logger.info(f"Upserted new behavioral snapshot {snapshot_id} for user {user_id}")
        except Exception as e:
            logger.error(f"Error upserting snapshot for user {user_id}: {e}")
            raise

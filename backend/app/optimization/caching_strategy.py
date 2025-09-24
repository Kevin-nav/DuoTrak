# backend/app/optimization/caching_strategy.py

import redis
import json
from typing import Dict, Any, Optional
from datetime import datetime
import os

class IntelligentCachingSystem:
    def __init__(self):
        self.redis_client = redis.Redis.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379"))
        self.cache_ttl = {
            'user_profile': 3600,  # 1 hour
        }
    
    def get_cached_user_profile(self, user_id: str, goal_context: str) -> Optional[Dict]:
        """Gets a cached user profile if it exists and is valid."""
        cache_key = f"user_profile:{user_id}:{hash(goal_context)}"
        cached_data = self.redis_client.get(cache_key)
        
        if cached_data:
            return json.loads(cached_data)
        return None
    
    def cache_user_profile(self, user_id: str, goal_context: str, profile: Dict):
        """Caches a user profile with a standard TTL."""
        cache_key = f"user_profile:{user_id}:{hash(goal_context)}"
        self.redis_client.setex(
            cache_key, 
            self.cache_ttl['user_profile'], 
            json.dumps(profile, default=lambda o: o.__dict__)
        )

caching_system = IntelligentCachingSystem()

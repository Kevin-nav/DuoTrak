# backend/app/security/input_validator.py

import bleach
import re
from typing import Dict, Any, Optional
from pydantic import BaseModel, validator
import logging

class SecureGoalRequest(BaseModel):
    goal_title: str
    user_responses: Dict[str, Any]
    user_id: str
    
    @validator('goal_title')
    def sanitize_goal_title(cls, v):
        # Remove HTML/script tags
        clean_title = bleach.clean(v, tags=[], strip=True)
        # Limit length and validate characters
        if len(clean_title) > 200:
            raise ValueError("Goal title too long")
        if not re.match(r'^[a-zA-Z0-9\s\-_.,!?]+$', clean_title):
            raise ValueError("Goal title contains invalid characters")
        return clean_title
    
    @validator('user_responses')
    def sanitize_responses(cls, v):
        sanitized = {}
        for key, value in v.items():
            if isinstance(value, str):
                sanitized[key] = bleach.clean(value, tags=[], strip=True)[:1000]
            else:
                sanitized[key] = value
        return sanitized

# Note: The SecurityManager class from the design doc will be implemented
# in a separate file to handle orchestration of security components.
# This file focuses solely on input validation schemas.

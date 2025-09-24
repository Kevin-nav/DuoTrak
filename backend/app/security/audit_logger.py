# backend/app/security/audit_logger.py

import logging
from typing import Dict, Any

logger = logging.getLogger("audit")

class AuditLogger:
    def log_rate_limit_exceeded(self, user_id: str):
        logger.warning(f"RATE_LIMIT_EXCEEDED: User '{user_id}'")

    def log_sensitive_content(self, user_id: str, content: str):
        logger.warning(f"SENSITIVE_CONTENT_DETECTED: User '{user_id}', Content: '{content[:100]}...'")

    def log_unauthorized_access(self, user_id: str):
        logger.error(f"UNAUTHORIZED_ACCESS_ATTEMPT: User '{user_id}'")

    def log_agent_start(self, agent_name: str, user_id: str):
        logger.info(f"AGENT_START: Agent '{agent_name}' for User '{user_id}'")

    def log_agent_error(self, agent_name: str, user_id: str, error: str):
        logger.error(f"AGENT_ERROR: Agent '{agent_name}' for User '{user_id}', Error: {error}")

    def log_agent_complete(self, agent_name: str, user_id: str, execution_time: float):
        logger.info(f"AGENT_COMPLETE: Agent '{agent_name}' for User '{user_id}', Duration: {execution_time:.2f}s")

    def log_goal_creation_event(self, event_data: Dict[str, Any]):
        # In a real system, you would hash the user_id and other PII
        logger.info(f"GOAL_CREATION_EVENT: User '{event_data.get('user_id')}', Category: '{event_data.get('goal_category')}'")

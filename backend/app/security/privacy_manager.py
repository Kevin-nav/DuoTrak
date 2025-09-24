# backend/app/security/privacy_manager.py

import hashlib
import hmac
from cryptography.fernet import Fernet
from typing import Dict, Any
import os

class PrivacyManager:
    def __init__(self):
        self.encryption_key = os.environ.get('GOAL_COACH_ENCRYPTION_KEY')
        if not self.encryption_key:
            raise ValueError("GOAL_COACH_ENCRYPTION_KEY environment variable is not set.")
        self.fernet = Fernet(self.encryption_key.encode()) # Fernet key must be bytes
    
    def anonymize_user_data(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Create anonymized profile for AI processing"""
        anonymized = {
            'user_hash': self.hash_user_id(user_profile['id']),
            'behavioral_metrics': user_profile.get('behavioral_metrics', {}),
            'temporal_patterns': user_profile.get('temporal_patterns', {}),
            'goal_preferences': user_profile.get('goal_preferences', {}),
            # Remove PII
            'timezone': user_profile.get('timezone'),
            'partner_present': bool(user_profile.get('partner_full_name'))
        }
        return anonymized
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data for storage"""
        return self.fernet.encrypt(data.encode()).decode()
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data for processing"""
        return self.fernet.decrypt(encrypted_data.encode()).decode()
    
    def hash_user_id(self, user_id: str) -> str:
        """Create consistent hash for user identification"""
        # Key for HMAC must be bytes
        key_bytes = self.encryption_key.encode()
        return hmac.new(
            key_bytes, 
            user_id.encode(), 
            hashlib.sha256
        ).hexdigest()

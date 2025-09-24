# backend/app/ai/gemini_model_manager.py

import google.generativeai as genai
from google.generativeai import types
from typing import Dict, Any, Optional
import asyncio
import time
import os
import json

class GeminiModelManager:
    """Manages Gemini model usage with intelligent resource allocation"""
    
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set.")
        
        genai.configure(api_key=self.api_key)

        # Configurable model names
        flash_model_name = os.environ.get('GEMINI_FLASH_MODEL', 'gemini-1.5-flash')
        pro_model_name = os.environ.get('GEMINI_PRO_MODEL', 'gemini-1.5-pro')

        # Configurable thinking budgets
        flash_thinking_budget = int(os.environ.get('GEMINI_FLASH_THINKING_BUDGET', 0))
        pro_thinking_budget = int(os.environ.get('GEMINI_PRO_THINKING_BUDGET', -1))

        self.models = {
            'flash': genai.GenerativeModel(flash_model_name),
            'pro': genai.GenerativeModel(pro_model_name),
        }
        
        self.configs = {
            'fast_classification': types.GenerationConfig(
                temperature=0.1,
                response_mime_type="application/json",
            ),
            'deep_analysis': types.GenerationConfig(
                temperature=0.3,
                response_mime_type="application/json",
            ),
            'creative_generation': types.GenerationConfig(
                temperature=0.7,
                response_mime_type="application/json",
            ),
            'critical_analysis': types.GenerationConfig(
                temperature=0.2,
                response_mime_type="application/json",
            )
        }
    
    async def execute_with_model(self, 
                                model_type: str, 
                                config_type: str, 
                                prompt: str,
                                ) -> Dict[str, Any]:
        """Execute prompt with specified model and configuration"""
        
        model = self.models.get(model_type)
        config = self.configs.get(config_type)
        
        if not model or not config:
            raise ValueError(f"Invalid model type '{model_type}' or config type '{config_type}'")
        
        start_time = time.time()
        
        try:
            response = await model.generate_content_async(
                prompt,
                generation_config=config
            )
            
            execution_time = time.time() - start_time
            
            return {
                'content': json.loads(response.text),
                'model_used': model_type,
                'config_used': config_type,
                'execution_time': execution_time,
                'success': True
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'model_used': model_type,
                'config_used': config_type,
                'execution_time': time.time() - start_time,
                'success': False
            }

gemini_manager = GeminiModelManager()

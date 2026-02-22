# backend/app/ai/gemini_model_manager.py

from google import genai
from google.genai import types
from typing import Dict, Any, Optional
import asyncio
import time
import os
import json
import logging
from .cost_calculator import cost_calculator
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from google.api_core import exceptions as google_exceptions

class GeminiModelManager:
    """Manages Gemini model usage with the new google-genai SDK"""
    
    def __init__(self):
        # Initialize client with API key from environment
        api_key = os.environ.get('GOOGLE_API_KEY') or os.environ.get('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GOOGLE_API_KEY or GEMINI_API_KEY is not set in environment variables.")
        
        try:
            self.client = genai.Client(api_key=api_key)
        except Exception as e:
            raise ValueError(f"Failed to initialize Gemini Client. Error: {e}")

        # Model names are now passed directly in the generation call
        self.model_names = {
            'flash': os.environ.get('GEMINI_FLASH_MODEL', 'gemini-3-flash'),
            # Flash-only policy: any legacy "pro" call is routed to flash.
            'pro': os.environ.get('GEMINI_FLASH_MODEL', 'gemini-3-flash'),
        }
        
        # Use GenerateContentConfig instead of GenerationConfig to avoid the tools issue
        self.configs = {
            'fast_classification': types.GenerateContentConfig(
                temperature=0.1,
                response_mime_type="application/json",
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            'deep_analysis': types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json",
                thinking_config=types.ThinkingConfig(thinking_budget=2000)  # Data-driven budget
            ),
            'creative_generation': types.GenerateContentConfig(
                temperature=0.7,
                response_mime_type="application/json",
                thinking_config=types.ThinkingConfig(thinking_budget=4000)  # Data-driven budget
            ),
            'critical_analysis': types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type="application/json",
                thinking_config=types.ThinkingConfig(thinking_budget=0)  # Disabled thinking for speed
            )
        }
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((google_exceptions.ServiceUnavailable, google_exceptions.RetryError))
    )
    async def execute_with_model(self, 
                                model_type: str, 
                                config_type: str, 
                                prompt: str,
                                ) -> Dict[str, Any]:
        """Execute prompt with specified model and configuration using the correct SDK approach."""
        
        if model_type not in {"flash", "pro"}:
            raise ValueError(f"Invalid model type '{model_type}'")
        if model_type == "pro":
            logging.warning("Flash-only policy enabled. Routing requested 'pro' call to Gemini 3 Flash.")
        model_name = self.model_names["flash"]
        config = self.configs.get(config_type)
        
        if not model_name or not config:
            raise ValueError(f"Invalid model type '{model_type}' or config type '{config_type}'")
        
        start_time = time.time()
        
        try:
            # Each call creates a new, single-use chat session to ensure stateless, independent agent interactions.
            chat = self.client.aio.chats.create(
                model=model_name,
                config=config
            )
            
            # Send the message and get response
            response = await chat.send_message(prompt)
            
            execution_time = time.time() - start_time
            
            # Extract token usage from usage_metadata
            usage_metadata = response.usage_metadata if hasattr(response, 'usage_metadata') else None
            
            try:
                if usage_metadata:
                    input_tokens = getattr(usage_metadata, 'prompt_token_count', 0)
                    output_tokens = getattr(usage_metadata, 'candidates_token_count', 0)
                    thoughts_tokens = getattr(usage_metadata, 'thoughts_token_count', 0)
                    # Handle case where thoughts_tokens might be None
                    thoughts_tokens_val = thoughts_tokens if thoughts_tokens is not None else 0
                    total_tokens = getattr(usage_metadata, 'total_token_count', input_tokens + output_tokens + thoughts_tokens_val)
                else:
                    # Fallback if usage metadata is not available
                    logging.warning(f"Usage metadata not found in response for model {model_name}. Token counts will be zero.")
                    input_tokens = output_tokens = thoughts_tokens = total_tokens = 0
            except TypeError:
                logging.error(f"TypeError during token extraction. Raw usage_metadata: {usage_metadata}")
                input_tokens = output_tokens = thoughts_tokens = total_tokens = 0


            # Calculate cost
            cost = cost_calculator.calculate_cost(
                model_name=model_name,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                thoughts_tokens=thoughts_tokens
            )

            # Parse the response text as JSON
            try:
                content = json.loads(response.text)
            except json.JSONDecodeError:
                # If it's not valid JSON, wrap it in a structure
                content = {"response": response.text}

            return {
                'content': content,
                'model_used': model_name,
                'config_used': config_type,
                'execution_time': execution_time,
                'input_tokens': input_tokens,
                'output_tokens': output_tokens,
                'thoughts_tokens': thoughts_tokens,
                'total_tokens': total_tokens,
                'cost': cost,
                'success': True
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'model_used': model_name,
                'config_used': config_type,
                'execution_time': time.time() - start_time,
                'success': False
            }

    def create_custom_config(self, 
                           temperature: float = 0.3,
                           thinking_budget: int = 10000,
                           response_mime_type: str = "application/json") -> types.GenerateContentConfig:
        """
        Create a custom configuration with full control over thinking budget and other parameters.
        
        Args:
            temperature: Controls randomness (0.0 to 1.0)
            thinking_budget: Token budget for model's internal thinking (0 to disable)
            response_mime_type: MIME type for the response format
        
        Returns:
            GenerateContentConfig object
        """
        return types.GenerateContentConfig(
            temperature=temperature,
            response_mime_type=response_mime_type,
            thinking_config=types.ThinkingConfig(thinking_budget=thinking_budget)
        )

    async def execute_with_custom_config(self, 
                                       model_type: str,
                                       prompt: str,
                                       custom_config: types.GenerateContentConfig) -> Dict[str, Any]:
        """
        Execute with a completely custom configuration for maximum flexibility.
        """
        if model_type not in {"flash", "pro"}:
            raise ValueError(f"Invalid model type '{model_type}'")
        if model_type == "pro":
            logging.warning("Flash-only policy enabled. Routing requested 'pro' call to Gemini 3 Flash.")
        model_name = self.model_names["flash"]
        
        start_time = time.time()
        
        try:
            chat = self.client.aio.chats.create(
                model=model_name,
                config=custom_config
            )
            
            response = await chat.send_message(prompt)
            execution_time = time.time() - start_time
            
            # Extract metrics
            usage_metadata = response.usage_metadata if hasattr(response, 'usage_metadata') else None
            
            try:
                if usage_metadata:
                    input_tokens = getattr(usage_metadata, 'prompt_token_count', 0)
                    output_tokens = getattr(usage_metadata, 'candidates_token_count', 0)
                    thoughts_tokens = getattr(usage_metadata, 'thoughts_token_count', 0)
                    thoughts_tokens_val = thoughts_tokens if thoughts_tokens is not None else 0
                    total_tokens = getattr(usage_metadata, 'total_token_count', input_tokens + output_tokens + thoughts_tokens_val)
                else:
                    logging.warning(f"Usage metadata not found in custom config response for model {model_name}. Token counts will be zero.")
                    input_tokens = output_tokens = thoughts_tokens = total_tokens = 0
            except TypeError:
                logging.error(f"TypeError during token extraction in custom config. Raw usage_metadata: {usage_metadata}")
                input_tokens = output_tokens = thoughts_tokens = total_tokens = 0


            cost = cost_calculator.calculate_cost(
                model_name=model_name,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                thoughts_tokens=thoughts_tokens
            )

            try:
                content = json.loads(response.text)
            except json.JSONDecodeError:
                content = {"response": response.text}

            return {
                'content': content,
                'model_used': model_name,
                'config_used': 'custom',
                'execution_time': execution_time,
                'input_tokens': input_tokens,
                'output_tokens': output_tokens,
                'thoughts_tokens': thoughts_tokens,
                'total_tokens': total_tokens,
                'cost': cost,
                'success': True
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'model_used': model_name,
                'config_used': 'custom',
                'execution_time': time.time() - start_time,
                'success': False
            }

gemini_manager = GeminiModelManager()

# backend/app/ai/cost_calculator.py

class CostCalculator:
    """Calculates the cost of Gemini API calls based on token usage."""

    def __init__(self):
        self.pricing = {
            "gemini-2.5-pro": {
                "input_less_than_200k": 1.25 / 1_000_000,
                "input_greater_than_200k": 2.50 / 1_000_000,
                "output_less_than_200k": 10.00 / 1_000_000,
                "output_greater_than_200k": 15.00 / 1_000_000,
                "thoughts": 1.25 / 1_000_000, # Assumed to be same as input
            },
            "gemini-2.5-flash": {
                "input": 0.30 / 1_000_000,
                "output": 2.50 / 1_000_000,
                "thoughts": 0.30 / 1_000_000, # Assumed to be same as input
            },
            # Fallback for older models if they are used
            "gemini-1.5-pro": {
                "input_less_than_128k": 3.50 / 1_000_000,
                "input_greater_than_128k": 7.00 / 1_000_000,
                "output": 10.50 / 1_000_000,
                "thoughts": 3.50 / 1_000_000, # Assumed to be same as input
            },
            "gemini-1.5-flash": {
                "input": 0.35 / 1_000_000,
                "output": 0.70 / 1_000_000,
                "thoughts": 0.35 / 1_000_000, # Assumed to be same as input
            }
        }

    def calculate_cost(self, model_name: str, input_tokens: int, output_tokens: int, thoughts_tokens: int = 0) -> float:
        """
        Calculates the cost of a single API call.

        Args:
            model_name: The name of the model used (e.g., 'gemini-2.5-pro').
            input_tokens: The number of tokens in the prompt.
            output_tokens: The number of tokens in the generated response.
            thoughts_tokens: The number of tokens used for the model's internal thinking.

        Returns:
            The calculated cost in USD.
        """
        if model_name not in self.pricing:
            # Try to find a partial match
            for key in self.pricing:
                if key in model_name:
                    model_name = key
                    break
            else:
                return 0.0 # Model not found in pricing table

        model_pricing = self.pricing[model_name]
        cost = 0.0

        # Add cost for thought tokens
        if thoughts_tokens > 0:
            cost += thoughts_tokens * model_pricing.get("thoughts", 0)

        if "pro" in model_name:
            total_tokens = input_tokens + output_tokens
            if "2.5" in model_name:
                if total_tokens <= 200_000:
                    cost += input_tokens * model_pricing["input_less_than_200k"]
                    cost += output_tokens * model_pricing["output_less_than_200k"]
                else:
                    cost += input_tokens * model_pricing["input_greater_than_200k"]
                    cost += output_tokens * model_pricing["output_greater_than_200k"]
            else: # 1.5 pro
                if total_tokens <= 128_000:
                    cost += input_tokens * model_pricing["input_less_than_128k"]
                else:
                    cost += input_tokens * model_pricing["input_greater_than_128k"]
                cost += output_tokens * model_pricing["output"]

        elif "flash" in model_name:
            cost += input_tokens * model_pricing["input"]
            cost += output_tokens * model_pricing["output"]

        return cost

# Global instance for easy access
cost_calculator = CostCalculator()

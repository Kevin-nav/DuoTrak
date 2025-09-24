# backend/app/experimentation/ab_testing.py

from enum import Enum
from typing import Dict, Any, Optional
import hashlib
from datetime import datetime

class ExperimentStatus(Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"

class ABTestingFramework:
    def __init__(self):
        self.experiments = {} # In a real system, this would be in a DB
        self.user_assignments = {} # In a real system, this would be in Redis

    def create_experiment(self, experiment_config: Dict[str, Any]) -> str:
        """Creates a new A/B test experiment."""
        experiment_id = hashlib.md5(experiment_config['name'].encode()).hexdigest()
        self.experiments[experiment_id] = {
            'name': experiment_config['name'],
            'variants': experiment_config['variants'],
            'status': ExperimentStatus.ACTIVE,
            'results': {variant: {"impressions": 0, "conversions": 0} for variant in experiment_config['variants']},
        }
        return experiment_id

    def get_user_variant(self, user_id: str, experiment_id: str) -> Optional[str]:
        """Gets the assigned variant for a user in an experiment."""
        experiment = self.experiments.get(experiment_id)
        if not experiment or experiment['status'] != ExperimentStatus.ACTIVE:
            return None

        # Consistent hashing for user assignment
        hash_input = f"{user_id}:{experiment_id}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        
        variant_names = list(experiment['variants'].keys())
        assigned_variant = variant_names[hash_value % len(variant_names)]
        
        self.user_assignments[f"{user_id}:{experiment_id}"] = assigned_variant
        return assigned_variant

    def track_conversion(self, user_id: str, experiment_id: str):
        """Tracks a conversion event for an experiment."""
        variant = self.user_assignments.get(f"{user_id}:{experiment_id}")
        if variant:
            self.experiments[experiment_id]['results'][variant]['conversions'] += 1

ab_testing_framework = ABTestingFramework()

# Example Experiment
ab_testing_framework.create_experiment({
    "name": "GoalStrategistModel",
    "variants": {"gemini-1.5-flash": 0.5, "gemini-1.5-pro": 0.5},
})

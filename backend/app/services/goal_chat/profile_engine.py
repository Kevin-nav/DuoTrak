from typing import Dict, List, Optional

from app.schemas.goal_chat import GoalChatProfileState, SelfProfilePrompt


DEFAULT_BEHAVIORAL_SUMMARY = "Behavioral summary pending. Collect self-profile answers to personalize guidance."


class ProfileEngine:
    SELF_PROFILE_PROMPTS: List[SelfProfilePrompt] = [
        SelfProfilePrompt(
            prompt_id="energy_pattern",
            question="When during the day do you reliably have your best energy for focused effort?",
        ),
        SelfProfilePrompt(
            prompt_id="friction_trigger",
            question="What is the most common reason you skip or delay important tasks?",
        ),
        SelfProfilePrompt(
            prompt_id="support_style",
            question="What type of partner check-in helps you stay consistent?",
        ),
    ]

    def build_initial_profile(self, behavioral_summary: Optional[str] = None) -> GoalChatProfileState:
        summary = (behavioral_summary or "").strip() or DEFAULT_BEHAVIORAL_SUMMARY
        return GoalChatProfileState(
            behavioral_summary=summary,
            self_profile_prompts=self.SELF_PROFILE_PROMPTS,
            answers={},
            merged_summary=summary,
        )

    def merge(self, profile: GoalChatProfileState, new_answers: Dict[str, str]) -> GoalChatProfileState:
        merged_answers = dict(profile.answers)
        for key, value in new_answers.items():
            if not value or not value.strip():
                continue
            merged_answers[key] = value.strip()

        merged_summary = self._build_summary(profile.behavioral_summary, merged_answers)
        return GoalChatProfileState(
            behavioral_summary=profile.behavioral_summary,
            self_profile_prompts=profile.self_profile_prompts,
            answers=merged_answers,
            merged_summary=merged_summary,
        )

    @staticmethod
    def _build_summary(behavioral_summary: str, answers: Dict[str, str]) -> str:
        if not answers:
            return behavioral_summary
        answer_fragments = [f"{key}: {answers[key]}" for key in sorted(answers)]
        return f"{behavioral_summary} | Self profile: {'; '.join(answer_fragments)}"

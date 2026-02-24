import time
from typing import Any, Dict, List, Optional

from app.services.goal_creation_session_store import GoalCreationSessionStore


# ─── Goal-type-specific domain knowledge ───

HABIT_QUESTIONS = [
    {
        "question": "What's the absolute minimum version of this habit you can commit to — even on your worst day?",
        "question_key": "minimum_viable_habit",
        "context": "Research shows the 'tiny habits' approach prevents early dropoff.",
        "suggested_answers": ["2-minute version", "Just show up", "Half the normal effort"],
        "allow_custom_answer": True,
    },
    {
        "question": "What existing habit will you anchor this new one to?",
        "question_key": "habit_anchor",
        "context": "Habit stacking dramatically increases stick rate.",
        "suggested_answers": ["After morning coffee", "Before bed", "After lunch"],
        "allow_custom_answer": True,
    },
    {
        "question": "What reward will you give yourself after completing it?",
        "question_key": "habit_reward",
        "context": "Immediate rewards strengthen the habit loop.",
        "suggested_answers": ["Check it off my list", "5 min of something fun", "Tell my partner"],
        "allow_custom_answer": True,
    },
]

MILESTONE_QUESTIONS = [
    {
        "question": "What does 'done' look like? Describe the deliverable.",
        "question_key": "definition_of_done",
        "context": "Clear deliverables prevent scope creep and keep you focused.",
        "suggested_answers": ["Specific output/artifact", "Measured outcome", "Event completion"],
        "allow_custom_answer": True,
    },
    {
        "question": "What's the first checkpoint that shows real progress?",
        "question_key": "first_checkpoint",
        "context": "Early wins build momentum for larger milestones.",
        "suggested_answers": ["25% of total", "First deliverable", "Proof of concept"],
        "allow_custom_answer": True,
    },
    {
        "question": "What's the biggest risk that could block you?",
        "question_key": "biggest_blocker",
        "context": "Pre-identifying blockers lets us build mitigation into your plan.",
        "suggested_answers": ["Time constraints", "Skill gap", "Dependencies on others"],
        "allow_custom_answer": True,
    },
]

TARGET_DATE_QUESTIONS = [
    {
        "question": "What's your current starting level?",
        "question_key": "current_level",
        "context": "Knowing where you are lets us build a progressive ramp-up.",
        "suggested_answers": ["Complete beginner", "Some experience", "Intermediate"],
        "allow_custom_answer": True,
    },
    {
        "question": "How many hours per week can you dedicate to this?",
        "question_key": "weekly_hours",
        "context": "Calibrates intensity and prevents burnout across training phases.",
        "suggested_answers": ["3-5 hours", "5-8 hours", "8+ hours"],
        "allow_custom_answer": True,
    },
    {
        "question": "Do you have any rest/recovery constraints?",
        "question_key": "recovery_constraints",
        "context": "Periodized plans need recovery windows for sustainable progress.",
        "suggested_answers": ["No constraints", "Need full rest days", "Have injury considerations"],
        "allow_custom_answer": True,
    },
]


class LangGraphGoalPipeline:
    """
    Goal pipeline with goal-type specialization, template enhancement,
    and structured cadence output:  profile -> questions -> plan -> score.
    """

    def __init__(
        self,
        pinecone_service: Any,
        session_store: GoalCreationSessionStore,
        session_ttl_seconds: int = 900,
    ) -> None:
        self.pinecone_service = pinecone_service
        self.session_store = session_store
        self.session_ttl_seconds = session_ttl_seconds

    async def generate_strategic_questions(
        self,
        user_id: str,
        session_id: str,
        wizard_data: Dict[str, Any],
        user_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        start_time = time.time()

        profile = self._profile_node(wizard_data, user_context)
        questions = self._question_node(wizard_data, user_context, profile)

        await self.session_store.put(
            session_id,
            {
                "user_id": user_id,
                "wizard_data": wizard_data,
                "user_context": user_context,
                "profile_output": profile,
            },
            ttl_seconds=self.session_ttl_seconds,
        )

        return {
            "user_profile_summary": profile,
            "questions": questions,
            "execution_time_ms": (time.time() - start_time) * 1000,
        }

    async def create_goal_plan_from_answers(
        self,
        session_id: str,
        user_id: str,
        answers: Dict[str, str],
    ) -> Dict[str, Any]:
        start_time = time.time()

        session = await self.session_store.get(session_id)
        if session is None:
            raise ValueError("Session not found or expired. Please restart from strategic questions.")

        context = {**session, "strategic_answers": answers, "user_id": user_id}
        goal_plan = self._plan_node(context)
        score = self._score_node(goal_plan, context)

        return {
            "goal_plan": goal_plan,
            "partner_integration": goal_plan.get("partner_accountability", {}),
            "personalization_score": score,
            "execution_time_ms": (time.time() - start_time) * 1000,
        }

    async def create_plan(
        self,
        session_id: str,
        user_id: str,
        answers: Dict[str, str],
    ) -> Dict[str, Any]:
        return await self.create_goal_plan_from_answers(
            session_id=session_id,
            user_id=user_id,
            answers=answers,
        )

    # ─── Internal Nodes ───

    def _profile_node(self, wizard_data: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        has_history = bool(user_context.get("historical_goals"))
        goal_type = wizard_data.get("goal_type", "habit")
        is_template = bool(wizard_data.get("template_enhancement_mode"))

        motivators: List[str] = [wizard_data.get("motivation", "Personal growth")]
        risks: List[str] = ["Time management"]
        if has_history:
            risks.append("Consistency dips from historical patterns")

        archetype = "Steady Climber" if has_history else "Momentum Builder"
        if goal_type == "habit":
            archetype = "Habit Former" if not has_history else "Habit Optimizer"
        elif goal_type == "milestone":
            archetype = "Project Planner"
        elif goal_type == "target-date":
            archetype = "Periodization Athlete" if not has_history else "Experienced Trainer"

        return {
            "archetype": archetype,
            "key_motivators": motivators,
            "risk_factors": risks,
            "confidence_level": 0.72 if has_history else 0.65,
            "goal_type": goal_type,
            "is_template_enhancement": is_template,
        }

    def _question_node(
        self,
        wizard_data: Dict[str, Any],
        user_context: Dict[str, Any],
        profile: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        _ = user_context
        goal_type = wizard_data.get("goal_type", "habit")
        is_template = bool(wizard_data.get("template_enhancement_mode"))
        is_shared = bool(wizard_data.get("is_shared_goal"))

        # Goal-type-specific questions
        if goal_type == "habit":
            questions = list(HABIT_QUESTIONS)
        elif goal_type == "milestone":
            questions = list(MILESTONE_QUESTIONS)
        elif goal_type == "target-date":
            questions = list(TARGET_DATE_QUESTIONS)
        else:
            questions = list(HABIT_QUESTIONS)  # Default to habit

        # Add template-specific question if enhancing a template
        if is_template:
            template_title = wizard_data.get("goal_template_title", "your chosen template")
            questions.insert(0, {
                "question": f"What would you change about the '{template_title}' plan to make it perfect for you?",
                "question_key": "template_customization",
                "context": "Your answer helps us personalize the template to your specific situation.",
                "suggested_answers": ["Make it more intense", "Simplify it", "Adjust the schedule"],
                "allow_custom_answer": True,
            })

        # Add shared-goal question if applicable
        if is_shared:
            partner_name = wizard_data.get("partner_name", "your partner")
            questions.append({
                "question": f"How do you and {partner_name} want to support each other on this?",
                "question_key": "partner_support_style",
                "context": "Aligns mutual accountability expectations.",
                "suggested_answers": ["Daily check-ins", "Weekly review calls", "Just see each other's progress"],
                "allow_custom_answer": True,
            })

        # Common closing question
        questions.append({
            "question": "How should your partner hold you accountable?",
            "question_key": "partner_accountability_style",
            "context": "Aligns accountability mode with your preference.",
            "suggested_answers": ["Daily check-in", "Progress photo", "Weekly recap"],
            "allow_custom_answer": True,
        })

        return questions

    def _plan_node(self, context: Dict[str, Any]) -> Dict[str, Any]:
        wizard_data = context.get("wizard_data", {})
        answers = context.get("strategic_answers", {})
        goal_type = wizard_data.get("goal_type", "habit")
        is_template = bool(wizard_data.get("template_enhancement_mode"))
        title = wizard_data.get("goal_description", "Personal Goal")[:50]

        if is_template:
            template_title = wizard_data.get("goal_template_title", "")
            plan_title = f"{template_title} — Personalized" if template_title else f"Enhanced Plan: {title}"
        else:
            plan_title = f"Your {goal_type.replace('-', ' ').title()} Plan: {title}"

        # Build base plan
        plan: Dict[str, Any] = {
            "goal_type": goal_type,
            "title": plan_title,
            "description": f"Personalized {goal_type} plan built from your answers and profile.",
            "success_metrics": ["Complete planned tasks consistently", "Build sustainable momentum"],
            "adherence_weight": 0.8,
            "schedule_soft_cap_percent": 10,
            "decision_trace": [
                f"Goal type: {goal_type}",
                f"Template enhanced: {is_template}",
                f"Profile: {context.get('profile_output', {}).get('archetype', 'unknown')}",
            ],
        }

        # Template attribution
        if is_template:
            plan["template_source_title"] = wizard_data.get("goal_template_title")
            plan["template_enhanced"] = True
            plan["decision_trace"].append("AI enhanced existing template tasks")

        # ─── Goal-type-specific plan generation ───
        if goal_type == "habit":
            plan.update(self._build_habit_plan(wizard_data, answers))
        elif goal_type == "milestone":
            plan.update(self._build_milestone_plan(wizard_data, answers))
        elif goal_type == "target-date":
            plan.update(self._build_target_date_plan(wizard_data, answers))
        else:
            plan.update(self._build_habit_plan(wizard_data, answers))

        # Shared goal awareness
        if wizard_data.get("is_shared_goal"):
            plan["shared_goal_mode"] = wizard_data.get("shared_goal_mode", "independent")
            partner_tz = wizard_data.get("partner_timezone")
            user_tz = wizard_data.get("timezone")
            if partner_tz and user_tz and partner_tz != user_tz:
                plan["partner_timezone_adjustment"] = f"Tasks adjusted: {user_tz} ↔ {partner_tz}"

        # First day actions
        plan["first_day_actions"] = self._build_first_day_actions(goal_type, wizard_data, answers)
        plan["this_week_preview"] = self._build_week_preview(goal_type, wizard_data)

        # Schedule impact
        plan["schedule_impact"] = {
            "capacity_minutes": 420,
            "projected_load_minutes": 300,
            "overload_percent": 0,
            "conflict_flags": [],
            "fit_band": "good",
        }

        # Partner accountability
        style = answers.get("partner_accountability_style", "Daily check-in")
        plan["partner_accountability"] = {
            "role": "Review partner-submitted proof and support consistency.",
            "check_in_schedule": "daily" if "daily" in style.lower() else "weekly",
            "shared_celebrations": "streak milestones",
        }

        return plan

    # ─── Goal-type-specific builders ───

    def _build_habit_plan(self, wizard_data: Dict[str, Any], answers: Dict[str, str]) -> Dict[str, Any]:
        minimum = answers.get("minimum_viable_habit", "2-minute version")
        anchor = answers.get("habit_anchor", "After morning coffee")

        return {
            "habit_config": {
                "minimum_viable_start": minimum,
                "habit_anchor": anchor,
                "ramp_up_weeks": 3,
                "streak_milestones": [3, 7, 14, 21, 30, 60, 90],
                "allowed_miss_days": 1,
            },
            "milestones": [
                {
                    "title": "Build the Routine",
                    "description": f"Anchor habit: do the minimum ({minimum}) {anchor} every day.",
                    "tasks": [
                        {
                            "description": f"Do {minimum} of your habit",
                            "success_metric": "Complete the minimum viable action",
                            "recommended_cadence": "daily",
                            "recommended_time_windows": [anchor],
                            "consistency_rationale": "Daily repetition is key to habit formation.",
                            "verification_mode": "photo",
                            "verification_mode_reason": "Visual proof builds accountability loop.",
                            "verification_confidence": 0.85,
                            "partner_required": True,
                            "auto_approval_policy": "time_window_only",
                            "auto_approval_timeout_hours": 24,
                            "auto_approval_min_confidence": 0.85,
                            "cadence": {"type": "daily", "days": [], "duration_weeks": None},
                            "difficulty_level": 1,
                            "minimum_viable_action": minimum,
                            "partner_involvement": {
                                "daily_check_in_suggestion": "Confirm habit was done.",
                                "weekly_anchor_review": "Review streak and adjust anchor if needed.",
                                "fallback_if_missed": "No guilt — just reset and try the minimum tomorrow.",
                            },
                            "proof_guidance": {
                                "what_counts": ["Photo of you doing it", "Screenshot of time"],
                                "good_examples": ["Quick selfie during habit", "Timer screenshot"],
                                "avoid_examples": ["Generic stock photos"],
                            },
                        },
                    ],
                },
            ],
        }

    def _build_milestone_plan(self, wizard_data: Dict[str, Any], answers: Dict[str, str]) -> Dict[str, Any]:
        definition = answers.get("definition_of_done", "Complete the project")
        first_cp = answers.get("first_checkpoint", "25% of total")
        blocker = answers.get("biggest_blocker", "Time constraints")

        return {
            "milestone_config": {
                "total_checkpoints": 4,
                "checkpoints": [
                    {"target_label": first_cp, "deadline_description": "End of Week 1"},
                    {"target_label": "50% complete", "deadline_description": "End of Week 2"},
                    {"target_label": "75% complete", "deadline_description": "End of Week 3"},
                    {"target_label": definition, "deadline_description": "End of Week 4"},
                ],
                "critical_path_warning": f"Watch for: {blocker}",
            },
            "milestones": [
                {
                    "title": "Get Started",
                    "description": f"Reach first checkpoint: {first_cp}",
                    "tasks": [
                        {
                            "description": "Complete first deliverable chunk",
                            "success_metric": first_cp,
                            "recommended_cadence": "weekly",
                            "recommended_time_windows": wizard_data.get("availability", ["Weekday evening"]),
                            "consistency_rationale": "Steady weekly progress prevents last-minute rushes.",
                            "verification_mode": "photo",
                            "verification_mode_reason": "Deliverable photos provide objective progress tracking.",
                            "verification_confidence": 0.9,
                            "partner_required": True,
                            "auto_approval_policy": "time_window_only",
                            "auto_approval_timeout_hours": 48,
                            "auto_approval_min_confidence": 0.85,
                            "cadence": {"type": "weekly", "days": ["mon", "thu"], "duration_weeks": 4},
                            "difficulty_level": 2,
                            "minimum_viable_action": "Work on it for 30 minutes",
                            "partner_involvement": {
                                "daily_check_in_suggestion": "Share what you worked on today.",
                                "weekly_anchor_review": "Review checkpoint progress together.",
                                "fallback_if_missed": "Identify the blocker and plan around it.",
                            },
                            "proof_guidance": {
                                "what_counts": ["Screenshot of work", "Photo of output"],
                                "good_examples": ["Work-in-progress deliverable"],
                                "avoid_examples": ["Planning notes only (need actual output)"],
                            },
                        },
                    ],
                },
            ],
        }

    def _build_target_date_plan(self, wizard_data: Dict[str, Any], answers: Dict[str, str]) -> Dict[str, Any]:
        level = answers.get("current_level", "Complete beginner")
        weekly_hours = answers.get("weekly_hours", "3-5 hours")
        recovery = answers.get("recovery_constraints", "No constraints")

        # Calculate phases based on available time until deadline
        target = wizard_data.get("target_deadline")
        phase_count = 3  # Default

        return {
            "target_date_config": {
                "total_phases": phase_count,
                "phases": [
                    {"name": "Foundation", "week_range": "1-3", "focus": "Build base capacity", "intensity": "low"},
                    {"name": "Build", "week_range": "4-8", "focus": "Progressive overload", "intensity": "medium"},
                    {"name": "Peak & Taper", "week_range": "9-12", "focus": "Peak performance then taper", "intensity": "high-to-low"},
                ],
                "periodization_type": "linear",
                "rest_protocol": recovery,
            },
            "milestones": [
                {
                    "title": "Foundation Phase",
                    "description": f"Build base capacity. Starting level: {level}, {weekly_hours}/week.",
                    "tasks": [
                        {
                            "description": f"Training session (starting at {level} level)",
                            "success_metric": "Complete the session as planned",
                            "recommended_cadence": "custom",
                            "recommended_time_windows": wizard_data.get("availability", ["Weekday morning"]),
                            "consistency_rationale": "Progressive training builds capacity toward the target date.",
                            "verification_mode": "photo",
                            "verification_mode_reason": "Training photos/screenshots track progressive overload.",
                            "verification_confidence": 0.85,
                            "partner_required": True,
                            "auto_approval_policy": "time_window_only",
                            "auto_approval_timeout_hours": 24,
                            "auto_approval_min_confidence": 0.85,
                            "cadence": {"type": "custom", "days": ["mon", "wed", "fri"], "duration_weeks": 4},
                            "difficulty_level": 1,
                            "minimum_viable_action": "50% of planned session",
                            "partner_involvement": {
                                "daily_check_in_suggestion": "Share today's training data/result.",
                                "weekly_anchor_review": "Compare week-over-week progress.",
                                "fallback_if_missed": "Do a light recovery session instead.",
                            },
                            "proof_guidance": {
                                "what_counts": ["Training log screenshot", "Activity photo"],
                                "good_examples": ["Workout tracker data", "Distance/time proof"],
                                "avoid_examples": ["Old screenshots"],
                            },
                        },
                    ],
                },
            ],
        }

    def _build_first_day_actions(
        self, goal_type: str, wizard_data: Dict[str, Any], answers: Dict[str, str]
    ) -> List[str]:
        actions = []

        if goal_type == "habit":
            minimum = answers.get("minimum_viable_habit", "the minimum version")
            anchor = answers.get("habit_anchor", "your chosen moment")
            actions = [
                f"Do {minimum} — right {anchor}",
                "Take a quick photo as proof",
                "Tell your partner you started",
            ]
        elif goal_type == "milestone":
            first_cp = answers.get("first_checkpoint", "the first deliverable")
            actions = [
                f"Break '{first_cp}' into 3 small sub-tasks",
                "Complete the easiest sub-task today",
                "Share your plan with your partner",
            ]
        elif goal_type == "target-date":
            level = answers.get("current_level", "your current level")
            actions = [
                f"Do a baseline assessment of {level}",
                "Complete a short foundation session",
                "Log your starting metrics",
            ]
        else:
            actions = [
                "Review your plan",
                "Complete the first task",
                "Check in with your partner",
            ]

        return actions

    def _build_week_preview(self, goal_type: str, wizard_data: Dict[str, Any]) -> str:
        time_commitment = wizard_data.get("time_commitment", "20-30 min")

        if goal_type == "habit":
            return f"This week: Build your streak with daily {time_commitment} sessions. Focus on showing up, not perfection."
        elif goal_type == "milestone":
            return f"This week: Complete your first checkpoint. Dedicate {time_commitment} per session, 2-3 times."
        elif goal_type == "target-date":
            return f"This week: Foundation phase starts. 3 sessions of {time_commitment}, building your base."
        return f"This week: Get started with {time_commitment} sessions focused on building momentum."

    def _score_node(self, goal_plan: Dict[str, Any], context: Dict[str, Any]) -> float:
        score = 6.0
        # Boost for goal-type-specific config
        if any(k in goal_plan for k in ("habit_config", "milestone_config", "target_date_config")):
            score += 1.0
        # Boost for first-day actions
        if goal_plan.get("first_day_actions"):
            score += 0.5
        # Boost for template enhancement
        if goal_plan.get("template_enhanced"):
            score += 0.5
        # Boost for shared goal awareness
        if goal_plan.get("shared_goal_mode"):
            score += 0.4
        return min(score, 10.0)

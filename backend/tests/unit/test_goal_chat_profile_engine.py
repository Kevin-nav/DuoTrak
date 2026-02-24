from app.services.goal_chat.profile_engine import ProfileEngine


def test_profile_engine_initializes_with_three_prompts_and_placeholder():
    engine = ProfileEngine()
    profile = engine.build_initial_profile()

    assert len(profile.self_profile_prompts) == 3
    assert profile.behavioral_summary != ""
    assert profile.answers == {}


def test_profile_engine_merges_behavioral_summary_with_answers():
    engine = ProfileEngine()
    profile = engine.build_initial_profile(behavioral_summary="Disciplined in mornings.")

    merged = engine.merge(
        profile=profile,
        new_answers={"support_style": "Direct reminders", "friction_trigger": "Phone distractions"},
    )

    assert merged.answers["support_style"] == "Direct reminders"
    assert merged.answers["friction_trigger"] == "Phone distractions"
    assert "Disciplined in mornings." in merged.merged_summary
    assert "support_style: Direct reminders" in merged.merged_summary

import asyncio
import logging
import time
from typing import Any, Dict, List


logger = logging.getLogger(__name__)


class ShadowRunner:
    """Runs secondary orchestrator calls in the background and logs comparison metrics."""

    def __init__(self, enabled: bool, shadow_orchestrator: Any = None) -> None:
        self.enabled = enabled
        self.shadow_orchestrator = shadow_orchestrator
        self._parse_success: List[float] = []
        self._schema_success: List[float] = []
        self._latencies_ms: List[float] = []

    def run_questions_shadow(
        self,
        session_id: str,
        user_id: str,
        wizard_data: Dict[str, Any],
        user_context: Dict[str, Any],
    ) -> None:
        if not self.enabled or self.shadow_orchestrator is None:
            return
        asyncio.create_task(
            self._run_questions_shadow(
                session_id=session_id,
                user_id=user_id,
                wizard_data=wizard_data,
                user_context=user_context,
            )
        )

    def run_plan_shadow(
        self,
        session_id: str,
        user_id: str,
        answers: Dict[str, str],
    ) -> None:
        if not self.enabled or self.shadow_orchestrator is None:
            return
        asyncio.create_task(
            self._run_plan_shadow(
                session_id=session_id,
                user_id=user_id,
                answers=answers,
            )
        )

    async def _run_questions_shadow(
        self,
        session_id: str,
        user_id: str,
        wizard_data: Dict[str, Any],
        user_context: Dict[str, Any],
    ) -> None:
        start = time.perf_counter()
        parse_ok = 0.0
        schema_ok = 0.0
        try:
            result = await self.shadow_orchestrator.generate_strategic_questions(
                user_id=user_id,
                session_id=session_id,
                wizard_data=wizard_data,
                user_context=user_context,
            )
            parse_ok = 1.0 if isinstance(result, dict) else 0.0
            schema_ok = 1.0 if self._has_question_contract(result) else 0.0
        except Exception:
            logger.exception("Shadow questions execution failed")
        finally:
            latency_ms = (time.perf_counter() - start) * 1000
            self._record_metrics(parse_ok=parse_ok, schema_ok=schema_ok, latency_ms=latency_ms)

    async def _run_plan_shadow(
        self,
        session_id: str,
        user_id: str,
        answers: Dict[str, str],
    ) -> None:
        start = time.perf_counter()
        parse_ok = 0.0
        schema_ok = 0.0
        try:
            result = await self.shadow_orchestrator.create_goal_plan_from_answers(
                session_id=session_id,
                user_id=user_id,
                answers=answers,
            )
            parse_ok = 1.0 if isinstance(result, dict) else 0.0
            schema_ok = 1.0 if self._has_plan_contract(result) else 0.0
        except Exception:
            logger.exception("Shadow plan execution failed")
        finally:
            latency_ms = (time.perf_counter() - start) * 1000
            self._record_metrics(parse_ok=parse_ok, schema_ok=schema_ok, latency_ms=latency_ms)

    def _record_metrics(self, parse_ok: float, schema_ok: float, latency_ms: float) -> None:
        self._parse_success.append(parse_ok)
        self._schema_success.append(schema_ok)
        self._latencies_ms.append(latency_ms)

        parse_success_rate = sum(self._parse_success) / len(self._parse_success)
        schema_validation_rate = sum(self._schema_success) / len(self._schema_success)
        p95_latency_ms = self._p95(self._latencies_ms)

        logger.info(
            "shadow_metrics parse_success_rate=%.4f schema_validation_rate=%.4f p95_latency_ms=%.2f",
            parse_success_rate,
            schema_validation_rate,
            p95_latency_ms,
        )

    def _p95(self, values: List[float]) -> float:
        if not values:
            return 0.0
        sorted_values = sorted(values)
        idx = int((len(sorted_values) - 1) * 0.95)
        return sorted_values[idx]

    def _has_question_contract(self, result: Any) -> bool:
        if not isinstance(result, dict):
            return False
        return "user_profile_summary" in result and "questions" in result

    def _has_plan_contract(self, result: Any) -> bool:
        if not isinstance(result, dict):
            return False
        return "goal_plan" in result and "partner_integration" in result

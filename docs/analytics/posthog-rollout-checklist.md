# PostHog Rollout Checklist

## Data Contract
- [ ] Event names match catalog.
- [ ] Required properties present for all critical events.
- [ ] Distinct IDs correctly linked for known users.

## Privacy
- [ ] No prompt or response raw text is captured.
- [ ] No secrets or sensitive tokens in properties.

## Product Metrics
- [ ] Signup funnel is populated.
- [ ] Invitation funnel is populated.
- [ ] Weekly retention chart is populated.

## AI Economics
- [ ] `llm_call_completed` populates model/provider/cost.
- [ ] Cost by model dashboard is operational.
- [ ] Cost per goal is derivable from emitted events.

## Reliability
- [ ] Analytics failures do not break request paths.
- [ ] Convex ledger bridge remains optional and feature-gated.
- [ ] Staging smoke run completed successfully.


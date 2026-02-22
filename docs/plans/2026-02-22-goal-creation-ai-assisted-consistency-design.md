# Goal Creation AI-Assisted Consistency Design

**Date:** 2026-02-22  
**Status:** Implemented

## Goal
Upgrade goal creation so AI generates a consistency-first plan with flexible partner accountability and advisory picture-proof guidance at creation time only.

## Product Decisions
- AI runs only during goal creation, not during task execution.
- Planning prioritizes consistency and sustainability over speed.
- Partner involvement is daily encouraged, never enforced.
- Photo proof is guidance-only (what counts / examples / avoid examples), not strict validation.
- Intake remains low-friction, adding only:
  - target deadline
  - preferred partner check-in style

## Data Contract Changes
- Added wizard inputs:
  - `target_deadline`
  - `preferred_check_in_style`
- Added per-task plan fields:
  - `recommended_cadence`
  - `recommended_time_windows`
  - `consistency_rationale`
  - `partner_involvement` (daily suggestion, weekly anchor, missed-day fallback)
  - `proof_guidance` (what counts, good examples, avoid examples)

## UX Changes
- Improved planning step messaging with staged AI progress status.
- Review cards now show cadence, timing, rationale, partner touchpoints, and proof guidance.
- Task persistence uses AI-proposed cadence/time windows as defaults.

# Frontend Build Secrets + Backend K8s Secrets Cleanup Design

**Date:** 2026-02-26

## Scope
- Keep frontend build-time public configuration in GitHub Actions repo secrets and Docker build args.
- Keep backend sensitive runtime configuration in Kubernetes secrets only.
- Remove accidental frontend build dependency on backend runtime secrets.
- Align env examples with code usage to reduce stale/unused variables.

## Current Problems
- `next.config.mjs` validates server-only vars (`SECRET_KEY`, `FASTAPI_URL`, `FIREBASE_SERVICE_ACCOUNT_JSON_PATH`) at build time, forcing mock values in Docker build.
- Frontend build pipeline passes Firebase keys but misses other active frontend public vars (e.g., Convex URL).
- Example env files include stale or inconsistent keys that are not aligned with actual code usage.

## Proposed Design
- Frontend build contract:
  - Required at build: `NEXT_PUBLIC_API_BASE_URL`, Firebase public keys, `NEXT_PUBLIC_CONVEX_URL`.
  - Optional at build: `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_APP_URL`, mock/dev toggles.
- Backend runtime contract:
  - Required via `duotrak-backend-env` K8s secret: database/redis/auth/AI/R2 keys defined by backend settings and used services.
  - Optional via K8s secret: PostHog backend and selected integrations.
- Remove Dockerfile mock server env values used only to satisfy frontend build validation.

## Risks and Mitigations
- Risk: Missing frontend public vars causes runtime breakage.
  - Mitigation: keep strict validation for required public vars in `next.config.mjs`.
- Risk: Overclassifying optional vars as required.
  - Mitigation: require only vars that are validated or non-null asserted by active code paths.

## Success Criteria
- Frontend image builds without dummy backend secrets.
- Deploy workflow lists only required frontend build secrets.
- Backend secret surface remains in K8s and is clearly documented.
- `.env.example` files reflect code usage with stale entries removed.

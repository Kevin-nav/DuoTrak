# Auth Boundary (Web + Mobile)

## Session Cookie Contract

- Canonical session cookie name: `__session`
- Web server auth code reads and forwards only `__session`.
- Backend session cookie setting must remain `SESSION_COOKIE_NAME="__session"`.

## Boundary Responsibilities

- App authentication authority: Firebase/Convex identity + backend session verification.
- Web and mobile clients authenticate through the same session contract (`__session`).
- Python AI endpoints are not directly called by clients for auth; they are invoked through trusted server-side boundaries (Convex action/internal service secret).

## Notes

- Legacy `auth_token` cookie handling is removed from active auth paths.
- Any future auth cookie rename must be updated in both:
  - `src/lib/auth.ts`
  - `backend/app/core/config.py`

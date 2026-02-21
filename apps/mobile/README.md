# DuoTrak Mobile

This app will consume shared domain logic from `packages/domain` to keep web and Expo behavior aligned.

## Shared domain usage

- Import pure mappers and rules from `packages/domain/src`.
- Avoid duplicating business mapping logic inside mobile screens/hooks.
- Keep API payload shaping in shared domain functions so web and mobile stay in sync.

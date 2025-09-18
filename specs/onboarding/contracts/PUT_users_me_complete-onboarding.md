# API Contract: Complete Onboarding

- **Method**: `PUT`
- **Path**: `/api/v1/users/me/complete-onboarding`

## Description

Updates the authenticated user's `account_status` from `AWAITING_ONBOARDING` to `ACTIVE`.

## Request

### Headers

- `Authorization`: `Bearer <SESSION_TOKEN>`

### Body

No request body is required.

## Responses

### 2.00 OK

Returned upon successfully updating the user's status.

```json
{
  "status": "success",
  "message": "User status updated to ACTIVE"
}
```

### 4.09 Conflict

Returned if the user's account is not in the `AWAITING_ONBOARDING` state.

```json
{
  "detail": "User has already completed onboarding or is not in a valid state to do so."
}
```

### 500 Internal Server Error

Returned if there is a server-side issue updating the user record.

```json
{
  "detail": "Failed to update user status."
}
```

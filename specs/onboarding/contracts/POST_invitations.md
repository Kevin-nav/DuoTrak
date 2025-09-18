# API Contract: Send Partner Invitation

- **Method**: `POST`
- **Path**: `/api/v1/invitations`

## Description

Sends an email invitation to a partner on behalf of the currently authenticated user.

## Request

### Headers

- `Authorization`: `Bearer <SESSION_TOKEN>`

### Body

The request body must be a JSON object containing the partner's email address.

```json
{
  "email": "partner@example.com"
}
```

#### Body Validation (Zod Schema)

```typescript
import { z } from 'zod';

export const SendInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
});
```

## Responses

### 201 Created

Returned upon successfully sending the invitation.

```json
{
  "status": "success",
  "message": "Invitation sent successfully to partner@example.com"
}
```

### 400 Bad Request

Returned if the request body is invalid (e.g., missing or malformed email).

```json
{
  "detail": "Invalid email address"
}
```

### 409 Conflict

Returned if the user already has an active partner or a pending invitation.

```json
{
  "detail": "An active partnership or pending invitation already exists."
}
```

### 500 Internal Server Error

Returned if there is a server-side issue (e.g., failure to send the email).

```json
{
  "detail": "Failed to send invitation email."
}
```

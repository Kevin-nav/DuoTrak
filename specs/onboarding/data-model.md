# Phase 1: Data Models

This document outlines the data structures required for the enhanced onboarding feature. The models are designed to integrate with the existing PostgreSQL database and FastAPI backend.

## 1. User Model

The existing `User` model needs to be updated to track the user's onboarding status.

**Table Name:** `users`

### Modifications

A new field, `account_status`, will be added.

| Field Name | Data Type | Description | Default Value |
|---|---|---|---|
| `account_status` | `VARCHAR(50)` | The current status of the user's account. | `'AWAITING_ONBOARDING'` |

### `AccountStatus` Enum

This enum will define the possible values for the `account_status` field.

- `AWAITING_ONBOARDING`: The user has signed up but has not completed the onboarding flow.
- `ACTIVE`: The user has completed onboarding and can access the main application.
- `PENDING_INVITE`: The user has been invited by a partner but has not yet accepted.
- `DEACTIVATED`: The user's account is deactivated.

## 2. Invitation Model

A new model is required to manage partner invitations.

**Table Name:** `invitations`

| Field Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | Primary Key | The unique identifier for the invitation. |
| `inviter_id` | `UUID` | Foreign Key (users.id) | The ID of the user who sent the invitation. |
| `invitee_email` | `VARCHAR(255)` | Not Null | The email address of the person being invited. |
| `token` | `VARCHAR(255)` | Not Null, Unique | A secure, unique token for the invitation link. |
| `status` | `VARCHAR(50)` | Not Null | The current status of the invitation. |
| `created_at` | `TIMESTAMP` | Not Null | The timestamp when the invitation was created. |
| `expires_at` | `TIMESTAMP` | Not Null | The timestamp when the invitation expires. |

### `InvitationStatus` Enum

- `PENDING`: The invitation has been sent but not yet accepted.
- `ACCEPTED`: The invitation has been accepted.
- `EXPIRED`: The invitation was not accepted before the expiration date.

## 3. Relationships

- A `User` can have many sent `Invitations` (One-to-Many).
- An `Invitation` belongs to one `User` (the inviter).

# Database Structure

This document outlines the relational database schema for the DuoTrak application, based on the SQLAlchemy models defined in `backend/app/db/models`.

## Table: `users`

**Purpose:** Stores user accounts and their profile information.

| Column Name           | Type                 | Constraints                                   | Description                                     |
| :-------------------- | :------------------- | :-------------------------------------------- | :---------------------------------------------- |
| `id`                  | `UUID`               | Primary Key, Default: `uuid.uuid4()`          | Unique identifier for the user.                 |
| `firebase_uid`        | `String(255)`        | Unique, Not Null, Index                       | Firebase User ID.                               |
| `email`               | `String(255)`        | Unique, Not Null, Index                       | User's email address.                           |
| `full_name`           | `String(255)`        | Nullable                                      | User's full name.                               |
| `account_status`      | `Enum`               | Not Null, Default: `'AWAITING_ONBOARDING'`    | User's overall account state.                   |
| `partnership_status`  | `Enum`               | Not Null, Default: `'no_partner'`             | User's current partnership status.              |
| `bio`                 | `String(255)`        | Nullable                                      | User's biography.                               |
| `profile_picture_url` | `Text`               | Nullable                                      | URL to the user's profile picture.              |
| `timezone`            | `String(100)`        | Not Null, Default: `'UTC'`                    | User's timezone.                                |
| `notifications_enabled` | `Boolean`          | Not Null, Default: `True`                     | Flag for notification preferences.              |
| `current_streak`      | `Integer`            | Not Null, Default: `0`                        | User's current streak count.                    |
| `longest_streak`      | `Integer`            | Not Null, Default: `0`                        | User's longest streak count.                    |
| `total_tasks_completed` | `Integer`          | Not Null, Default: `0`                        | Total tasks completed by the user.              |
| `goals_conquered`     | `Integer`            | Not Null, Default: `0`                        | Total goals conquered by the user.              |
| `current_partner_id`  | `UUID`               | Foreign Key (`users.id`), Nullable, `ON DELETE SET NULL` | Link to the user's current partner.             |
| `created_at`          | `TIMESTAMP`          | Not Null, Default: `func.now()`               | Timestamp of creation.                          |
| `updated_at`          | `TIMESTAMP`          | Not Null, Default: `func.now()`, `ON UPDATE func.now()` | Timestamp of last update.                       |

**Relationships:**
- One-to-many with `goals` (`Goal` model).
- One-to-many with `user_badges` (`UserBadge` model).
- Self-referential many-to-one via `current_partner_id`.

---

## Table: `partner_invitations`

**Purpose:** Stores records of invitations sent between users to form a partnership.

| Column Name        | Type        | Constraints                                   | Description                                     |
| :----------------- | :---------- | :-------------------------------------------- | :---------------------------------------------- |
| `id`               | `UUID`      | Primary Key, Default: `gen_random_uuid()`     | Unique identifier for the invitation.           |
| `sender_id`        | `UUID`      | Foreign Key (`users.id`), Not Null, `ON DELETE CASCADE` | ID of the user who sent the invitation.         |
| `receiver_id`      | `UUID`      | Foreign Key (`users.id`), Nullable, `ON DELETE SET NULL` | ID of the user who received/accepted the invitation. |
| `receiver_name`    | `String(100)` | Not Null                                      | Name of the intended recipient.                 |
| `receiver_email`   | `String(255)` | Not Null, Index                               | Email of the intended recipient.                |
| `invitation_token` | `UUID`      | Unique, Not Null, Default: `gen_random_uuid()` | Unique token for public access/acceptance.      |
| `status`           | `Enum`      | Not Null, Default: `'pending'`                | Current status of the invitation.               |
| `created_at`       | `TIMESTAMP` | Not Null, Default: `now()`                    | Timestamp of creation.                          |
| `expires_at`       | `TIMESTAMP` | Nullable                                      | Timestamp when the invitation expires.          |
| `accepted_at`      | `TIMESTAMP` | Nullable                                      | Timestamp when the invitation was accepted.     |
| `updated_at`       | `TIMESTAMP` | Not Null, Default: `now()`, `ON UPDATE now()` | Timestamp of last update.                       |
| `last_nudged_at`   | `TIMESTAMP` | Nullable                                      | Timestamp of the last nudge sent.               |

**Relationships:**
- Many-to-one with `users` (sender).
- Many-to-one with `users` (receiver, if `receiver_id` is set).

---

## Table: `partnerships`

**Purpose:** Records active partnerships between two users.

| Column Name  | Type        | Constraints                                   | Description                                     |
| :----------- | :---------- | :-------------------------------------------- | :---------------------------------------------- |
| `id`         | `UUID`      | Primary Key, Default: `uuid.uuid4()`          | Unique identifier for the partnership.          |
| `user1_id`   | `UUID`      | Foreign Key (`users.id`), Not Null, `ON DELETE CASCADE` | ID of the first user in the partnership.        |
| `user2_id`   | `UUID`      | Foreign Key (`users.id`), Not Null, `ON DELETE CASCADE` | ID of the second user in the partnership.       |
| `start_date` | `TIMESTAMP` | Not Null                                      | Date and time when the partnership began.       |
| `status`     | `Enum`      | Not Null                                      | Current status of the partnership.              |
| `created_at` | `TIMESTAMP` | Not Null, Default: `func.now()`               | Timestamp of creation.                          |
| `updated_at` | `TIMESTAMP` | Not Null, Default: `func.now()`, `ON UPDATE func.now()` | Timestamp of last update.                       |

**Constraints:**
- `UniqueConstraint('user1_id', 'user2_id')`: Ensures a unique partnership between a pair of users.
- `CheckConstraint('user1_id < user2_id')`: Enforces canonical ordering of user IDs to prevent duplicate records (e.g., (A,B) is same as (B,A)).

**Relationships:**
- Many-to-many with `users` (via `user1_id` and `user2_id`).

---

## Table: `goals`

**Purpose:** Stores individual goals set by users.

| Column Name | Type          | Constraints                                   | Description                                     |
| :---------- | :------------ | :-------------------------------------------- | :---------------------------------------------- |
| `id`        | `UUID`        | Primary Key, Default: `uuid.uuid4()`          | Unique identifier for the goal.                 |
| `name`      | `String(255)` | Not Null                                      | Name or title of the goal.                      |
| `category`  | `String(100)` | Nullable                                      | Category of the goal (e.g., "Fitness").         |
| `icon`      | `String(50)`  | Nullable                                      | Icon associated with the goal.                  |
| `color`     | `String(20)`  | Nullable                                      | Color associated with the goal.                 |
| `user_id`   | `UUID`        | Foreign Key (`users.id`), Not Null, `ON DELETE CASCADE` | ID of the user who owns this goal.              |
| `created_at`| `TIMESTAMP`   | Not Null, Default: `func.now()`               | Timestamp of creation.                          |
| `updated_at`| `TIMESTAMP`   | Not Null, Default: `func.now()`, `ON UPDATE func.now()` | Timestamp of last update.                       |

**Relationships:**
- Many-to-one with `users` (owner).
- One-to-many with `tasks` (`Task` model).

---

## Table: `tasks`

**Purpose:** Stores specific tasks associated with goals.

| Column Name | Type          | Constraints                                   | Description                                     |
| :---------- | :------------ | :-------------------------------------------- | :---------------------------------------------- |
| `id`        | `UUID`        | Primary Key, Default: `uuid.uuid4()`          | Unique identifier for the task.                 |
| `name`      | `String(255)` | Not Null                                      | Name or description of the task.                |
| `status`    | `String(50)`  | Not Null, Default: `'pending'`                | Current status of the task.                     |
| `due_date`  | `TIMESTAMP`   | Nullable                                      | Due date and time for the task.                 |
| `goal_id`   | `UUID`        | Foreign Key (`goals.id`), Not Null, `ON DELETE CASCADE` | ID of the goal this task belongs to.            |
| `created_at`| `TIMESTAMP`   | Not Null, Default: `func.now()`               | Timestamp of creation.                          |
| `updated_at`| `TIMESTAMP`   | Not Null, Default: `func.now()`, `ON UPDATE func.now()` | Timestamp of last update.                       |

**Relationships:**
- Many-to-one with `goals` (parent goal).

---

## Table: `badges`

**Purpose:** Defines available badges that can be awarded to users.

| Column Name | Type          | Constraints                                   | Description                                     |
| :---------- | :------------ | :-------------------------------------------- | :---------------------------------------------- |
| `id`        | `UUID`        | Primary Key, Default: `gen_random_uuid()`     | Unique identifier for the badge.                |
| `name`      | `String(100)` | Unique, Not Null                              | Name of the badge.                              |
| `icon`      | `String(50)`  | Not Null                                      | Icon associated with the badge.                 |
| `description` | `String(255)` | Not Null                                      | Description of what the badge signifies.        |

---

## Table: `user_badges`

**Purpose:** Records which badges have been awarded to which users. This is a many-to-many relationship table between `users` and `badges`.

| Column Name | Type          | Constraints                                   | Description                                     |
| :---------- | :------------ | :-------------------------------------------- | :---------------------------------------------- |
| `user_id`   | `UUID`        | Primary Key, Foreign Key (`users.id`), Not Null, `ON DELETE CASCADE` | ID of the user who earned the badge.            |
| `badge_id`  | `UUID`        | Primary Key, Foreign Key (`badges.id`), Not Null, `ON DELETE CASCADE` | ID of the badge earned.                         |
| `awarded_at`| `TIMESTAMP`   | Not Null, Default: `func.now()`               | Timestamp when the badge was awarded.           |

**Relationships:**
- Many-to-one with `users`.
- Many-to-one with `badges`.

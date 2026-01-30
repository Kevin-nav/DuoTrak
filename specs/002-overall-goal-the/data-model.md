# Data Model: Real-time Chat Interface

This document outlines the data models for the chat feature, based on the entities identified in the feature specification.

## Entities

### Message
Represents a single chat message.

- **`message_id`**: `UUID` (Primary Key)
- **`conversation_id`**: `UUID` (Foreign Key to a `conversations` table)
- **`sender_id`**: `UUID` (Foreign Key to `users` table)
- **`content`**: `TEXT` (The text of the message)
- **`created_at`**: `TIMESTAMP`
- **`parent_message_id`**: `UUID` (Nullable, Foreign Key to `messages` table for replies)
- **`status`**: `ENUM('sent', 'delivered', 'read')`

### Reaction
Represents a reaction to a message.

- **`reaction_id`**: `UUID` (Primary Key)
- **`message_id`**: `UUID` (Foreign Key to `messages` table)
- **`user_id`**: `UUID` (Foreign Key to `users` table)
- **`emoji`**: `TEXT`

### Attachment
Represents a file attached to a message.

- **`attachment_id`**: `UUID` (Primary Key)
- **`message_id`**: `UUID` (Foreign Key to `messages` table)
- **`file_name`**: `TEXT`
- **`file_type`**: `TEXT`
- **`file_size`**: `INTEGER` (in bytes)
- **`storage_url`**: `TEXT` (URL to the file in object storage)
- **`thumbnail_url`**: `TEXT` (Nullable, URL to a thumbnail for image files)

## Relationships
- A `Conversation` has many `Messages`.
- A `User` can be a `sender` of many `Messages`.
- A `Message` can have one `parent_message` (for replies).
- A `Message` can have many `Reactions`.
- A `Message` can have many `Attachments`.
- A `User` can have many `Reactions`.

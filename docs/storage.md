# Storage

## Description
This feature provides functionality for storing and managing files, primarily focusing on user-related assets like profile pictures. It leverages Supabase Storage as the backend for file persistence.

## Frontend Implementation
- `src/components/profile-content.tsx`:
    - **Purpose:** Allows users to upload and remove their profile pictures.
    - **Mechanism:** Contains UI elements (e.g., a camera icon button) that trigger file selection. It then calls backend API endpoints (likely via `apiClient`) to perform the upload/removal.
    - **Dependencies:** `apiClient` (inferred), `firebase/auth` (for re-authentication if needed for profile updates).

## Backend Implementation

### API Endpoints
- `backend/app/api/v1/endpoints/storage.py`:
    - **`POST /upload-profile-picture`:**
        - **Purpose:** Uploads a new profile picture for the authenticated user.
        - **Mechanism:** Receives an `UploadFile`, calls `storage_service.upload_file` to store it in the "avatars" bucket, and then updates the user's `profile_picture_url` in the database via `user_service.update_user`.
        - **Rate Limiting:** `5/minute`.
        - **Dependencies:** `storage_service`, `user_service`, `get_current_user` dependency.

### Services
- `backend/app/services/storage_service.py`:
    - **Purpose:** Encapsulates the core logic for interacting with the Supabase Storage backend.
    - **`__init__(self)`:** Initializes the Supabase client using `settings.SUPABASE_URL` and `settings.SUPABASE_SERVICE_ROLE_KEY`.
    - **`upload_file(self, bucket_name: str, file: UploadFile, user_id: str) -> str`:**
        - **Purpose:** Uploads a file to a specified Supabase Storage bucket.
        - **Mechanism:**
            1.  Constructs a unique `file_path` using `user_id` and a UUID.
            2.  Uploads the file content to the specified `bucket_name` at the `file_path` using `self.supabase.storage.from_(bucket_name).upload()`.
            3.  If an existing file with the same path exists, it's updated (upserted).
            4.  Retrieves the public URL of the uploaded file.
            5.  **Handles existing files:** If a file already exists for the user (e.g., old profile picture), it attempts to delete the old file before uploading the new one to prevent orphaned files.
        - **Error Handling:** Raises `HTTPException` on upload failure.
    - **`remove_avatar(self, user_id: str)`:**
        - **Purpose:** Removes a user's profile picture from the "avatars" bucket.
        - **Mechanism:** Constructs the expected file path for the user's avatar and calls `self.supabase.storage.from_("avatars").remove()`.
        - **Error Handling:** Logs errors but does not raise an exception if removal fails (e.g., file not found).
    - **Dependencies:** `supabase_py_async`, `settings`, `UploadFile`, `uuid`.

### Schemas
- (No specific Pydantic schemas defined directly for storage operations, but `UserUpdate` from `app.schemas.user` is used to update the `profile_picture_url`.)

### Database Interactions
- Updating the `profile_picture_url` field in the `User` table via `user_service`.

## Dependencies/Integrations
- **Supabase Storage:** The external service used for file storage.
- **FastAPI:** Backend framework.
- **SQLAlchemy:** ORM for database interactions (indirectly, via `user_service`).
- **Pydantic:** For data validation.
- **`fastapi-limiter`:** For rate limiting on the upload endpoint.

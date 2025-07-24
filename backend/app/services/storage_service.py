from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        """
        Initializes the Supabase client.
        """
        try:
            self.supabase: Client = create_client(
                settings.SUPABASE_URL, 
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
            logger.info("Supabase client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise

    async def upload_avatar(self, file_contents: bytes, file_name: str, user_id: int) -> str:
        """
        Uploads a user's avatar to the 'avatars' bucket in Supabase Storage.
        The file will be stored in a path namespaced by the user's ID.
        
        Args:
            file_contents: The byte content of the file to upload.
            file_name: The original name of the file, used to get the extension.
            user_id: The ID of the user, used for namespacing.

        Returns:
            The public URL of the uploaded file.
        """
        try:
            bucket_name = "avatars"
            # Sanitize and create a unique file path
            file_extension = file_name.split('.')[-1]
            path_in_bucket = f"user_{user_id}/profile.{file_extension}"

            # Supabase's upload is synchronous in the current library, but we call it from an async endpoint
            # The `upsert=True` option will overwrite the file if it already exists, which is perfect for updates.
            self.supabase.storage.from_(bucket_name).upload(
                path=path_in_bucket,
                file=file_contents,
                file_options={"content-type": f"image/{file_extension}", "upsert": "true"}
            )
            logger.info(f"Successfully uploaded avatar for user {user_id} to {path_in_bucket}")

            # Get the public URL for the uploaded file
            public_url = self.supabase.storage.from_(bucket_name).get_public_url(path_in_bucket)
            logger.info(f"Public URL for user {user_id} avatar: {public_url}")
            
            return public_url

        except Exception as e:
            logger.error(f"Failed to upload avatar for user {user_id}: {e}")
            raise

    async def remove_avatar(self, user_id: int):
        """
        Removes all avatars for a user from the 'avatars' bucket.
        """
        try:
            bucket_name = "avatars"
            path_prefix = f"user_{user_id}/"
            
            # List all files in the user's folder
            files_to_delete = self.supabase.storage.from_(bucket_name).list(path=path_prefix)
            
            if files_to_delete:
                # Prepare a list of file paths to remove
                paths = [f"{path_prefix}{file['name']}" for file in files_to_delete]
                self.supabase.storage.from_(bucket_name).remove(paths)
                logger.info(f"Successfully removed avatars for user {user_id} from paths: {paths}")

        except Exception as e:
            logger.error(f"Failed to remove avatars for user {user_id}: {e}")
            # We don't re-raise here. Failing to delete an old picture is not a critical error.
            # The user's DB record will be updated to null, so they won't see the old picture anyway.
            pass


storage_service = StorageService()
import boto3
from botocore.client import Config
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        """
        Initializes the Cloudflare R2 client.
        """
        try:
            self.r2_client = boto3.client(
                "s3",
                endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                config=Config(signature_version="s3v4"),
                region_name="auto",
            )
            print(f"DEBUG: R2_ACCOUNT_ID: {settings.R2_ACCOUNT_ID}")
            print(f"DEBUG: R2 Endpoint URL: https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com")
            logger.info("Cloudflare R2 client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Cloudflare R2 client: {e}")
            raise

    async def upload_file(self, bucket_name: str, file_contents: bytes, path_in_bucket: str, content_type: str) -> str:
        """
        Uploads a file to a specified bucket and path in Cloudflare R2 Storage.
        
        Args:
            bucket_name: The name of the storage bucket.
            file_contents: The byte content of the file to upload.
            path_in_bucket: The full path within the bucket where the file should be stored.
            content_type: The MIME type of the file.

        Returns:
            The public URL of the uploaded file.
        """
        try:
            self.r2_client.put_object(
                Bucket=bucket_name,
                Key=path_in_bucket,
                Body=file_contents,
                ContentType=content_type,
            )
            logger.info(f"Successfully uploaded file to {bucket_name}/{path_in_bucket}")
            # R2 public URL format
            public_url = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{bucket_name}/{path_in_bucket}"
            return public_url
        except Exception as e:
            logger.error(f"Failed to upload file to {bucket_name}/{path_in_bucket}: {e}")
            raise

    async def upload_avatar(self, file_contents: bytes, file_name: str, user_id: int) -> str:
        """
        Uploads a user's avatar to the 'avatars' bucket in Cloudflare R2 Storage.
        
        Args:
            file_contents: The byte content of the file to upload.
            file_name: The original name of the file, used to get the extension.
            user_id: The ID of the user, used for namespacing.

        Returns:
            The public URL of the uploaded file.
        """
        try:
            bucket_name = settings.R2_BUCKET_NAME # Use the configured R2 bucket for avatars
            file_extension = file_name.split('.')[-1]
            path_in_bucket = f"user_{user_id}/profile.{file_extension}"
            content_type = f"image/{file_extension}"

            return await self.upload_file(bucket_name, file_contents, path_in_bucket, content_type)

        except Exception as e:
            logger.error(f"Failed to upload avatar for user {user_id}: {e}")
            raise

    async def remove_avatar(self, user_id: int):
        """
        Removes all avatars for a user from the 'avatars' bucket.
        """
        try:
            bucket_name = settings.R2_BUCKET_NAME # Use the configured R2 bucket for avatars
            path_prefix = f"user_{user_id}/"
            
            # List all files in the user's folder
            response = self.r2_client.list_objects_v2(Bucket=bucket_name, Prefix=path_prefix)
            files_to_delete = [obj['Key'] for obj in response.get('Contents', [])]
            
            if files_to_delete:
                self.r2_client.delete_objects(Bucket=bucket_name, Delete={'Objects': [{'Key': key} for key in files_to_delete]})
                logger.info(f"Successfully removed avatars for user {user_id} from paths: {files_to_delete}")

        except Exception as e:
            logger.error(f"Failed to remove avatars for user {user_id}: {e}")
            pass


storage_service = StorageService()
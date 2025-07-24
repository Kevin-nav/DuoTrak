"""Message schemas for API responses."""
from pydantic import BaseModel

class Msg(BaseModel):
    """Basic message response schema."""
    message: str

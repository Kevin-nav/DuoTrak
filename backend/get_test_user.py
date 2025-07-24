# backend/get_test_user.py
import asyncio
from sqlalchemy import select
from app.db.session import SessionLocal
from app.db.models.user import User

async def get_first_user_id():
    async with SessionLocal() as db:
        result = await db.execute(select(User).limit(1))
        user = result.scalars().first()
        if user:
            print(user.id)
        else:
            print("No users found in the database.")

if __name__ == "__main__":
    asyncio.run(get_first_user_id())

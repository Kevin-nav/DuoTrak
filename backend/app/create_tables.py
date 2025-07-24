import asyncio
from app.db.session import engine
from app.db.base import Base
# The following imports are necessary to register the models with SQLAlchemy's metadata
from app.db.models.user import User
from app.db.models.partnership import Partnership


async def create_tables():
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully.")
    # It's good practice to dispose of the engine when the script is done
    await engine.dispose()

if __name__ == "__main__":
    # This script will connect to the database defined in your .env file
    # and create all tables defined in your models.
    print("Running database table creation...")
    asyncio.run(create_tables())

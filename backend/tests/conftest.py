import sys
import os
import asyncio
from typing import AsyncGenerator

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.core.security import get_current_user
from app.db import models
from app.schemas.user import AccountStatus

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session


def override_get_current_user():
    # This is a mock user that simulates a verified Firebase user
    return {"uid": "test_firebase_uid_123", "email": "testuser@example.com"}


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_app() -> FastAPI:
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield app
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(test_app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with engine.begin() as connection:
        async with TestingSessionLocal(bind=connection) as session:
            yield session
            await session.flush()
            await session.rollback()
            await connection.rollback()


@pytest_asyncio.fixture(scope="function")
async def user_awaiting_onboarding(db_session: AsyncSession) -> models.User:
    """Creates a user who has just signed up."""
    user = models.User(
        firebase_uid="test_uid_onboarding",
        email="onboarding@test.com",
        full_name="Onboarding User",
        account_status=AccountStatus.AWAITING_ONBOARDING,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def user_awaiting_partnership(db_session: AsyncSession) -> models.User:
    """Creates a user who has completed onboarding but has no partner."""
    user = models.User(
        firebase_uid="test_uid_partnership",
        email="partnership@test.com",
        full_name="Partnership User",
        account_status=AccountStatus.AWAITING_PARTNERSHIP,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def active_user(db_session: AsyncSession) -> models.User:
    """Creates a user who is fully active."""
    user = models.User(
        firebase_uid="test_uid_active",
        email="active@test.com",
        full_name="Active User",
        account_status=AccountStatus.ACTIVE,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest_asyncio.fixture(scope="function")
async def user_onboarding_partnered(db_session: AsyncSession) -> models.User:
    """Creates a user who has accepted an invitation and is in the partnered onboarding state."""
    user = models.User(
        firebase_uid="onboarding_partnered_uid",
        email="onboarding_partnered@test.com",
        full_name="Onboarding Partnered User",
        account_status=AccountStatus.ONBOARDING_PARTNERED,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

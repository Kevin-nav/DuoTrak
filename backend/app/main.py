from fastapi import FastAPI
from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(title=settings.PROJECT_NAME)

@app.get("/", tags=["Health Check"])
async def root():
    return {"message": "Welcome to the DuoTrak API"}

app.include_router(api_router, prefix=settings.API_V1_STR)

try:
    from app.core.config import settings
    print("✅ Configuration loaded successfully!")
    print("---------------------------------")
    # Print variables, partially hiding sensitive ones for security
    print(f"DATABASE_URL: ...{settings.DATABASE_URL[-10:]}")
    print(f"FIREBASE_SERVICE_ACCOUNT_JSON_PATH: {settings.FIREBASE_SERVICE_ACCOUNT_JSON_PATH}")
    print(f"REDIS_URL: {settings.REDIS_URL}")
    print(f"RESEND_API_KEY: ...{settings.RESEND_API_KEY[-4:]}")
    print("---------------------------------")

except Exception as e:
    print("❌ Error loading configuration:")
    print(e)
    print("\n👉 Please ensure you have a `.env` file in the `backend/` directory and that it contains all the required variables (DATABASE_URL, FIREBASE_SERVICE_ACCOUNT_JSON_PATH, REDIS_URL, RESEND_API_KEY).")

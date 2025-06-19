DuoTrak Backend Architecture & Logic Overview (Onboarding Focus) - Updated with Firebase Auth & Upstash Redis Rate Limiting
Location: DuoTrak_v1.1/backend/ folder
Technology Stack: FastAPI, SQLAlchemy, Alembic, PostgreSQL (via Supabase), Firebase Admin SDK (Python), Resend (for emails), slowapi with Upstash Redis (for rate limiting)

1. Overall Backend Architecture
Your backend implements a Monolith-First with Layered Architecture, designed for deployment as a Serverless Container on Google Cloud Run.

FastAPI Application:

Entry Point: main.py (or app/main.py), responsible for app initialization, including loading environment variables (dotenv), Firebase Admin SDK setup, and slowapi Limiter initialization with Upstash Redis.
API Routes: Defined using FastAPI's routing decorators (e.g., /api/v1/auth, /api/v1/users, /api/v1/invitations). These routes will now incorporate slowapi decorators for rate limiting.
Dependencies/Middleware: Crucial for authentication (Firebase ID Token verification), database session management, and slowapi's SlowAPIMiddleware for global rate limit enforcement and RateLimitExceeded exception handling.
Service Layer (Business Logic): Encapsulates core DuoTrak logic (e.g., user_service.py for profile creation/retrieval, invitation_service.py for invite management). This layer orchestrates data access and external calls (like email sending).
Repository/DAO Layer (Data Access): Interacts directly with the Supabase PostgreSQL database using SQLAlchemy ORM. This abstracts database-specific operations, providing a clean interface to the service layer.
Utility Modules: For Firebase Admin SDK interactions (e.g., token verification), Resend client initialization, and potentially helper functions for UUID generation, etc.
Authentication Service (Firebase Authentication):

Primary Identity Provider: Firebase Auth handles all user identity management, including email/password, Google OAuth, social logins, and password reset flows.
Client-Side Interaction: The Next.js frontend interacts directly with Firebase's JavaScript SDK for all authentication actions (sign-up, login, password reset, Google sign-in).
Backend Verification: FastAPI receives Firebase ID Tokens from the frontend and uses the Firebase Admin SDK to securely verify them, ensuring the user's identity and extracting their Firebase UID.
Database (Supabase PostgreSQL):

Core Data Store: Stores all DuoTrak-specific application data (user profiles, partnerships, invitations, goals, tasks, etc.).
Local Development: Uses the supabase/ folder and Docker containers via supabase start. This provides a fully isolated local replica of your PostgreSQL database for development and testing.
Production Deployment: Connects to your hosted Supabase project.
Email Service (Resend):

Integrated via FastAPI. All transactional emails (invitations, welcome, partnership confirmations) are sent through Resend's API, offloading email delivery concerns.
Rate Limiting Service (Upstash Redis):

Distributed Storage: Upstash provides a serverless Redis instance that acts as the shared state for slowapi to enforce rate limits across all horizontally scaled Cloud Run instances.
Highly Cost-Effective: Leveraging Upstash's generous free tier for initial development and growth.
2. Deployment Strategy (Google Cloud Run)
Your FastAPI backend will be deployed as a containerized application on Google Cloud Run, leveraging its serverless capabilities for scalability and cost-efficiency.

Containerization: The FastAPI application, along with all its Python dependencies (from requirements.txt) and Uvicorn server, will be packaged into a Docker image.
Deployment Workflow:
Dockerfile: A Dockerfile in backend/ defines how to build your application's Docker image.
Build & Push: gcloud builds submit will compile your code into a Docker image and push it to Google Container Registry (GCR) or Artifact Registry.
Deploy: gcloud run deploy will provision and deploy your containerized service on Cloud Run.
Environment Variables: Crucially, sensitive configurations (database credentials, Firebase Service Account JSON, Resend API key, Upstash REDIS_URL) will be provided to the Cloud Run service as environment variables. These variables will contain the production values, overriding any local .env settings.
Scalability: Cloud Run automatically scales instances based on request traffic, from zero to many, and scales down when idle. This provides inherent scalability for your API.
Cost Efficiency: You only pay for the compute resources consumed while processing requests, fitting perfectly with your cost-conscious approach.
3. Backend Logic & Flow (Onboarding Focus)
This section details the specific logic within your FastAPI backend for the onboarding journey, aligning with the revised Firebase authentication and the new rate limiting.

Core Principle: The FastAPI backend serves as the authoritative source for all DuoTrak-specific business logic and data consistency within the Supabase PostgreSQL database. The frontend primarily orchestrates user interactions and delegates authentication to Firebase.

3.1. FastAPI Application Initialization (main.py / app/main.py)
Python

# backend/app/main.py
from dotenv import load_dotenv
import os

# Load environment variables from .env file (for local development)
# In production on Cloud Run, env vars are directly provided by the platform.
load_dotenv()

from fastapi import FastAPI, Request, status
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.responses import JSONResponse
from redis import Redis # pip install redis

# --- Firebase Admin SDK Initialization ---
import firebase_admin
from firebase_admin import credentials, auth
import json

def initialize_firebase_admin():
    if not firebase_admin._apps:
        # Load credentials from environment variable (for Cloud Run production)
        if os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON"):
            cred_json = json.loads(os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON"))
            cred = credentials.Certificate(cred_json)
        # Fallback to local file for development
        elif os.path.exists("firebase-adminsdk.json"):
            cred = credentials.Certificate("firebase-adminsdk.json")
        else:
            raise ValueError("Firebase service account credentials not found. Set FIREBASE_SERVICE_ACCOUNT_JSON env var or place firebase-adminsdk.json.")
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized.")

# --- Rate Limiter Initialization (slowapi with Upstash Redis) ---
REDIS_URL = os.getenv("REDIS_URL")
if not REDIS_URL:
    print("WARNING: REDIS_URL environment variable not set. Rate limiting will use in-memory storage (NOT for production).")
    storage_uri = "memory://" # Fallback for local dev if Redis not configured
else:
    storage_uri = REDIS_URL

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/minute"], # Global default rate limit
    storage_uri=storage_uri # Uses Upstash Redis
)

app = FastAPI(title="DuoTrak API")

# Attach the limiter to the app state
app.state.limiter = limiter

# Add the slowapi middleware
from slowapi.middleware import SlowAPIMiddleware
app.add_middleware(SlowAPIMiddleware)

# Custom exception handler for rate limit exceeded
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": f"Rate limit exceeded for {request.url.path}: {exc.detail}"},
        headers={"Retry-After": str(int(exc.retry_after)) if exc.retry_after else "60"}
    )

# --- Database Session Dependency (Example, assuming you have this) ---
# from app.database import get_db_session # Your SQLAlchemy session management

# --- Include Routers ---
# from app.api.v1.endpoints import auth, users, invitations # Assuming you have these routers

# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
# app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
# app.include_router(invitations.router, prefix="/api/v1/invitations", tags=["Invitations"])

# --- Startup Event ---
@app.on_event("startup")
async def startup_event():
    initialize_firebase_admin()
    # Any other startup tasks, e.g., database migrations check
3.2. User Authentication (Delegated to Frontend & Firebase)
Goal: Securely authenticate users using Firebase and provide a verifiable identity to the backend.
Frontend Action: User interacts with sign-up, login, Google Sign-in forms.
Interaction Type: Direct Firebase SDK Calls (from Frontend).
firebase/auth.createUserWithEmailAndPassword()
firebase/auth.signInWithEmailAndPassword()
firebase/auth.signInWithPopup(GoogleAuthProvider)
firebase/auth.sendPasswordResetEmail()
Backend Involvement: None for the direct authentication handshake. Firebase handles user creation, password hashing, token issuance, and reset emails entirely.
Security: Leverages Firebase's robust and battle-tested authentication infrastructure, eliminating the need for your backend to handle sensitive password management.
3.3. User Profile Synchronization & Creation
Goal: Ensure every authenticated user (via Firebase) has a corresponding, feature-rich profile in your Supabase public.users table.
Frontend Action: After any successful Firebase authentication (email/password sign-up/login, Google login), the frontend obtains the Firebase ID Token (user.getIdToken()).
Backend Interaction: POST /api/v1/auth/verify-and-sync-profile
Purpose: To verify the Firebase ID Token on the backend and either create a new entry or retrieve an existing entry for the user in the public.users table.
Expected Frontend Request Data:
Headers: Authorization: Bearer <Firebase_ID_Token>
Body: { "full_name": "string" } (optional, for initial profile if available from Firebase user data).
Backend Logic (POST /api/v1/auth/verify-and-sync-profile):
Rate Limiting (New): @limiter.limit("10/minute") applied to this endpoint (per IP address).
Authentication (Firebase Token Verification - Dependency): Extracts the Firebase_ID_Token from the Authorization header. Uses firebase_admin.auth.verify_id_token() to securely validate the token's signature, expiration, and issuer. Extracts firebase_uid, email, and name from the decoded token. This firebase_uid will be stored on request.state for potential use by custom key_func for future user-specific limits.
User Service Call: Invokes a service method (e.g., user_service.create_or_get_user_profile).
Database Lookup: The service method queries public.users to check if a record exists with the extracted firebase_uid or email.
Profile Creation (If New): If no user is found, a new row is inserted into public.users with:
id: A new UUID generated by the backend.
firebase_uid: The unique ID from Firebase.
email: From the Firebase token.
full_name: From the Firebase token (if available) or the request body.
onboarding_complete: FALSE
partnership_status: 'none'
Other default fields (created_at, updated_at).
Welcome Email: Triggers a "Welcome to DuoTrak" email via Resend to the new user.
Response: Returns the created or retrieved user's full profile from public.users (e.g., {"user_id": "uuid", "email": "string", "full_name": "string", "onboarding_complete": false, "partnership_status": "none"}).
Security:
Rate Limiting: Prevents abuse and resource exhaustion on this critical endpoint.
JWT Verification: Crucial for establishing trust between frontend and backend. Prevents unauthorized access or forged identities.
Data Integrity: Ensures public.users is always in sync with authenticated Firebase users.
Idempotency: The "create or get" logic prevents duplicate user entries if the frontend calls this endpoint multiple times.
Local Development Consideration: During local development, the Firebase Admin SDK will load the service account key from a local file (firebase-adminsdk.json). slowapi will connect to your local Redis (if configured) or the Upstash instance using the REDIS_URL from .env.
Deployment Change: In production (Cloud Run), the Firebase Service Account Key JSON content will be loaded from a secure environment variable (e.g., FIREBASE_SERVICE_ACCOUNT_JSON), and the REDIS_URL will point to your Upstash Redis instance via Cloud Run's environment variables.
3.4. User Onboarding Status Retrieval
Goal: Frontend needs to determine the user's current progress in the onboarding flow to render the correct UI.
Frontend Action: Called from a central layout or context provider immediately after the user is authenticated and their profile synced.
Backend Interaction: GET /api/v1/users/me/status
Purpose: To fetch the current user's complete DuoTrak profile and calculated onboarding state.
Expected Frontend Request Data:
Headers: Authorization: Bearer <Firebase_ID_Token>
Backend Logic (GET /api/v1/users/me/status):
Authentication (Firebase Token Verification - Dependency): Validates the incoming Firebase ID Token and extracts the firebase_uid.
Database Lookup: Retrieves the user's profile from public.users using their firebase_uid.
Status Calculation: Determines onboarding_complete (e.g., based on partner_id presence or explicit flag), partner_id, and invitation_status (by checking public.invitations table for sent/received pending invites related to this user).
Response: Returns a comprehensive status object (e.g., {"user_id": "uuid", "full_name": "string", "email": "string", "avatar_url": "string | null", "onboarding_complete": "boolean", "partner_id": "uuid | null", "invitation_status": "pending_sent | pending_received | none"}).
Security:
Authentication Required: Only an authenticated user can retrieve their own status.
User Scope: Ensures a user can only query their own profile data (me endpoint concept).
Rate Limiting: Covered by the default_limits applied globally via SlowAPIMiddleware.
3.5. Partner Invitation
Goal: Allow an authenticated user to invite another person to be their partner.
Frontend Action: User submits partner's email.
Backend Interaction: POST /api/v1/invitations/send
Purpose: Creates an invitation record, associates it with the inviting user, and sends an invitation email.
Expected Frontend Request Data:
Headers: Authorization: Bearer <Firebase_ID_Token>
Body: { "recipient_email": "string" }
Backend Logic (POST /api/v1/invitations/send):
Rate Limiting (New - Per-User): @limiter.limit("5/hour", key_func=get_user_id_from_state) applied to this endpoint. The get_user_id_from_state function ensures the limit is enforced per authenticated Firebase user ID (firebase_uid).
Authentication (Firebase Token Verification - Dependency): Validates the token, extracts the firebase_uid of the sender and stores it on request.state.
Input Validation: Ensures recipient_email is valid format.
Business Logic Validation:
Checks if the sender_user_id (from public.users using firebase_uid) already has an active partnership or a pending outgoing invitation.
Checks if recipient_email is already linked to an existing user who is already partnered or has a pending incoming invitation.
Ensures recipient_email is not the sender's own email.
Invitation Code Generation: Generates a cryptographically secure, unique, and non-guessable invitation_code (e.g., a UUID or a strong random string).
Expiration: Sets an expires_at timestamp for the invitation (e.g., 48 hours from creation).
Database Write: Inserts a new record into public.invitations: sender_user_id (from public.users), recipient_email, invitation_code, status='pending', created_at, expires_at.
Sender Status Update: Updates the partnership_status of the sender_user_id in public.users to 'pending_sent'.
Email Sending (Resend): Calls the Resend API to send an email to recipient_email containing the invitation link (e.g., https://duotrak.com/invite-acceptance?code=<invitation_code>).
Response: Returns {"message": "Invitation sent successfully."}.
Security:
Rate Limiting: Crucial for preventing email spam and protecting your Resend reputation/quotas.
Authentication Required: Only authenticated users can send invitations.
Input Validation: Prevents malformed emails.
Business Logic Validation: Prevents sending redundant invitations, self-invites, or inviting already-partnered users.
Secret Code: The invitation_code is secret and sent only via email, not returned to the frontend.
3.6. Partner Acceptance
Goal: Atomically link two users together as partners upon invitation acceptance.
Frontend Action: An invited user (now authenticated via Firebase) lands on invite-acceptance page with an invitation_code in the URL, and confirms acceptance.
Backend Interaction: POST /api/v1/invitations/accept
Purpose: Validates the invitation, links the two user profiles in the database, and marks the invitation as accepted.
Expected Frontend Request Data:
Headers: Authorization: Bearer <Firebase_ID_Token> (of the accepting user)
Body: { "invitation_code": "string" }
Backend Logic (POST /api/v1/invitations/accept):
Authentication (Firebase Token Verification - Dependency): Validates the token, extracts the firebase_uid of the accepting_user_id.
Transaction Boundary: All database operations within this endpoint must be wrapped in a database transaction to ensure atomicity (all succeed or all fail).
Invitation Retrieval: Fetches the invitation record from public.invitations using the provided invitation_code.
Critical Business Logic & Security Validations (within transaction):
Invitation Existence & Status: The invitation must exist, and its status must be 'pending'.
Expiration: The invitation.expires_at must be in the future.
Recipient Match: The invitation.recipient_email must exactly match the email of the accepting_user_id (from their public.users profile linked by firebase_uid).
Partnership Status Check:
The accepting_user_id must not currently have an active partner (partnership_status not 'linked').
The sender_user_id (from the invitation) must not currently have an active partner (partnership_status not 'linked').
Self-Acceptance: The accepting_user_id must not be the same as the sender_user_id.
Database Updates (If Validations Pass):
Update the invitation record: Set status='accepted', accepted_at=NOW().
Update the public.users table for both users:
For sender_user_id: Set current_partner_id = accepting_user_id, partnership_status = 'linked'.
For accepting_user_id: Set current_partner_id = sender_user_id, partnership_status = 'linked'.
Email Confirmation (Resend): Send confirmation emails to both partners using Resend, informing them of the successful partnership.
Response: Returns {"message": "Partnership confirmed!"}.
Security:
Rate Limiting: Covered by the default_limits applied globally via SlowAPIMiddleware. Specific per-user limits could be added here in the future if needed.
Authentication Required: Only an authenticated invited user can accept an invite.
Atomic Transactions: Prevents data inconsistencies from partial updates.
Comprehensive Validations: Stops acceptance of invalid, expired, or irrelevant invitations, and prevents multiple partnerships or self-partnerships.
3.7. "Skip Partner Setup" Option
Goal: Allow users to complete onboarding without forming an immediate partnership.
Frontend Action: User clicks a "Skip Partner Setup for now" button.
Backend Interaction: PUT /api/v1/users/me/complete-onboarding-solo
Purpose: Marks the user's onboarding as complete in their profile without creating a partnership.
Expected Frontend Request Data:
Headers: Authorization: Bearer <Firebase_ID_Token>
Body: None (or a simple confirmation field if needed).
Backend Logic (PUT /api/v1/users/me/complete-onboarding-solo):
Authentication (Firebase Token Verification - Dependency): Validates the token, extracts the firebase_uid of the user.
Business Logic Validation: Ensure the user does not currently have an active partnership or a pending invitation (if you want to prevent skipping if they have an active invite).
Database Update: Updates the public.users record for the user: Set onboarding_complete=true, partnership_status='none'.
Response: Returns {"message": "Onboarding completed successfully."}.
Security:
Rate Limiting: Covered by the default_limits applied globally via SlowAPIMiddleware.
Authentication Required: Only authenticated users can update their own status.
User Scope: Ensures a user can only modify their own data.
4. General Security Measures (Applied Globally)
These measures are critical for both local development (to catch issues early) and production deployment.

HTTPS Everywhere:
Local Development: FastAPI runs on http://localhost:8000 by default. The frontend will also run on http://localhost:3000. This is acceptable for local development.
Deployment: Google Cloud Run automatically provides HTTPS for your custom domains, ensuring all communication between your frontend and backend (and to Firebase Auth, Supabase, Upstash) is encrypted in transit. ALWAYS use https:// for production API calls.
Input Validation (Pydantic Models):
All incoming request bodies and query parameters will be validated using FastAPI's integration with Pydantic. This prevents common injection vulnerabilities and malformed data.
Authentication Middleware / Dependency:
A dedicated Depends function (get_firebase_user) will intercept every protected API request. It will verify the Authorization: Bearer <Firebase_ID_Token> header using firebase_admin.auth.verify_id_token(), handle failures, and pass the firebase_uid to the route handler (and store on request.state).
Authorization (User-Scoped Access):
For me endpoints, the backend ensures the requested resource belongs to the authenticated user.
For actions like sending/accepting invitations, the backend verifies that the authenticated user has the privilege to perform that action and that the action relates to their invitations.
Row Level Security (RLS) in Supabase: (Future consideration, more for direct Supabase client access) Provides an additional layer of defense by enforcing access policies directly at the database level.
Sensitive Data Handling:
Passwords: Never stored or handled by your backend. Firebase Auth securely manages password hashing and storage.
API Keys/Secrets (.env for local, Cloud Run ENV vars for prod):
REDIS_URL (Upstash)
FIREBASE_SERVICE_ACCOUNT_JSON (Firebase Admin SDK)
RESEND_API_KEY
DATABASE_URL (Supabase PostgreSQL)
NEVER commit .env files to Git!
Error Handling:
FastAPI will catch exceptions and return meaningful HTTP error codes (e.g., 400, 401, 403, 404, 409, 429, 500).
Error messages will be informative but will not leak sensitive internal information.
Logging: Implement structured logging to capture errors, warnings, and important events. Crucial for debugging and security auditing.
5. Scalability & Cost Considerations
Firebase Authentication: Handles millions of users and scales automatically within its generous free tier.
Supabase PostgreSQL: A highly scalable managed database service, with a generous free tier.
Cloud Run: Provides automatic horizontal scaling based on request load, with a very generous free tier (2 million requests/month).
Upstash Redis: Provides a serverless, highly available, and scalable Redis instance. Its free tier is very likely sufficient for rate limiting for a significant period, aligning perfectly with your cost-conscious approach. When you grow, the pay-as-you-go pricing is predictable and affordable.
Stateless Backend: FastAPI is inherently stateless, ideal for horizontal scaling.
Asynchronous Operations: FastAPI and asyncpg (for SQLAlchemy) leverage Python's async/await to handle I/O-bound tasks efficiently.
Background Tasks (Future): For long-running operations like high-volume email sending (beyond Resend's free tier, or if latency is critical), offloading to Pub/Sub and separate Cloud Run workers is the scalable path, keeping API response times fast.
## 5. Production Readiness & Deployment Strategy

### Deployment Platforms
*   **Frontend:** The Next.js frontend is deployed on **Vercel**, leveraging its integrated build and hosting capabilities.
*   **Backend:** The FastAPI backend is deployed as a containerized application on **Google Cloud Run**, utilizing its serverless and auto-scaling features.

### Environment Variables in Production
*   **Backend (Google Cloud Run):** Sensitive configurations (like `FIREBASE_SERVICE_ACCOUNT_JSON`, `DATABASE_URL`, `REDIS_URL`, `RESEND_API_KEY`) are provided to the Cloud Run service as environment variables. These variables will contain the production-specific values.
*   **Frontend (Vercel):** Frontend public API keys (e.g., `NEXT_PUBLIC_FIREBASE_...`) are configured as environment variables in Vercel and securely injected into the Next.js build.

### Cookie Handling in Production
*   **`Domain` Attribute:** In production, the `auth_token` session cookie will have its `Domain` attribute explicitly set to your actual production frontend domain (e.g., `duotrak.com`).
*   **`Secure` Attribute:** The `Secure=true` cookie attribute is essential in production, ensuring the cookie is only sent over HTTPS connections.
*   **`HttpOnly` & `SameSite`:** These attributes (`HttpOnly` for preventing client-side script access, `SameSite=Lax` for CSRF protection) remain crucial and will be consistently applied in production.

### Next.js Proxy Role
The `next.config.mjs` rewrite rule continues to be vital in production. It ensures that API calls from the frontend are proxied through the Vercel-hosted Next.js server to the Cloud Run backend. This makes the cookie appear as if it's issued by the frontend's origin, allowing the browser to securely store and send it.

### Firebase Admin SDK in Production
The `firebase-adminsdk.json` file itself is **not** deployed. Instead, its contents are provided to Cloud Run via the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable, which the backend loads and parses at startup.

### Rate Limiting in Production
The `REDIS_URL` environment variable will point to your provisioned Upstash Redis instance in production, enabling distributed rate limiting that works correctly across potentially multiple horizontally scaled Cloud Run instances.

### HTTPS Everywhere
Both Vercel and Google Cloud Run automatically provide and enforce HTTPS for all traffic.

### Scalability & Cost Efficiency
Cloud Run provides automatic horizontal scaling based on request load, scaling from zero to many instances and down when idle, fitting a cost-conscious approach by paying only for resources consumed.
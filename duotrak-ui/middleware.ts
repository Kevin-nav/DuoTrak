import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// --- Route Definitions ---
const SESSION_COOKIE_NAME = "__session"

// Publicly accessible pages
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/invite-acceptance", "/invite", "/auth/signup"]

// Routes that an authenticated user should NOT be able to access
const AUTH_REDIRECT_ROUTES = ["/login", "/signup"]

// Core application routes
const ONBOARDING_ROUTE = "/onboarding"
const INVITER_SETUP_ROUTE = "/onboarding/setup"
const INVITE_PARTNER_ROUTE = "/invite-partner"
const PENDING_INVITE_ROUTE = "/invite-partner/pending"
const WAITING_ROOM_ROUTE = "/waiting-room"
const PARTNERSHIP_CONFIRMATION_ROUTE = "/auth/partnership-confirmation"
const DASHBOARD_ROUTE = "/dashboard"

// --- Type Definitions ---
type AccountStatus = "AWAITING_ONBOARDING" | "AWAITING_PARTNERSHIP" | "ONBOARDING_PARTNERED" | "ACTIVE"

interface MiddlewareStatusResponse {
  account_status: AccountStatus
  has_pending_invitation: boolean
  invitation_token?: string
  partner_info?: {
    name: string
    email: string
    avatar?: string
  }
}

// --- Main Middleware Logic ---

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value

  // Allow Next.js specific paths and static files to pass through
  if (pathname.startsWith("/_next/") || pathname.includes(".")) {
    return NextResponse.next()
  }

  // Allow all API routes to pass through; they have their own auth checks.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Handle invitation acceptance flow
  if (pathname.startsWith("/invite/")) {
    // Extract token from URL
    const token = pathname.split("/invite/")[1]
    if (token && !sessionCookie) {
      // Redirect to signup with invitation context
      const url = request.nextUrl.clone()
      url.pathname = "/auth/signup"
      url.searchParams.set("invitation", token)
      return NextResponse.redirect(url)
    }
  }

  // --- Unauthenticated User Logic ---
  if (!sessionCookie) {
    // If trying to access a protected route, redirect to login
    if (!PUBLIC_ROUTES.includes(pathname) && !pathname.startsWith("/invite/")) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
    // Otherwise, allow access to public routes
    return NextResponse.next()
  }

  // --- Authenticated User Logic ---

  // The backend URL must be read from an environment variable.
  const backendUrl = process.env.FASTAPI_URL || "http://localhost:8000"

  // Fetch the user's real-time status from our backend endpoint
  const statusApiUrl = `${backendUrl}/api/v1/users/me/status`

  let response: NextResponse

  try {
    const statusResponse = await fetch(statusApiUrl, {
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}`,
      },
    })

    // If the session is invalid (e.g., expired token), the API will return 401
    if (!statusResponse.ok) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      const redirectResponse = NextResponse.redirect(url)
      // Clear the invalid cookie
      redirectResponse.cookies.delete(SESSION_COOKIE_NAME)
      return redirectResponse
    }

    const status: MiddlewareStatusResponse = await statusResponse.json()

    // --- State-Based Routing ---

    // If user is on a page like /login or /signup, redirect them based on status
    if (AUTH_REDIRECT_ROUTES.includes(pathname)) {
      switch (status.account_status) {
        case "AWAITING_ONBOARDING":
          return NextResponse.redirect(new URL(INVITE_PARTNER_ROUTE, request.url))
        case "AWAITING_PARTNERSHIP":
          return NextResponse.redirect(new URL(WAITING_ROOM_ROUTE, request.url))
        case "ONBOARDING_PARTNERED":
          return NextResponse.redirect(new URL(ONBOARDING_ROUTE, request.url))
        case "ACTIVE":
          return NextResponse.redirect(new URL(DASHBOARD_ROUTE, request.url))
      }
    }

    switch (status.account_status) {
      case "AWAITING_ONBOARDING":
        // Force user to the invite page if they have not yet sent an invitation.
        if (pathname !== INVITE_PARTNER_ROUTE) {
          return NextResponse.redirect(new URL(INVITE_PARTNER_ROUTE, request.url))
        }
        break

      case "AWAITING_PARTNERSHIP":
        // If the user has sent an invitation, show them the waiting room
        if (status.has_pending_invitation) {
          // Allow access to the waiting room and setup pages
          if (
            pathname !== WAITING_ROOM_ROUTE &&
            pathname !== INVITER_SETUP_ROUTE &&
            pathname !== PENDING_INVITE_ROUTE
          ) {
            return NextResponse.redirect(new URL(WAITING_ROOM_ROUTE, request.url))
          }
        } else {
          // If they haven't sent an invite yet, force them to the invite page.
          if (pathname !== INVITE_PARTNER_ROUTE) {
            return NextResponse.redirect(new URL(INVITE_PARTNER_ROUTE, request.url))
          }
        }
        break

      case "ONBOARDING_PARTNERED":
        // User has a partner but hasn't completed onboarding
        if (pathname !== ONBOARDING_ROUTE && pathname !== PARTNERSHIP_CONFIRMATION_ROUTE) {
          return NextResponse.redirect(new URL(ONBOARDING_ROUTE, request.url))
        }
        break

      case "ACTIVE":
        // If an active user tries to access onboarding or invite pages, redirect to dashboard.
        const restrictedPaths = [
          ONBOARDING_ROUTE,
          INVITER_SETUP_ROUTE,
          INVITE_PARTNER_ROUTE,
          PENDING_INVITE_ROUTE,
          WAITING_ROOM_ROUTE,
          PARTNERSHIP_CONFIRMATION_ROUTE,
        ]

        if (restrictedPaths.includes(pathname)) {
          return NextResponse.redirect(new URL(DASHBOARD_ROUTE, request.url))
        }
        break

      default:
        // Fallback for any unknown status: redirect to login
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
    }

    // Add status information to headers for components to use
    response = NextResponse.next()
    response.headers.set("x-user-status", status.account_status)
    response.headers.set("x-has-pending-invitation", status.has_pending_invitation.toString())

    if (status.partner_info) {
      response.headers.set("x-partner-info", JSON.stringify(status.partner_info))
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    // On error, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }
}

// --- Matcher Configuration ---
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

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

  

  // --- Authenticated User Logic ---

  let response: NextResponse

  try {
    // Simulate backend response for frontend-only application
    const status: MiddlewareStatusResponse = {
      account_status: "ACTIVE", // Simulate an active user
      has_pending_invitation: false,
    }

    // --- State-Based Routing ---

    

    switch (status.account_status) {
      case "ACTIVE":
        // For an active user in a frontend-only app, allow access to all pages.
        return NextResponse.next()
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
    // In frontend-only mode, simply proceed to the next response on error.
    return NextResponse.next()
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

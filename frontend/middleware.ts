import { NextResponse } from "@vercel/edge";
import type { NextRequest } from "@vercel/edge";

/**
 * Vercel Edge Middleware — Mobile Route Guard
 *
 * Runs on Vercel's servers BEFORE any HTML/JS is returned to the client.
 * Protects all /mobile/* routes so only the Capacitor APK (Android + iOS)
 * can access them. Regular browsers are redirected to /admin/login.
 *
 * How it works:
 *   - capacitor.config.ts sets `appendUserAgent: "SendResQPls-App"` for both
 *     Android and iOS. This makes the native WebView append that string to
 *     every HTTP request at the OS level — not JavaScript.
 *   - This middleware reads the User-Agent header. If "SendResQPls-App" is
 *     present => it is the real app => let it through. If not => block it.
 */
export function middleware(request: NextRequest) {
  const ua = request.headers.get("user-agent") || "";
  const isApp = ua.includes("SendResQPls-App");

  if (!isApp) {
    // Not the app — redirect to admin login
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // It is the Capacitor APK — allow the request through
  return NextResponse.next();
}

// Only apply this guard to /mobile and all paths below it
export const config = {
  matcher: ["/mobile", "/mobile/:path*"],
};

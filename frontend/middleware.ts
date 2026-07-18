/**
 * Vercel Edge Middleware — Mobile Route Guard
 *
 * Runs on Vercel's edge servers BEFORE any HTML/JS is returned to the client.
 * Uses native Web APIs (Request / Response) — no Next.js imports needed for
 * a non-Next.js Vite project.
 *
 * How it works:
 *   capacitor.config.ts sets `appendUserAgent: "SendResQPls-App"` for both
 *   Android and iOS. The native WebView appends that token to every request
 *   at the OS level (not JavaScript), so regular browsers cannot spoof it casually.
 *
 *   If the token is present  → the request is from the APK → allowed through.
 *   If the token is absent   → regular browser visitor   → redirected to /admin/login.
 */
export default function middleware(request: Request): Response | undefined {
  const ua = request.headers.get('user-agent') ?? '';

  if (!ua.includes('SendResQPls-App')) {
    // Block: not the app — send to admin login
    return Response.redirect(new URL('/admin/login', request.url), 302);
  }

  // Allow: it is the Capacitor APK — return undefined to continue normally
  return undefined;
}

// Only guard /mobile and every path under it
export const config = {
  matcher: ['/mobile', '/mobile/:path*'],
};

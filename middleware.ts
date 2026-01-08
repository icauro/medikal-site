import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  const { pathname } = req.nextUrl;
  const isOnAdminRoute = pathname.startsWith("/admin");
  const isOnLoginPage = pathname.startsWith("/admin/login");

  // Allow access to login page
  if (isOnLoginPage) {
    return NextResponse.next();
  }

  // Protect admin routes
  if (isOnAdminRoute) {
    if (!token) {
      // Not logged in, redirect to login
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // Check if user is admin
    if (token.role !== "admin") {
      // Not an admin, redirect to home
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

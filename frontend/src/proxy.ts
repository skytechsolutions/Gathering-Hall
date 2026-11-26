import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const token = request.cookies.get("auth_token")?.value;

  // Root redirect
  if (url.pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const isSuperAdminPath = url.pathname.startsWith("/super-admin");
  const isOwnerDashboardPath = url.pathname.startsWith("/dashboard");

  if (!isSuperAdminPath && !isOwnerDashboardPath) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/", "/super-admin/:path*", "/dashboard/:path*"],
};

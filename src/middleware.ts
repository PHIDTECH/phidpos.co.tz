import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const session = req.auth;
  const path = req.nextUrl.pathname;

  const protectedPaths = [
    "/dashboard", "/pos", "/products", "/inventory", "/customers",
    "/suppliers", "/purchases", "/reports", "/accounting", "/settings", "/subscription",
  ];

  const isProtected = protectedPaths.some((p) => path.startsWith(p));

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pos/:path*",
    "/products/:path*",
    "/inventory/:path*",
    "/customers/:path*",
    "/suppliers/:path*",
    "/purchases/:path*",
    "/reports/:path*",
    "/accounting/:path*",
    "/settings/:path*",
    "/subscription/:path*",
  ],
};

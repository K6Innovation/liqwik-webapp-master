import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token: any = req.nextauth?.token;
    const path = req.nextUrl.pathname;

    // Allow access to all auth pages without authentication
    if (path.startsWith("/auth/")) {
      return NextResponse.next();
    }

    // Allow access to static assets
    if ([
      "/liqwik-icon.jpeg",
      "/liqwik-token-dark-green.png",
      "/Silver-token.png",
      "/liqwik-token-v2.png",
      "/gold_liqwik_token.png",
      "/liqwik-icon-v1.png",
      "/assets_bar_chart.png",
      "/liqwik-token.png"
    ].includes(path) ||
      path.startsWith("/_next") ||
      path.startsWith("/api/auth") ||
      path.startsWith("/favicon") ||
      path.startsWith("/uploads/")) {
      return NextResponse.next();
    }

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // Get the selected role from token (set during login role selection)
    const selectedRole = token?.selectedRole;
    const selectedUserRoleId = token?.selectedUserRoleId;
    const userId = token?.id;

    // If user hasn't selected a role yet but has multiple roles, 
    // they should complete the login flow
    if (!selectedRole && token?.roles?.length > 1) {
      // Allow them to continue to complete login
      return NextResponse.next();
    }

    // Use the first role if no role was explicitly selected (single role users)
    const role = selectedRole || token?.roles?.[0];

    // Handle root path - redirect to appropriate dashboard
    if (path === "/" || path === "") {
      switch (role) {
        case "buyer":
          return NextResponse.redirect(new URL(`/buyers/${userId}`, req.url));
        case "seller":
          return NextResponse.redirect(new URL(`/sellers/${userId}`, req.url));
        case "admin":
          return NextResponse.redirect(new URL(`/admin/${userId}`, req.url));
        default:
          return NextResponse.next();
      }
    }

    // Role-specific path checks using selected role
    const buyerRegex = new RegExp(`^/buyers/${userId}`);
    const sellerRegex = new RegExp(`^/sellers/${userId}`);
    const billToPartyRegex = new RegExp(`^/bill-to-parties/${userId}`);
    const adminRegex = new RegExp(`^/admin/${userId}`);

    // Redirect users to their appropriate section based on SELECTED role
    if (role === "buyer" && !path.match(buyerRegex)) {
      // If user is in another role's area, redirect to buyer's dashboard
      if (path.match(/^\/sellers\//) || path.match(/^\/bill-to-parties\//) || path.match(/^\/admin\//)) {
        return NextResponse.redirect(new URL(`/buyers/${userId}`, req.url));
      }
    }

    if (role === "seller" && !path.match(sellerRegex)) {
      // If user is in another role's area, redirect to seller's dashboard
      if (path.match(/^\/buyers\//) || path.match(/^\/bill-to-parties\//) || path.match(/^\/admin\//)) {
        return NextResponse.redirect(new URL(`/sellers/${userId}`, req.url));
      }
    }

    if (role === "billToParty" && !path.match(billToPartyRegex)) {
      // If user is in another role's area, redirect to bill-to-party's dashboard
      if (path.match(/^\/buyers\//) || path.match(/^\/sellers\//) || path.match(/^\/admin\//)) {
        return NextResponse.redirect(new URL(`/bill-to-parties/${userId}`, req.url));
      }
    }

    if (role === "admin" && !path.match(adminRegex)) {
      // If user is in another role's area, redirect to admin's dashboard
      if (path.match(/^\/buyers\//) || path.match(/^\/sellers\//) || path.match(/^\/bill-to-parties\//)) {
        return NextResponse.redirect(new URL(`/admin/${userId}`, req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to ALL auth pages without token
        if (req.nextUrl.pathname.startsWith("/auth/")) {
          return true;
        }
        // For all other pages, require token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    const token: any = req.nextauth?.token;
    const role = token?.roles[0];

    let path = req.nextUrl.pathname;
    if (["/liqwik-icon.jpeg" , "/liqwik-icon.png", "/assets_bar_chart.png"].includes(path)) {
      return NextResponse.next();
    }
    const re = new RegExp(`^/${role}s/${token.id}`);
    if (role === "buyer" && !path.match(re)) {
      if (path.match(/^\/sellers\// )) {
        path = "";
      }
      const newURL = new URL(`buyers/${token.id}/${path}`, req.nextUrl.origin);
      return NextResponse.redirect(newURL);
    } 
    if (role === "seller" && !path.match(re)) {
      if (path.match(/^\/buyers\// )) {
        path = "";
      }
      const newURL = new URL(`sellers/${token.id}/${path}`, req.nextUrl.origin);
      return NextResponse.redirect(newURL);
    }
    if (role === "admin") {
      return NextResponse.redirect(`/admin/${token.id}/${path}`);
    }
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // console.log("authorized", token);
        return !!token;
      },
    },
  },
)

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

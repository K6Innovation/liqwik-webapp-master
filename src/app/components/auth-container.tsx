"use client";

import { SessionProvider, useSession } from "next-auth/react";
import AppContainer from "./app-container";
import ResponsiveBar from "./responsive-bar";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Define auth pages where navbar/footer should be hidden AND where authentication is not required
  const isAuthPage = pathname === "/auth/login" ||
                      pathname === "/auth/register" ||
                      pathname === "/auth/verify-email" ||  // Added this line
                      pathname.startsWith("/api/auth") ||
                      pathname.startsWith("/_next");

  useEffect(() => {
    // Don't redirect on auth pages
    if (isAuthPage) {
      setLoading(false);
      return;
    }

    // If session is loading, wait
    if (status === "loading") {
      return;
    }

    // If user is not authenticated and not on an auth page, redirect to login
    if (status === "unauthenticated") {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // If user is authenticated and on the homepage, redirect to role-specific page
    if (status === "authenticated" && (pathname === "/" || pathname === "")) {
      const user = session?.user as any;
      const userRole = user?.roles?.[0];
      const userId = user?.id;

      if (userRole && userId) {
        switch (userRole) {
          case "buyer":
            router.push(`/buyers/${userId}`);
            break;
          case "seller":
            router.push(`/sellers/${userId}`);
            break;
          case "admin":
            router.push(`/admin/${userId}`);
            break;
          default:
            setLoading(false);
        }
        return;
      }
    }

    // User is authenticated, allow rendering
    setLoading(false);
  }, [status, pathname, router, session, isAuthPage]);

  // Show loading spinner while redirecting (but not on auth pages)
  if (loading && status !== "authenticated" && !isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  // On auth pages, render without navbar/footer
  if (isAuthPage) {
    return <>{children}</>;
  }

  // For authenticated users on protected pages, render with navbar/footer
  return (
    <AppContainer>
      <ResponsiveBar />
      <main className="flex-1 overflow-y-auto p-4">{children}</main>
    </AppContainer>
  );
}

export default function AuthContainer({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthWrapper>{children}</AuthWrapper>
    </SessionProvider>
  );
}
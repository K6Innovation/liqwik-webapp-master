"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    // If no session, redirect will be handled by AuthWrapper
    if (!session) {
      return;
    }

    // If user is authenticated, redirect to role-specific page
    const user = session.user as any;
    const role = user.roles?.[0];
    const userId = user.id;

    if (role === "buyer") {
      router.push(`/buyers/${userId}`);
    } else if (role === "seller") {
      router.push(`/sellers/${userId}`);
    } else if (role === "admin") {
      router.push(`/admin/${userId}`);
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
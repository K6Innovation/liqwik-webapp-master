"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LiqwikWithWallet from "@/app/components/seller/assets/liqwik-with-wallet";

export default function SellerLiqwickPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<string>("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Get current role
  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;
      const selectedRole = user.selectedRole;
      if (selectedRole) {
        setCurrentRole(selectedRole);
      } else if (typeof window !== 'undefined') {
        const storedRole = localStorage.getItem('selectedRole');
        if (storedRole) {
          setCurrentRole(storedRole);
        }
      }
    }
  }, [session]);

  // Verify access and fetch assets
  useEffect(() => {
    if (status === "authenticated" && id && session?.user) {
      const user = session.user as any;
      
      // Check if user ID matches
      if (user.id !== id) {
        router.push(`/sellers/${user.id}/liqwick`);
        return;
      }

      // Check if user has seller role
      const hasSellerRole = user.roles?.includes('seller') || currentRole === 'seller';
      if (!hasSellerRole) {
        if (currentRole === 'buyer') {
          router.push(`/buyers/${user.id}/liqwick`);
        } else {
          router.push('/');
        }
        return;
      }

      setLoading(true);
      fetch(`/api/sellers/${id}/assets`)
        .then((res) => res.json())
        .then((data) => {
          setAssets(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching assets:", error);
          setLoading(false);
        });
    }
  }, [status, id, session, currentRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentRole !== "seller") {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Access Denied</h2>
        <p className="text-gray-600">You need seller privileges to access this page.</p>
      </div>
    );
  }

  return <LiqwikWithWallet assets={assets} />;
}
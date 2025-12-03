"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MarketList from "@/app/components/buyer/assets/marketplace";

export default function BuyerMarketPlacePage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
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

  // Verify access and fetch all assets for marketplace
  useEffect(() => {
    if (status === "authenticated" && id && session?.user) {
      const user = session.user as any;
      
      // Check if user ID matches
      if (user.id !== id) {
        router.push(`/buyers/${user.id}/marketplace`);
        return;
      }

      // Check if user has buyer role
      const hasBuyerRole = user.roles?.includes('buyer') || currentRole === 'buyer';
      if (!hasBuyerRole) {
        if (currentRole === 'seller') {
          router.push(`/sellers/${user.id}/marketplace`);
        } else {
          router.push('/');
        }
        return;
      }

      setLoading(true);
      // Don't add filterByBids parameter - show all assets
      fetch(`/api/buyers/${id}/assets`)
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
      <div className="p-4 grid justify-items-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (currentRole !== "buyer") {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Access Denied</h2>
        <p className="text-gray-600">You need buyer privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Buyer Marketplace</h1>
      <MarketList assets={assets} />
    </div>
  );
}
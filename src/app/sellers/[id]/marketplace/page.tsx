"use client"; 

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MarketList from "@/app/components/seller/assets/marketplace";

export default function SellerMarketPlacePage() {
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

  // Verify access and fetch assets
  useEffect(() => {
    if (status === "authenticated" && id && session?.user) {
      const user = session.user as any;
      
      // Check if user ID matches
      if (user.id !== id) {
        router.push(`/sellers/${user.id}/marketplace`);
        return;
      }

      // Check if user has seller role
      const hasSellerRole = user.roles?.includes('seller') || currentRole === 'seller';
      if (!hasSellerRole) {
        if (currentRole === 'buyer') {
          router.push(`/buyers/${user.id}/marketplace`);
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
      <div className="p-4 grid justify-items-center">
        <span className="loading loading-spinner loading-lg"></span>
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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Seller Marketplace</h1>
      <MarketList assets={assets} />
    </div>
  );
}
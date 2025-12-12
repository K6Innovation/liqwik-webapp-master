"use client"; 

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BuyerWallet from "@/app/components/buyer/assets/wallet";

export default function BuyerWalletPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bids, setBids] = useState<any[]>([]);
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

  // Verify access and fetch bids
  useEffect(() => {
    if (status === "authenticated" && id && session?.user) {
      const user = session.user as any;
      
      // Check if user ID matches
      if (user.id !== id) {
        router.push(`/buyers/${user.id}/wallet`);
        return;
      }

      // Check if user has buyer role
      const hasBuyerRole = user.roles?.includes('buyer') || currentRole === 'buyer';
      if (!hasBuyerRole) {
        if (currentRole === 'seller') {
          router.push(`/sellers/${user.id}/wallet`);
        } else {
          router.push('/');
        }
        return;
      }

      setLoading(true);
      fetch(`/api/buyers/${id}/bids`)
        .then((res) => res.json())
        .then((data) => {
          setBids(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching bids:", error);
          setLoading(false);
        });
    }
  }, [status, id, session, currentRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700">Loading...</div>
        </div>
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

  return <BuyerWallet bids={bids} />;
}
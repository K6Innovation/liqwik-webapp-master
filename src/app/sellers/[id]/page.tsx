"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SellerDashboard from "@/app/components/seller/dashboard";

export default function SellerDashboardPage() {
  const session = useSession();
  const { id } = useParams();
  const [user, setUser] = useState<any>();
  const [currentRole, setCurrentRole] = useState<any>();
  const [data, setData] = useState<any>();
  const [loading, setLoading] = useState(true);

  // Redirect if unauthenticated
  if (session?.status === "unauthenticated") {
    const callbackUrl = window.location.href;
    redirect(`/api/auth/signin?callbackUrl=${encodeURI(callbackUrl)}`);
  }

  useEffect(() => {
    if (session?.status === "authenticated" && session?.data?.user) {
      setUser(session.data.user);
    }
  }, [session]);

  // Get current role from session or localStorage
  useEffect(() => {
    if (user) {
      const selectedRole = user.selectedRole;
      if (selectedRole) {
        setCurrentRole(selectedRole);
      } else if (typeof window !== 'undefined') {
        const storedRole = localStorage.getItem('selectedRole');
        if (storedRole) {
          setCurrentRole(storedRole);
        } else if (user.roles && user.roles.length > 0) {
          setCurrentRole(user.roles[0]);
        }
      }
    }
  }, [user]);

  // Verify user is accessing their own dashboard and has seller role
  useEffect(() => {
    if (user && id && currentRole) {
      // Check if user ID matches the URL parameter
      if (user.id !== id) {
        redirect(`/sellers/${user.id}`);
        return;
      }

      // Check if user has seller role
      const hasSellerRole = user.roles?.includes('seller') || currentRole === 'seller';
      if (!hasSellerRole) {
        // Redirect to appropriate dashboard based on their role
        if (currentRole === 'buyer') {
          redirect(`/buyers/${user.id}`);
        } else {
          redirect('/');
        }
        return;
      }

      // Fetch seller assets
      const dataEndpoint = `/api/sellers/${id}/assets`;
      setLoading(true);
      fetch(dataEndpoint)
        .then((res) => res.json())
        .then((data) => {
          setData(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching assets:", error);
          setLoading(false);
        });
    }
  }, [user, id, currentRole]);

  if (session.status === "loading" || loading) {
    return (
      <div className="p-4 grid justify-items-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (currentRole === "seller") {
    return <SellerDashboard assets={data} />;
  }

  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Access Denied</h2>
      <p className="text-gray-600">You need seller privileges to access this page.</p>
    </div>
  );
}
"use client";

import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import AssetForm from "@/app/components/assets/asset-form";
import { useParams, useRouter, useSearchParams } from "next/navigation";
// Import role-specific Asset components
import SellerAsset from "@/app/components/seller/assets/asset";
import BuyerAsset from "@/app/components/buyer/assets/asset";
import Loading from "@/app/components/widgets/loading";
import { useSession } from "next-auth/react";

type Props = {};

const newAsset: any = {
  billToPartyId: "orgBT2",
  invoiceNumber: "INV-123",
  invoiceDate: dayjs().toDate(),
  faceValue: 10800,
  paymentDate: dayjs().add(1, "month").toDate(),
  proposedDiscount: 11,
  biddingCloseDate: dayjs().add(3, "days").toDate(),
  auctionedUnits: 10,
};

function preprocessAsset(asset: any) {
  const updatedAsset = {
    ...asset,
    faceValue: asset.faceValueInCents / 100,
    invoiceDate: dayjs(asset.invoiceDate).toDate(),
    paymentDate: dayjs(asset.paymentDate).toDate(),
    bidClosingDate: dayjs(asset.bidClosingDate).toDate(),
  };
  return updatedAsset;
}

export default function UnifiedAssetPage({}: Props) {
  const router = useRouter();
  const session = useSession();
  const [user, setUser] = useState<any>();
  const editAsset = useSearchParams().get("edit") === "true";
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<any>(newAsset);
  const [currentRole, setCurrentRole] = useState<string>("");

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

  // Determine user role
  const userRole = useMemo(() => {
    if (!currentRole) return null;
    return currentRole;
  }, [currentRole]);

  // Fetch asset based on role
  useEffect(() => {
    if (!user || !userRole) return;
    
    if (id !== "new") {
      setLoading(true);
      const path = userRole === "buyer" ? "buyers" : "sellers";
      fetch(`/api/${path}/${user.id}/assets/${id}`)
        .then((res) => res.json())
        .then((asset) => {
          setAsset(preprocessAsset(asset));
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching asset:", error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user, id, userRole]);

  const updateAsset = useMemo(() => {
    return (asset: any) => {
      const updatedAsset = preprocessAsset(asset);
      setAsset(updatedAsset);
      
      // Redirect to role-specific asset page
      if (userRole === "seller") {
        router.replace(`/sellers/${user.id}/assets/${asset.id}`);
      } else if (userRole === "buyer") {
        router.replace(`/buyers/${user.id}/assets/${asset.id}`);
      } else {
        router.replace(`/assets/${asset.id}`);
      }
    };
  }, [router, user, userRole]);

  const bidAction = useMemo(() => {
    return async (bidId: string, action: string) => {
      if (!user || !userRole) return;
      
      const apiPath = userRole === "seller" 
        ? `/api/sellers/${user.id}/assets/${asset.id}/bids`
        : `/api/buyers/${user.id}/assets/${asset.id}/bids`;
      
      try {
        const res = await fetch(apiPath, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bidId, action }),
        });
        
        if (res.ok) {
          const updatedData = await res.json();
          if (userRole === "seller") {
            // For sellers, update the asset's bids
            setAsset(preprocessAsset({ ...asset, bids: updatedData }));
          } else {
            // For buyers, update based on response structure
            setAsset(preprocessAsset({ ...asset, bids: updatedData }));
          }
        }
      } catch (error) {
        console.error("Error performing bid action:", error);
      }
    };
  }, [asset, user, userRole]);

  // Render the appropriate Asset component based on user role
  const renderAssetComponent = () => {
    if (!userRole) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Unauthorized Access</h2>
          <p className="text-gray-600">Please log in to view this asset.</p>
        </div>
      );
    }
    
    const editUrl = `/assets/${id}?edit=true`;
    
    if (userRole === "seller") {
      return <SellerAsset asset={asset} bidAction={bidAction} editUrl={editUrl} />;
    } else if (userRole === "buyer") {
      return <BuyerAsset asset={asset} bidAction={bidAction} editUrl={editUrl} />;
    }
    
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Invalid Role</h2>
        <p className="text-gray-600">Your user role is not recognized.</p>
      </div>
    );
  };

  if (loading) {
    return <Loading />;
  }

  if (id === "new" || editAsset) {
    // Only sellers can create/edit assets
    if (userRole === "seller") {
      return <AssetForm asset={asset} postSaveAction={updateAsset} />;
    } else {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600">Only sellers can create or edit assets.</p>
        </div>
      );
    }
  }

  return renderAssetComponent();
}
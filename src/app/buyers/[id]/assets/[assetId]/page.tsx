"use client";

import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Asset from "@/app/components/buyer/assets/asset";
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

export default function BuyerAssetPage({}: Props) {
  const router = useRouter();
  const session = useSession();
  const [user, setUser] = useState<any>();
  const { id, assetId } = useParams();
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<any>(newAsset);
  const [currentRole, setCurrentRole] = useState<string>("");

  useEffect(() => {
    if (session?.status === "authenticated" && session?.data?.user) {
      setUser(session.data.user);
    }
  }, [session]);

  // Get current role
  useEffect(() => {
    if (user) {
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
  }, [user]);

  // Verify access and fetch asset
  useEffect(() => {
    if (!user || !currentRole) return;

    // Check if user ID matches
    if (user.id !== id) {
      router.push(`/buyers/${user.id}/assets/${assetId}`);
      return;
    }

    // Check if user has buyer role
    const hasBuyerRole = user.roles?.includes('buyer') || currentRole === 'buyer';
    if (!hasBuyerRole) {
      router.push('/');
      return;
    }

    if (assetId !== "new") {
      setLoading(true);
      fetch(`/api/buyers/${user.id}/assets/${assetId}`)
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
  }, [user, id, assetId, currentRole, router]);

  const bidAction = useMemo(() => {
    return async (bidId: string, action: string) => {
      const res = await fetch(
        `/api/buyers/${user.id}/assets/${asset.id}/bids`,
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bidId, action }),
        }
      );
      if (res.ok) {
        const updatedBids = await res.json();
        setAsset(preprocessAsset({ ...asset, bids: updatedBids }));
      }
    };
  }, [asset, user]);

  if (loading) {
    return <Loading />;
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
    <Asset
      asset={asset}
      bidAction={bidAction}
      editUrl={`/buyers/${user?.id}/assets/${assetId}?edit=true`}
    />
  );
}
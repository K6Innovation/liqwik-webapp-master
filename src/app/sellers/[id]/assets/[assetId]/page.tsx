"use client";

import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import AssetForm from "@/app/components/assets/asset-form";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Asset from "@/app/components/seller/assets/asset";
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

export default function AssetPage({}: Props) {
  const router = useRouter();
  const session = useSession();
  const [user, setUser] = useState<any>();
  const editAsset = useSearchParams().get("edit") === "true";
  const { assetId } = useParams();
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<any>(newAsset);

  useEffect(() => {
    if (session?.status === "authenticated" && session?.data?.user) {
      setUser(session.data.user);
    }
  }, [session]);

  useEffect(() => {
    if (!user) return;
    if (assetId !== "new") {
      (async () => {
        setLoading(true);
        const asset = await fetch(
          `/api/sellers/${user.id}/assets/${assetId}`
        ).then((res) => res.json());
        setAsset(preprocessAsset(asset));
        setLoading(false);
      })();
    } else {
      setLoading(false);
    }
  }, [user, assetId]);

  const updateAsset = useMemo(() => {
    return (asset: any) => {
      const updatedAsset = preprocessAsset(asset);
      setAsset(preprocessAsset(asset));
      router.replace(`/assets/${asset.id}`);
    };
  }, [asset]);

  const bidAction = useMemo(() => {
    return async (bidId: string, action: string) => {
      const res = await fetch(
        `/api/sellers/${user.id}/assets/${asset.id}/bids`,
        {
          method: "POST",
          body: JSON.stringify({ bidId, action }),
        }
      );
      if (res.ok) {
        const updatedBids = await res.json();
        setAsset(preprocessAsset({ ...asset, bids: updatedBids }));
      }
    };
  }, [asset, user]);

  return (
    <>
      {loading ? (
        <Loading />
      ) : assetId === "new" || editAsset ? (
        <AssetForm asset={asset} postSaveAction={updateAsset} />
      ) : (
        <Asset
          asset={asset}
          bidAction={bidAction}
          editUrl={`/sellers/${user?.id}/assets/${assetId}?edit=true`}
        />
      )}
    </>
  );
}

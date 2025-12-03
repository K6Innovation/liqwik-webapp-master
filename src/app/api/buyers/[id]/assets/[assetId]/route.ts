// src/app/api/buyers/[id]/assets/[assetId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import dayjs from "dayjs";
import CustomError from "@/utils/custom-error";
import { getBuyerOrgs } from "@/utils/api/get-user-orgs";

const assetIncludes = {
  include: {
    billToParty: {
      select: {
        id: true,
        name: true,
      },
    },
  },
};

async function getAssetBids(assetId: string) {
  const bids = await prisma.assetBid.findMany({
    where: {
      assetId,
    },
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          contact: {
            include: {
              user: {
                select: {
                  id: true,
                },
              },
            }
          }
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return bids;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; assetId: string } }
) {
  const userId = params.id;
  const assetId = params.assetId;
  const userOrgs = await getBuyerOrgs({ userId, orgType: "buyer" });
  if (userOrgs.length === 0) {
    throw new CustomError("User is not associated with an Asset Buyer", 400);
  }
  
  // Fetch the asset with all necessary fields including file paths
  const asset: any = await prisma.asset.findUnique({
    where: {
      id: assetId,
    },
    include: {
      billToParty: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!asset) {
    throw new CustomError("Asset not found", 404);
  }

  // Get bids for this asset
  const bids = await getAssetBids(assetId);
  asset.bids = bids;
  
  return NextResponse.json(asset);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const userOrgs = await getBuyerOrgs({ userId, orgType: "buyer" });
    if (userOrgs.length === 0) {
      throw new CustomError("User is not associated with an Asset Buyer", 400);
    }
    const formData = await req.formData();
    const assetId = formData.get("id") as string;
    if (!assetId) {
      throw new CustomError("Asset Id is required", 400);
    }
    const faceValueInCents =
      parseInt((formData.get("faceValue") || "") as string) * 100;
    if (faceValueInCents && isNaN(faceValueInCents)) {
      throw new CustomError("INVALID_REQUEST", 400);
    }
    const invoiceDate = formData.get("invoiceDate") as string;
    if (!invoiceDate) {
      throw new CustomError("Invoice Date is required", 400);
    }
    const paymentDate = formData.get("paymentDate") as string;
    if (!paymentDate) {
      throw new CustomError("Payment Date is required", 400);
    }
    const bidClosingDate = formData.get("bidClosingDate") as string;
    if (!bidClosingDate) {
      throw new CustomError("Bid Closing Date is required", 400);
    }
    const seller = await prisma.assetSeller.findFirst({
      where: {
        id: userOrgs[0].id,
      },
    });
    if (!seller) {
      throw new CustomError("Seller not found", 400);
    }
    const billToPartyId = formData.get("billToPartyId") as string;
    const billToParty = await prisma.billToParty.findFirst({
      where: {
        id: billToPartyId,
      },
    });
    if (!billToParty) {
      throw new CustomError("Bill To Party not found", 400);
    }
    const assetData: any = {
      invoiceNumber: formData.get("invoiceNumber"),
      invoiceDate: dayjs(invoiceDate).toDate(),
      faceValueInCents,
      paymentDate: dayjs(paymentDate).toDate(),
      auctionedUnits: parseInt(formData.get("auctionedUnits") as string),
      bidClosingDate: dayjs(bidClosingDate).toDate(),
    };
    const updatedAsset: any = await prisma.asset.update({
      where: {
        id: assetId,
      },
      data: {
        ...assetData,
        billToParty: {
          connect: {
            id: billToParty.id,
          },
        },
      },
      ...assetIncludes,
    });
    updatedAsset.bids = await getAssetBids(assetId);
    return NextResponse.json(updatedAsset);
  } catch (error: any) {
    console.error("Error updating asset:", error);
    if (error.message === "INVALID_REQUEST") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import dayjs from "dayjs";
import CustomError from "@/utils/custom-error";
import { getSellerOrgs } from "@/utils/api/get-user-orgs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; assetId: string } }
) {
  try {
    const userId = params.id;
    const userOrgs = await getSellerOrgs({ userId, orgType: "seller" });
    if (userOrgs.length === 0) {
      throw new CustomError("User is not associated with an Asset Seller", 400);
    }
    const assetId = params.assetId;
    const asset = await prisma.asset.findUnique({
      where: {
        id: assetId,
      },
      include: {
        bids: {
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    if (!asset) {
      throw new CustomError("Asset not found", 400);
    }
    const { bidId, action } = await req.json();
    const bid = asset.bids.find((b) => b.id === bidId);
    if (!bid) {
      throw new CustomError("Bid not found", 400);
    }
    const update =
      action === "accept"
        ? {
            accepted: true,
            acceptedAt: new Date(),
          }
        : {
            accepted: false,
          };
    await prisma.assetBid.update({
      where: {
        id: bidId,
      },
      data: update,
    });
    const bids = await prisma.assetBid.findMany({
      where: {
        assetId: assetId,
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(bids);
  } catch (error: any) {
    console.log(error);
    const errObj = { status: "error" };
    if (error.message === "INVALID_REQUEST") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

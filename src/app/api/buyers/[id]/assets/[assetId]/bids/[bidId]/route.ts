import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma-client";
import dayjs from "dayjs";
import CustomError from "@/utils/custom-error";
import { getBuyerOrgs } from "@/utils/api/get-user-orgs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; assetId: string; bidId: string } }
) {
  try {
    const userId = params.id;
    const userOrgs = await getBuyerOrgs({ userId, orgType: "buyer" });
    if (userOrgs.length === 0) {
      throw new CustomError("User is not associated with an Asset Buyer", 400);
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
    const bidId = params.bidId;
    const bid = asset.bids.find((b) => b.id === bidId);
    if (!bid) {
      throw new CustomError("Bid not found", 400);
    }
    const formData: any = await req.formData();
    const  totalAmount = formData.get("totalAmount");
    const updatedBid = await prisma.assetBid.update({
      where: {
        id: bidId,
      },
      data: {
        numUnits: 1,
        centsPerUnit: totalAmount * 100,
      },
    });
    return NextResponse.json(updatedBid);
  } catch (error: any) {
    console.log(error);
    const errObj = { status: "error" };
    if (error.message === "INVALID_REQUEST") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
